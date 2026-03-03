from dataclasses import dataclass
from typing import Dict


@dataclass
class GatewayConfig:
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    timeout: int = 30
    max_connections: int = 1000
    enable_cors: bool = True
    enable_rate_limiting: bool = True
    enable_caching: bool = True
    log_level: str = "info"


__all__ = ["GatewayConfig"]
