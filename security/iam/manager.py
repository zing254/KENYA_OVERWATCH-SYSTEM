from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set
from datetime import datetime
from enum import Enum
import uuid
import json
from pathlib import Path


class UserStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class ResourceType(Enum):
    INCIDENT = "incident"
    CAMERA = "camera"
    REPORT = "report"
    USER = "user"
    DISPATCH = "dispatch"
    ANALYTICS = "analytics"
    ADMIN = "admin"


class Action(Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"


@dataclass
class Permission:
    resource: ResourceType
    actions: Set[Action]

    def to_dict(self) -> dict:
        return {
            "resource": self.resource.value,
            "actions": [a.value for a in self.actions]
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Permission":
        return cls(
            resource=ResourceType(data["resource"]),
            actions={Action(a) for a in data["actions"]}
        )


@dataclass
class Role:
    role_id: str
    name: str
    description: str
    permissions: List[Permission]
    is_system_role: bool = False
    created_at: datetime = field(default_factory=datetime.now)

    def has_permission(self, resource: ResourceType, action: Action) -> bool:
        for perm in self.permissions:
            if perm.resource == resource and action in perm.actions:
                return True
        return False

    def to_dict(self) -> dict:
        return {
            "role_id": self.role_id,
            "name": self.name,
            "description": self.description,
            "permissions": [p.to_dict() for p in self.permissions],
            "is_system_role": self.is_system_role,
            "created_at": self.created_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Role":
        data = data.copy()
        data["permissions"] = [Permission.from_dict(p) for p in data.get("permissions", [])]
        data["created_at"] = datetime.fromisoformat(data.get("created_at", datetime.now().isoformat()))
        return cls(**data)


@dataclass
class User:
    user_id: str
    username: str
    email: str
    password_hash: str
    role_id: str
    status: UserStatus = UserStatus.ACTIVE
    first_name: str = ""
    last_name: str = ""
    phone: str = ""
    department: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None

    def is_locked(self) -> bool:
        if self.locked_until and self.locked_until > datetime.now():
            return True
        return False

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "password_hash": self.password_hash,
            "role_id": self.role_id,
            "status": self.status.value,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "department": self.department,
            "created_at": self.created_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "failed_login_attempts": self.failed_login_attempts,
            "locked_until": self.locked_until.isoformat() if self.locked_until else None
        }

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        data = data.copy()
        data["status"] = UserStatus(data.get("status", "active"))
        data["created_at"] = datetime.fromisoformat(data.get("created_at", datetime.now().isoformat()))
        if data.get("last_login"):
            data["last_login"] = datetime.fromisoformat(data["last_login"])
        if data.get("locked_until"):
            data["locked_until"] = datetime.fromisoformat(data["locked_until"])
        return cls(**data)


class IAMManager:
    DEFAULT_ROLES = {
        "admin": {
            "role_id": "admin",
            "name": "Administrator",
            "description": "Full system access",
            "is_system_role": True,
            "permissions": [
                {"resource": "incident", "actions": ["create", "read", "update", "delete"]},
                {"resource": "camera", "actions": ["create", "read", "update", "delete"]},
                {"resource": "report", "actions": ["create", "read", "update", "delete"]},
                {"resource": "user", "actions": ["create", "read", "update", "delete"]},
                {"resource": "dispatch", "actions": ["create", "read", "update", "delete"]},
                {"resource": "analytics", "actions": ["create", "read", "update", "delete"]},
                {"resource": "admin", "actions": ["create", "read", "update", "delete"]},
            ]
        },
        "dispatcher": {
            "role_id": "dispatcher",
            "name": "Dispatcher",
            "description": "Dispatch and incident management",
            "is_system_role": True,
            "permissions": [
                {"resource": "incident", "actions": ["create", "read", "update"]},
                {"resource": "camera", "actions": ["read"]},
                {"resource": "report", "actions": ["create", "read"]},
                {"resource": "dispatch", "actions": ["create", "read", "update"]},
                {"resource": "analytics", "actions": ["read"]},
            ]
        },
        "officer": {
            "role_id": "officer",
            "name": "Officer",
            "description": "Field officer access",
            "is_system_role": True,
            "permissions": [
                {"resource": "incident", "actions": ["read", "update"]},
                {"resource": "camera", "actions": ["read"]},
                {"resource": "report", "actions": ["create", "read"]},
                {"resource": "dispatch", "actions": ["read", "update"]},
            ]
        },
        "viewer": {
            "role_id": "viewer",
            "name": "Viewer",
            "description": "Read-only access",
            "is_system_role": True,
            "permissions": [
                {"resource": "incident", "actions": ["read"]},
                {"resource": "camera", "actions": ["read"]},
                {"resource": "report", "actions": ["read"]},
                {"resource": "analytics", "actions": ["read"]},
            ]
        }
    }

    def __init__(self, storage_path: str = "data/iam"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.users: Dict[str, User] = {}
        self.roles: Dict[str, Role] = {}
        self._load_data()

    def _load_data(self):
        self._load_roles()
        self._load_users()

    def _load_roles(self):
        roles_file = self.storage_path / "roles.json"
        if roles_file.exists():
            with open(roles_file, "r") as f:
                data = json.load(f)
                for role_data in data.get("roles", []):
                    role = Role.from_dict(role_data)
                    self.roles[role.role_id] = role
        else:
            self._initialize_default_roles()

    def _initialize_default_roles(self):
        for role_key, role_data in self.DEFAULT_ROLES.items():
            role_data["permissions"] = [
                Permission.from_dict(p) for p in role_data["permissions"]
            ]
            role = Role(**role_data)
            self.roles[role.role_id] = role
        self._save_roles()

    def _save_roles(self):
        roles_file = self.storage_path / "roles.json"
        data = {"roles": [r.to_dict() for r in self.roles.values()]}
        with open(roles_file, "w") as f:
            json.dump(data, f, indent=2)

    def _load_users(self):
        users_file = self.storage_path / "users.json"
        if users_file.exists():
            with open(users_file, "r") as f:
                data = json.load(f)
                for user_data in data.get("users", []):
                    user = User.from_dict(user_data)
                    self.users[user.user_id] = user

    def _save_users(self):
        users_file = self.storage_path / "users.json"
        data = {"users": [u.to_dict() for u in self.users.values()]}
        with open(users_file, "w") as f:
            json.dump(data, f, indent=2)

    def create_user(self, username: str, email: str, password_hash: str, role_id: str, **kwargs) -> User:
        if any(u.username == username for u in self.users.values()):
            raise ValueError(f"Username {username} already exists")
        
        if any(u.email == email for u in self.users.values()):
            raise ValueError(f"Email {email} already exists")
        
        if role_id not in self.roles:
            raise ValueError(f"Role {role_id} does not exist")
        
        user = User(
            user_id=str(uuid.uuid4()),
            username=username,
            email=email,
            password_hash=password_hash,
            role_id=role_id,
            **kwargs
        )
        
        self.users[user.user_id] = user
        self._save_users()
        
        return user

    def get_user(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)

    def get_user_by_username(self, username: str) -> Optional[User]:
        for user in self.users.values():
            if user.username == username:
                return user
        return None

    def update_user(self, user_id: str, **kwargs) -> Optional[User]:
        if user_id not in self.users:
            return None
        
        user = self.users[user_id]
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        self._save_users()
        return user

    def delete_user(self, user_id: str) -> bool:
        if user_id in self.users:
            del self.users[user_id]
            self._save_users()
            return True
        return False

    def create_role(self, name: str, description: str, permissions: List[Permission]) -> Role:
        role_id = name.lower().replace(" ", "_")
        
        role = Role(
            role_id=role_id,
            name=name,
            description=description,
            permissions=permissions
        )
        
        self.roles[role_id] = role
        self._save_roles()
        
        return role

    def get_role(self, role_id: str) -> Optional[Role]:
        return self.roles.get(role_id)

    def assign_role(self, user_id: str, role_id: str) -> bool:
        if user_id not in self.users or role_id not in self.roles:
            return False
        
        self.users[user_id].role_id = role_id
        self._save_users()
        return True

    def check_permission(self, user_id: str, resource: ResourceType, action: Action) -> bool:
        user = self.get_user(user_id)
        if not user or user.status != UserStatus.ACTIVE:
            return False
        
        role = self.get_role(user.role_id)
        if not role:
            return False
        
        return role.has_permission(resource, action)
