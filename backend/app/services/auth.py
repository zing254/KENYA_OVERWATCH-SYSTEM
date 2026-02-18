"""
Authentication and Authorization System
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import os
import logging

from app.config.database import get_db
from app.models.database import User

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token
security = HTTPBearer()

class AuthService:
    """Authentication service"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate password hash"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            if payload.get("type") != token_type:
                raise JWTError("Invalid token type")
            
            return payload
        except JWTError as e:
            logger.warning(f"Token verification failed: {e}")
            raise
    
    @staticmethod
    async def authenticate_user(db: AsyncSession, username: str, password: str) -> Optional[User]:
        """Authenticate user credentials"""
        try:
            # Query user by username or email
            from sqlalchemy import select
            from sqlalchemy.or_ import or_
            
            stmt = select(User).where(
                or_(User.username == username, User.email == username)
            )
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user and AuthService.verify_password(password, user.password_hash):
                # Update last login
                user.last_login = datetime.utcnow()
                await db.commit()
                return user
            
            return None
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None
    
    @staticmethod
    async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        """Get current authenticated user"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = AuthService.verify_token(credentials.credentials, "access")
            user_id: str = payload.get("sub")
            
            if user_id is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        
        user = await db.get(User, user_id)
        if user is None:
            raise credentials_exception
        
        if not user.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        return user
    
    @staticmethod
    def check_permissions(required_permissions: list):
        """Decorator to check user permissions"""
        def permission_checker(current_user: User = Depends(AuthService.get_current_user)):
            user_permissions = current_user.permissions or []
            
            # Admin has all permissions
            if current_user.role == "admin":
                return current_user
            
            # Check if user has required permissions
            for permission in required_permissions:
                if permission not in user_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Permission '{permission}' required"
                    )
            
            return current_user
        
        return permission_checker
    
    @staticmethod
    def check_role(required_role: str):
        """Decorator to check user role"""
        def role_checker(current_user: User = Depends(AuthService.get_current_user)):
            if current_user.role != required_role and current_user.role != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{required_role}' required"
                )
            
            return current_user
        
        return role_checker

class TokenManager:
    """Token management service"""
    
    def __init__(self):
        self.blacklisted_tokens = set()
    
    def blacklist_token(self, token: str):
        """Add token to blacklist"""
        self.blacklisted_tokens.add(token)
    
    def is_token_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted"""
        return token in self.blacklisted_tokens
    
    def cleanup_expired_tokens(self):
        """Remove expired tokens from blacklist"""
        current_time = datetime.utcnow()
        tokens_to_remove = []
        
        for token in self.blacklisted_tokens:
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                if datetime.utcfromtimestamp(payload['exp']) < current_time:
                    tokens_to_remove.append(token)
            except JWTError:
                tokens_to_remove.append(token)
        
        for token in tokens_to_remove:
            self.blacklisted_tokens.remove(token)

# Audit logging
class AuditLogger:
    """Security audit logging"""
    
    @staticmethod
    async def log_security_event(
        db: AsyncSession,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str = None,
        ip_address: str = None,
        user_agent: str = None,
        old_values: Dict = None,
        new_values: Dict = None
    ):
        """Log security-related event"""
        try:
            from app.models.database import AuditLog
            
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                old_values=old_values,
                new_values=new_values,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            db.add(audit_log)
            await db.commit()
            
            logger.info(f"Audit log created: {action} by user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")

# Password policies
class PasswordPolicy:
    """Password validation policies"""
    
    @staticmethod
    def validate_password(password: str) -> Dict[str, Any]:
        """Validate password against security policies"""
        errors = []
        warnings = []
        
        # Length requirements
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        elif len(password) < 12:
            warnings.append("Consider using a longer password (12+ characters)")
        
        # Complexity requirements
        if not any(c.isupper() for c in password):
            errors.append("Password must contain uppercase letters")
        
        if not any(c.islower() for c in password):
            errors.append("Password must contain lowercase letters")
        
        if not any(c.isdigit() for c in password):
            errors.append("Password must contain numbers")
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("Password must contain special characters")
        
        # Common password patterns
        common_passwords = ["password", "123456", "qwerty", "admin", "letmein"]
        if password.lower() in common_passwords:
            errors.append("Password is too common")
        
        # Repeated characters
        if len(set(password)) < len(password) * 0.6:
            warnings.append("Password contains too many repeated characters")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

# Session management
class SessionManager:
    """User session management"""
    
    def __init__(self):
        self.active_sessions = {}
    
    def create_session(self, user_id: str, session_data: Dict[str, Any]):
        """Create new user session"""
        session_id = f"sess_{user_id}_{datetime.utcnow().timestamp()}"
        self.active_sessions[session_id] = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "data": session_data
        }
        return session_id
    
    def update_session_activity(self, session_id: str):
        """Update session last activity"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["last_activity"] = datetime.utcnow()
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        return self.active_sessions.get(session_id)
    
    def invalidate_session(self, session_id: str):
        """Invalidate session"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
    
    def cleanup_expired_sessions(self):
        """Remove expired sessions (24 hours of inactivity)"""
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        expired_sessions = [
            sess_id for sess_id, sess_data in self.active_sessions.items()
            if sess_data["last_activity"] < cutoff_time
        ]
        
        for sess_id in expired_sessions:
            del self.active_sessions[sess_id]
        
        logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")

# Rate limiting
class RateLimiter:
    """API rate limiting"""
    
    def __init__(self):
        self.request_counts = {}
    
    def is_allowed(
        self, 
        identifier: str, 
        limit: int, 
        window_seconds: int = 60
    ) -> bool:
        """Check if request is allowed"""
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=window_seconds)
        
        if identifier not in self.request_counts:
            self.request_counts[identifier] = []
        
        # Remove old requests outside the window
        self.request_counts[identifier] = [
            req_time for req_time in self.request_counts[identifier]
            if req_time > window_start
        ]
        
        # Check if under limit
        if len(self.request_counts[identifier]) < limit:
            self.request_counts[identifier].append(current_time)
            return True
        
        return False
    
    def cleanup_old_requests(self):
        """Clean up old request records"""
        cutoff_time = datetime.utcnow() - timedelta(hours=1)
        
        for identifier in list(self.request_counts.keys()):
            self.request_counts[identifier] = [
                req_time for req_time in self.request_counts[identifier]
                if req_time > cutoff_time
            ]
            
            if not self.request_counts[identifier]:
                del self.request_counts[identifier]

# Global instances
token_manager = TokenManager()
session_manager = SessionManager()
rate_limiter = RateLimiter()