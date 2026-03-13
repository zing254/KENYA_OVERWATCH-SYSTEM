"""
Kenya NTSA Road Safety - Enhanced Authentication Module
Secure JWT-based authentication with bcrypt password hashing
"""

from fastapi import APIRouter, HTTPException, Depends, Request, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from enum import Enum
import secrets
import logging
import os

from .enums import UserRole as SharedUserRole, UserStatus as SharedUserStatus

logger = logging.getLogger(__name__)

# Re-export shared enums for backward compatibility
UserRole = SharedUserRole
UserStatus = SharedUserStatus

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ==================== SECURITY CONFIG ====================
def _get_jwt_secret() -> str:
    """Get JWT secret key - fails in production if not set"""
    env = os.environ.get("OVERWATCH_ENV", "development")
    secret = os.environ.get("JWT_SECRET_KEY")
    
    if not secret:
        if env == "production":
            raise RuntimeError(
                "FATAL: JWT_SECRET_KEY environment variable is required in production!"
            )
        import secrets
        secret = f"dev-secret-{secrets.token_urlsafe(32)}"
        logger.warning("WARNING: Using auto-generated development secret key")
    return secret


class SecurityConfig:
    """Security configuration"""
    SECRET_KEY: str = _get_jwt_secret()
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS = 30
    BCRYPT_ROUNDS = 12
    
    # Rate limiting
    MAX_LOGIN_ATTEMPTS = 5
    LOGIN_LOCKOUT_MINUTES = 15
    
    # Token settings
    TOKEN_TYPE = "bearer"
    
    # Environment
    ENV: str = os.environ.get("OVERWATCH_ENV", "development")


config = SecurityConfig()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


# ==================== ENUMS ====================
class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


# ==================== PYDANTIC MODELS ====================
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    role: UserRole = UserRole.OFFICER
    badge_number: Optional[str] = None
    station: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    badge_number: Optional[str] = None
    station: Optional[str] = None
    phone: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    badge_number: Optional[str]
    station: Optional[str]
    phone: Optional[str]
    status: UserStatus
    created_at: str
    last_login: Optional[str]
    is_active: bool
    is_verified: bool = False


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: int
    user: UserResponse


class TokenPayload(BaseModel):
    sub: str
    exp: int
    iat: int
    type: TokenType
    role: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class LoginAttempt(BaseModel):
    """Track login attempts for rate limiting"""
    username: str
    attempts: int = 0
    locked_until: Optional[datetime] = None


# ==================== DATABASE (In-Memory with Persistence) ====================
class Database:
    """Simple in-memory database with future SQLite support"""
    
    def __init__(self):
        self.users: dict = {}
        self.login_attempts: dict = {}
        self.refresh_tokens: dict = {}
        self.audit_log: list = []
    
    def add_audit_log(self, event: str, user_id: str, details: dict):
        """Add audit log entry"""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "user_id": user_id,
            "details": details,
            "ip_address": details.get("ip_address", "unknown")
        }
        self.audit_log.append(entry)
        logger.info(f"AUDIT: {event} - User: {user_id}")
        
        # Keep only last 10000 entries
        if len(self.audit_log) > 10000:
            self.audit_log = self.audit_log[-10000:]


db = Database()


# ==================== PASSWORD UTILITIES ====================
def hash_password(password: str) -> str:
    """Hash password using bcrypt - truncate to 72 bytes for bcrypt limit"""
    return pwd_context.hash(password[:72] if len(password) > 72 else password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    return pwd_context.verify(plain_password[:72] if len(plain_password) > 72 else plain_password, hashed_password)


# ==================== JWT TOKEN UTILITIES ====================
def create_access_token(user_id: str, role: UserRole) -> tuple[str, datetime]:
    """Create JWT access token"""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": user_id,
        "role": role.value,
        "type": TokenType.ACCESS.value,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    
    token = jwt.encode(payload, config.SECRET_KEY, algorithm=config.ALGORITHM)
    return token, expire


def create_refresh_token(user_id: str) -> tuple[str, datetime]:
    """Create JWT refresh token"""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = {
        "sub": user_id,
        "type": TokenType.REFRESH.value,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    
    token = jwt.encode(payload, config.SECRET_KEY, algorithm=config.ALGORITHM)
    
    # Store refresh token
    db.refresh_tokens[token] = {
        "user_id": user_id,
        "created_at": now,
        "expires_at": expire
    }
    
    return token, expire


def decode_token(token: str) -> TokenPayload:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        
        # Verify token type
        if payload.get("type") == TokenType.REFRESH.value:
            # Refresh tokens need special handling
            return TokenPayload(**payload)
        
        return TokenPayload(**payload)
        
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_access_token(token: str) -> TokenPayload:
    """Verify access token"""
    payload = decode_token(token)
    
    if payload.type != TokenType.ACCESS.value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


def verify_refresh_token(token: str) -> Optional[str]:
    """Verify refresh token and return user_id"""
    stored = db.refresh_tokens.get(token)
    if not stored:
        return None
    
    if datetime.now(timezone.utc) > stored["expires_at"]:
        del db.refresh_tokens[token]
        return None
    
    return stored["user_id"]


def revoke_refresh_token(token: str):
    """Revoke a refresh token"""
    if token in db.refresh_tokens:
        del db.refresh_tokens[token]


# ==================== RATE LIMITING ====================
def check_login_attempts(username: str) -> bool:
    """Check if account is locked due to failed login attempts"""
    attempt = db.login_attempts.get(username)
    
    if not attempt:
        return True
    
    if attempt.locked_until and datetime.now(timezone.utc) < attempt.locked_until:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Try again later.",
        )
    
    # Reset if lockout period expired
    if attempt.locked_until and datetime.now(timezone.utc) >= attempt.locked_until:
        attempt.attempts = 0
        attempt.locked_until = None
    
    return True


def record_failed_login(username: str):
    """Record failed login attempt"""
    if username not in db.login_attempts:
        db.login_attempts[username] = LoginAttempt(username=username)
    
    attempt = db.login_attempts[username]
    attempt.attempts += 1
    
    if attempt.attempts >= config.MAX_LOGIN_ATTEMPTS:
        attempt.locked_until = datetime.now(timezone.utc) + timedelta(minutes=config.LOGIN_LOCKOUT_MINUTES)
        logger.warning(f"Account locked: {username} due to failed login attempts")
    
    db.add_audit_log("LOGIN_FAILED", username, {"attempts": attempt.attempts})


def record_successful_login(username: str):
    """Record successful login"""
    if username in db.login_attempts:
        db.login_attempts[username].attempts = 0
        db.login_attempts[username].locked_until = None


# ==================== AUTHENTICATION DEPENDENCY ====================
async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme)
) -> UserResponse:
    """Get current authenticated user"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verify_access_token(token)
    user_id = payload.sub
    
    if user_id not in db.users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_data = db.users[user_id]
    
    if not user_data["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )
    
    if user_data["status"] == UserStatus.LOCKED:
        raise HTTPException(
            status_code=403,
            detail="User account is locked",
        )
    
    # Get client IP for audit
    client_ip = request.client.host if request.client else "unknown"
    db.add_audit_log("TOKEN_VERIFIED", user_id, {"ip": client_ip})
    
    return UserResponse(**user_data)


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    current_user: Optional[UserResponse] = Depends(get_current_user)
) -> Optional[UserResponse]:
    """Get current user if authenticated, otherwise None"""
    return current_user


def require_role(allowed_roles: List[UserRole]):
    """Dependency to require specific roles"""
    async def role_checker(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required roles: {[r.value for r in allowed_roles]}",
            )
        return current_user
    return role_checker


# ==================== INITIALIZE DEFAULT USERS ====================
def initialize_default_users():
    """Create default admin and officer accounts - requires setup password"""
    from datetime import timezone
    
    # Get setup password from environment - REQUIRED in production
    setup_password = os.environ.get("INITIAL_SETUP_PASSWORD")
    env = os.environ.get("OVERWATCH_ENV", "development")
    
    if not setup_password:
        if env == "production":
            logger.error(
                "FATAL: INITIAL_SETUP_PASSWORD environment variable is required in production!"
            )
            logger.error("Please set up users via the /api/auth/users endpoint after startup")
            return
        # Use a warning password in development
        setup_password = "DevSetup@2024"
        logger.warning("WARNING: Using default development password - CHANGE IN PRODUCTION!")
    
    # Verify password strength
    if len(setup_password) < 8:
        logger.error("INITIAL_SETUP_PASSWORD must be at least 8 characters")
        return
    
    default_users = [
        {
            "id": "admin_001",
            "username": "admin",
            "email": "admin@ntsa.go.ke",
            "password_hash": hash_password(setup_password),
            "first_name": "System",
            "last_name": "Administrator",
            "role": UserRole.ADMIN,
            "badge_number": "NTSA001",
            "station": "Headquarters",
            "phone": "+254709932000",
            "status": UserStatus.ACTIVE,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None,
            "is_active": True,
            "is_verified": True,
            "must_change_password": True,
        },
        {
            "id": "officer_001",
            "username": "officer",
            "email": "officer@ntsa.go.ke",
            "password_hash": hash_password(setup_password),
            "first_name": "John",
            "last_name": "Njoroge",
            "role": UserRole.OFFICER,
            "badge_number": "NTSA234",
            "station": "Nairobi Central",
            "phone": "+254700123456",
            "status": UserStatus.ACTIVE,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None,
            "is_active": True,
            "is_verified": True,
            "must_change_password": True,
        },
        {
            "id": "dispatcher_001",
            "username": "dispatcher",
            "email": "dispatcher@ntsa.go.ke",
            "password_hash": hash_password(setup_password),
            "first_name": "Mary",
            "last_name": "Wanjiku",
            "role": UserRole.DISPATCHER,
            "badge_number": "NTSA345",
            "station": "Emergency Center",
            "phone": "+254700234567",
            "status": UserStatus.ACTIVE,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None,
            "is_active": True,
            "is_verified": True,
            "must_change_password": True,
        },
        {
            "id": "viewer_001",
            "username": "viewer",
            "email": "viewer@ntsa.go.ke",
            "password_hash": hash_password(setup_password),
            "first_name": "Guest",
            "last_name": "Viewer",
            "role": UserRole.VIEWER,
            "badge_number": None,
            "station": "Public",
            "phone": None,
            "status": UserStatus.ACTIVE,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None,
            "is_active": True,
            "is_verified": True,
            "must_change_password": True,
        },
    ]
    
    for user in default_users:
        db.users[user["id"]] = user
    
    logger.info(f"Initialized {len(default_users)} default users - CHANGE PASSWORDS ON FIRST LOGIN!")


initialize_default_users()


# ==================== AUTH ENDPOINTS ====================
@router.post("/token", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Login and get access token"""
    # Check rate limiting
    check_login_attempts(form_data.username)
    
    # Find user by username
    user = None
    for u in db.users.values():
        if u["username"] == form_data.username:
            user = u
            break
    
    if not user:
        record_failed_login(form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, user["password_hash"]):
        record_failed_login(form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check user status
    if not user["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )
    
    if user["status"] == UserStatus.LOCKED:
        raise HTTPException(
            status_code=403,
            detail="User account is locked. Contact administrator.",
        )
    
    # Record successful login
    record_successful_login(form_data.username)
    
    # Update last login
    user["last_login"] = datetime.now(timezone.utc).isoformat()
    
    # Create tokens
    access_token, access_expire = create_access_token(user["id"], user["role"])
    refresh_token, refresh_expire = create_refresh_token(user["id"])
    
    # Audit log
    client_ip = request.client.host if request.client else "unknown"
    db.add_audit_log("LOGIN_SUCCESS", user["id"], {"ip": client_ip, "role": user["role"].value})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(**user)
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str = Form(...)):
    """Refresh access token using refresh token"""
    
    # Verify refresh token
    user_id = verify_refresh_token(refresh_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user
    if user_id not in db.users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    user = db.users[user_id]
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )
    
    # Revoke old refresh token
    revoke_refresh_token(refresh_token)
    
    # Create new tokens
    access_token, access_expire = create_access_token(user["id"], user["role"])
    new_refresh_token, refresh_expire = create_refresh_token(user["id"])
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(**user)
    )


@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    """Register a new user (admin only)"""
    
    # Check if username exists
    for u in db.users.values():
        if u["username"] == user_data.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
    
    # Check if email exists
    for u in db.users.values():
        if u["email"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user
    user_id = f"user_{len(db.users) + 1:03d}"
    new_user = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "badge_number": user_data.badge_number,
        "station": user_data.station,
        "phone": user_data.phone,
        "status": UserStatus.PENDING,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None,
        "is_active": True,
        "is_verified": False,
    }
    
    db.users[user_id] = new_user
    
    # Audit log
    db.add_audit_log("USER_CREATED", current_user.id, {"new_user_id": user_id, "role": user_data.role.value})
    
    return UserResponse(**new_user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.post("/logout")
async def logout(
    current_user: UserResponse = Depends(get_current_user),
    refresh_token: Optional[str] = Form(None)
):
    """Logout and revoke tokens"""
    
    # Revoke refresh token if provided
    if refresh_token:
        revoke_refresh_token(refresh_token)
    
    # Audit log
    db.add_audit_log("LOGOUT", current_user.id, {"username": current_user.username})
    
    return {"message": "Successfully logged out"}


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: UserResponse = Depends(get_current_user)
):
    """Change password"""
    user = db.users.get(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user["password_hash"]):
        db.add_audit_log("PASSWORD_CHANGE_FAILED", current_user.id, {"reason": "incorrect_current_password"})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    user["password_hash"] = hash_password(password_data.new_password)
    
    # Audit log
    db.add_audit_log("PASSWORD_CHANGED", current_user.id, {})
    
    return {"message": "Password changed successfully"}


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    role: Optional[UserRole] = None,
    user_status: Optional[UserStatus] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """List all users"""
    if current_user.role not in [UserRole.ADMIN, UserRole.DISPATCHER]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions"
        )
    
    users = list(db.users.values())
    
    if role:
        users = [u for u in users if u["role"] == role]
    if user_status:
        users = [u for u in users if u["status"] == user_status]
    
    return [UserResponse(**u) for u in users]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user by ID"""
    if user_id not in db.users:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(**db.users[user_id])


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user details"""
    if user_id not in db.users:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only admin can update other users
    if user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Cannot update other users"
        )
    
    user = db.users[user_id]
    
    # Update fields
    for field, value in user_update.dict(exclude_unset=True).items():
        user[field] = value
    
    # Audit log
    db.add_audit_log("USER_UPDATED", current_user.id, {"target_user": user_id})
    
    return UserResponse(**user)


@router.put("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    status: UserStatus,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user status (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can update user status"
        )
    
    if user_id not in db.users:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.users[user_id]["status"] = status
    db.users[user_id]["is_active"] = status == UserStatus.ACTIVE
    
    # Audit log
    db.add_audit_log("USER_STATUS_CHANGED", current_user.id, {
        "target_user": user_id,
        "new_status": status.value
    })
    
    return UserResponse(**db.users[user_id])


@router.post("/users/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Activate a user (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can activate users"
        )
    
    if user_id not in db.users:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.users[user_id]["status"] = UserStatus.ACTIVE
    db.users[user_id]["is_active"] = True
    db.users[user_id]["is_verified"] = True
    
    db.add_audit_log("USER_ACTIVATED", current_user.id, {"target_user": user_id})
    
    return UserResponse(**db.users[user_id])


@router.post("/users/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Deactivate a user (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can deactivate users"
        )
    
    if user_id not in db.users:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.users[user_id]["status"] = UserStatus.INACTIVE
    db.users[user_id]["is_active"] = False
    
    db.add_audit_log("USER_DEACTIVATED", current_user.id, {"target_user": user_id})
    
    return UserResponse(**db.users[user_id])


@router.get("/verify")
async def verify_token(current_user: UserResponse = Depends(get_current_user)):
    """Verify if token is valid"""
    return {
        "valid": True,
        "user": current_user
    }


@router.get("/audit-log")
async def get_audit_log(
    limit: int = 100,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    """Get audit log (admin only)"""
    return db.audit_log[-limit:]


@router.get("/stats")
async def get_auth_stats(current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))):
    """Get authentication statistics"""
    total_users = len(db.users)
    active_users = len([u for u in db.users.values() if u["is_active"]])
    locked_users = len([u for u in db.users.values() if u["status"] == UserStatus.LOCKED])
    
    by_role = {}
    for u in db.users.values():
        role = u["role"].value
        by_role[role] = by_role.get(role, 0) + 1
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "locked_users": locked_users,
        "by_role": by_role,
    }
