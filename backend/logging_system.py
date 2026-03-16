import logging
from typing import List, Optional, Dict

log = logging.getLogger("ow_system")
log.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
handler.setFormatter(formatter)
log.addHandler(handler)


class LogManager:
    def __init__(self):
        self._logs: List[Dict] = []

    def add(
        self,
        level: str,
        category: str,
        source: str,
        message: str,
        details: Optional[Dict] = None,
    ):
        self._logs.insert(
            0,
            {
                "level": level,
                "category": category,
                "source": source,
                "message": message,
                "details": details,
                "timestamp": "now",
            },
        )
        if len(self._logs) > 1000:
            self._logs = self._logs[:1000]

    def get_logs(
        self,
        level: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ):
        logs = self._logs
        if level:
            logs = [l for l in logs if l.get("level") == level]
        if category:
            logs = [l for l in logs if l.get("category") == category]
        return {"total": len(logs), "logs": logs[offset : offset + limit]}

    def clear_logs(self):
        self._logs.clear()


log_manager = LogManager()


def log_event(
    level: str, category: str, source: str, message: str, details: Optional[Dict] = None
):
    log_event = getattr(log_manager, "add")
    log_event(level, category, source, message, details)
