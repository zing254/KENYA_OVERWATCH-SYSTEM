from fastapi import HTTPException

try:
    from .auth import UserResponse
except ImportError:
    pass


def require_roles(user, *allowed: str) -> None:
    """Lightweight RBAC guard: allow if user's role is in allowed set."""
    role = getattr(user, "role", None)
    if role not in allowed:
        raise HTTPException(
            status_code=403, detail="Forbidden: insufficient permissions"
        )
