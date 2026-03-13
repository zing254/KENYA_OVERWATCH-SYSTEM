"""
Kenya Overwatch - Logging System
Centralized logging with in-memory store for API access
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import threading

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("kenya_overwatch")


@dataclass
class LogEntry:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    level: str = "info"
    category: str = "system"
    source: str = ""
    message: str = ""
    details: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    request_id: Optional[str] = None


class LogManager:
    """In-memory log storage with thread-safe operations"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._logs: List[LogEntry] = []
        self._max_logs = 10000
        self._initialized = True
        logger.info("LogManager initialized")
    
    def add_log(self, entry: LogEntry) -> None:
        """Add a log entry (thread-safe)"""
        with self._lock:
            self._logs.append(entry)
            # Trim old logs if we exceed max
            if len(self._logs) > self._max_logs:
                self._logs = self._logs[-self._max_logs:]
    
    def get_logs(
        self,
        level: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get filtered logs"""
        with self._lock:
            filtered = self._logs
            
            if level and level != 'all':
                filtered = [log for log in filtered if log.level == level]
            if category and category != 'all':
                filtered = [log for log in filtered if log.category == category]
            
            total = len(filtered)
            paginated = filtered[offset:offset + limit]
            
            return {
                "logs": [log.__dict__ for log in paginated],
                "total": total,
                "limit": limit,
                "offset": offset
            }
    
    def clear_logs(self) -> None:
        """Clear all logs"""
        with self._lock:
            self._logs.clear()
        logger.info("All logs cleared")


# Global log manager instance
log_manager = LogManager()


def log_event(
    level: str = "info",
    category: str = "system",
    source: str = "",
    message: str = "",
    details: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Convenience function to log events"""
    entry = LogEntry(
        level=level,
        category=category,
        source=source,
        message=message,
        details=details,
        user_id=user_id,
        ip_address=ip_address,
        request_id=request_id
    )
    log_manager.add_log(entry)
    
    # Also log to Python's logging system
    log_msg = f"[{category}] {source}: {message}"
    if details:
        log_msg += f" | {details}"
    
    if level == "critical" or level == "error":
        logger.error(log_msg)
    elif level == "warning":
        logger.warning(log_msg)
    elif level == "debug":
        logger.debug(log_msg)
    else:
        logger.info(log_msg)


# Convenience logging functions
def log_api(source: str, message: str, **kwargs):
    log_event("info", "api", source, message, **kwargs)

def log_auth(source: str, message: str, **kwargs):
    log_event("info", "auth", source, message, **kwargs)

def log_security(source: str, message: str, level: str = "warning", **kwargs):
    log_event(level, "security", source, message, **kwargs)

def log_incident(source: str, message: str, **kwargs):
    log_event("info", "incident", source, message, **kwargs)

def log_violation(source: str, message: str, **kwargs):
    log_event("info", "violation", source, message, **kwargs)

def log_system(source: str, message: str, **kwargs):
    log_event("info", "system", source, message, **kwargs)

def log_error(source: str, message: str, **kwargs):
    log_event("error", "system", source, message, **kwargs)

def log_critical(source: str, message: str, **kwargs):
    log_event("critical", "system", source, message, **kwargs)