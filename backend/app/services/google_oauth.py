"""
Google OAuth2 Authentication for Citizen Portal
Handles Gmail-based authentication
"""

import os
import json
import httpx
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import Citizen, CitizenVehicle
from app.services.auth import AuthService

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3003/api/auth/callback")

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

SCOPES = [
    "openid",
    "email",
    "profile"
]


class GoogleOAuthService:
    """Google OAuth2 authentication service for citizens"""
    
    @staticmethod
    def get_auth_url(state: str = "") -> str:
        """Generate Google OAuth authorization URL"""
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(SCOPES),
            "access_type": "offline",
            "prompt": "consent",
        }
        if state:
            params["state"] = state
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{GOOGLE_AUTH_URL}?{query_string}"
    
    @staticmethod
    async def exchange_code(code: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": GOOGLE_CLIENT_ID,
                        "client_secret": GOOGLE_CLIENT_SECRET,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": GOOGLE_REDIRECT_URI,
                    }
                )
                if response.status_code == 200:
                    return response.json()
                return None
            except Exception as e:
                print(f"Error exchanging code: {e}")
                return None
    
    @staticmethod
    async def get_userinfo(access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from Google"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if response.status_code == 200:
                    return response.json()
                return None
            except Exception as e:
                print(f"Error getting user info: {e}")
                return None
    
    @staticmethod
    async def authenticate_or_register(
        db: AsyncSession,
        google_id: str,
        email: str,
        name: str,
        picture: Optional[str] = None
    ) -> tuple[Citizen, bool]:
        """
        Authenticate or register a citizen based on Google OAuth
        Returns (citizen, is_new) tuple
        """
        stmt = select(Citizen).where(Citizen.google_id == google_id)
        result = await db.execute(stmt)
        citizen = result.scalar_one_or_none()
        
        is_new = False
        
        if not citizen:
            citizen = Citizen(
                id=google_id.replace("google_", ""),
                google_id=google_id,
                email=email,
                name=name,
                avatar_url=picture,
                email_verified=True,
                notifications_enabled=True
            )
            db.add(citizen)
            is_new = True
        else:
            citizen.name = name
            citizen.avatar_url = picture
            citizen.email_verified = True
        
        await db.commit()
        await db.refresh(citizen)
        
        return citizen, is_new
    
    @staticmethod
    async def create_tokens(citizen: Citizen) -> Dict[str, str]:
        """Create JWT tokens for citizen"""
        access_token = AuthService.create_access_token(
            data={"sub": str(citizen.id), "email": citizen.email, "type": "citizen"}
        )
        refresh_token = AuthService.create_refresh_token(
            data={"sub": str(citizen.id), "email": citizen.email, "type": "citizen"}
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    async def add_vehicle(
        db: AsyncSession,
        citizen_id: str,
        plate_number: str,
        make: str,
        model: str,
        color: str,
        year: Optional[int] = None
    ) -> CitizenVehicle:
        """Add a vehicle to citizen's profile"""
        vehicle = CitizenVehicle(
            citizen_id=citizen_id,
            plate_number=plate_number.upper(),
            make=make,
            model=model,
            color=color,
            year=year,
            notifications_enabled=True
        )
        db.add(vehicle)
        await db.commit()
        await db.refresh(vehicle)
        return vehicle
    
    @staticmethod
    async def get_vehicles(db: AsyncSession, citizen_id: str) -> list[CitizenVehicle]:
        """Get all vehicles for a citizen"""
        stmt = select(CitizenVehicle).where(CitizenVehicle.citizen_id == citizen_id)
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def delete_vehicle(db: AsyncSession, vehicle_id: str) -> bool:
        """Delete a vehicle"""
        stmt = select(CitizenVehicle).where(CitizenVehicle.id == vehicle_id)
        result = await db.execute(stmt)
        vehicle = result.scalar_one_or_none()
        if vehicle:
            await db.delete(vehicle)
            await db.commit()
            return True
        return False
