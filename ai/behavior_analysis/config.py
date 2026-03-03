from dataclasses import dataclass
from .analyzer import BehaviorType


@dataclass
class BehaviorConfig:
    speed_threshold_high: float = 80.0
    speed_threshold_medium: float = 60.0
    acceleration_threshold: float = -5.0
    lane_violation_margin: float = 50.0
    min_history_length: int = 10


__all__ = ["BehaviorConfig", "BehaviorType"]
