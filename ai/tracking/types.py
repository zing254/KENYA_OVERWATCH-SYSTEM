from dataclasses import dataclass


@dataclass
class TrackingConfig:
    max_age: int = 30
    min_hits: int = 3
    iou_threshold: float = 0.3
    max_velocity_diff: float = 100.0


__all__ = ["TrackingConfig"]
