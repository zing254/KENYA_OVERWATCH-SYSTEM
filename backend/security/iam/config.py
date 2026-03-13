from dataclasses import dataclass


@dataclass
class IAMConfig:
    storage_path: str = "data/iam"
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 30
    password_min_length: int = 8
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_digit: bool = True
    password_require_special: bool = False
    session_timeout_minutes: int = 60
    require_email_verification: bool = False


__all__ = ["IAMConfig"]
