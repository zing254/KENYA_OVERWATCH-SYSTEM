from enum import Enum
from dataclasses import dataclass
from typing import List, Optional, Tuple
import numpy as np
import time


class BehaviorType(Enum):
    NORMAL = "normal"
    OVERSPEEDING = "overspeeding"
    SUDDEN_BRAKING = "sudden_braking"
    LANE_VIOLATION = "lane_violation"
    DANGEROUS_OVERTAKING = "dangerous_overtaking"
    RECKLESS_DRIVING = "reckless_driving"
    UNUSUAL_STOPPING = "unusual_stopping"
    WRONG_WAY = "wrong_way"


@dataclass
class BehaviorEvent:
    track_id: int
    behavior_type: BehaviorType
    severity: float
    timestamp: float
    description: str
    evidence: dict


@dataclass
class BehaviorConfig:
    speed_threshold_high: float = 80.0
    speed_threshold_medium: float = 60.0
    acceleration_threshold: float = -5.0
    lane_violation_margin: float = 50.0
    min_history_length: int = 10


class BehaviorAnalyzer:
    def __init__(self, config: BehaviorConfig = None):
        self.config = config or BehaviorConfig()
        self.track_behavior_history: dict[int, List[dict]] = {}
        self.active_violations: dict[int, List[BehaviorEvent]] = {}

    def analyze_track(self, track, road_lanes: Optional[List[dict]] = None) -> List[BehaviorEvent]:
        events = []
        
        if track.track_id not in self.track_behavior_history:
            self.track_behavior_history[track.track_id] = []
        
        history = self.track_behavior_history[track.track_id]
        history.append({
            "timestamp": track.timestamp,
            "bbox": track.bbox,
            "velocity": track.velocity,
            "center": track.get_center()
        })
        
        if len(history) < self.config.min_history_length:
            return events
        
        speed = track.get_speed_pixels_per_sec()
        
        if speed > self.config.speed_threshold_high:
            events.append(BehaviorEvent(
                track_id=track.track_id,
                behavior_type=BehaviorType.OVERSPEEDING,
                severity=min(1.0, (speed - self.config.speed_threshold_high) / 40),
                timestamp=track.timestamp,
                description=f"Vehicle moving at {speed:.1f} px/s (threshold: {self.config.speed_threshold_high})",
                evidence={"speed": speed, "threshold": self.config.speed_threshold_high}
            ))
        
        if len(history) >= 2:
            prev_velocity = history[-2]["velocity"]
            curr_velocity = track.velocity
            acceleration = (
                (curr_velocity[0] - prev_velocity[0]) + 
                (curr_velocity[1] - prev_velocity[1])
            ) / 2
            
            if acceleration < self.config.acceleration_threshold:
                events.append(BehaviorEvent(
                    track_id=track.track_id,
                    behavior_type=BehaviorType.SUDDEN_BRAKING,
                    severity=min(1.0, abs(acceleration) / 10),
                    timestamp=track.timestamp,
                    description=f"Sudden braking detected (acceleration: {acceleration:.1f})",
                    evidence={"acceleration": acceleration}
                ))
        
        if road_lanes:
            lane_violation = self._check_lane_violation(track, road_lanes)
            if lane_violation:
                events.append(lane_violation)
        
        self.active_violations[track.track_id] = events
        return events

    def _check_lane_violation(self, track, road_lanes: List[dict]) -> Optional[BehaviorEvent]:
        cx, cy = track.get_center()
        
        for lane in road_lanes:
            lane_type = lane.get("type", "normal")
            if lane_type == "oncoming":
                continue
            
            center_line = lane.get("center_line", [])
            if len(center_line) < 2:
                continue
            
            for i in range(len(center_line) - 1):
                p1 = center_line[i]
                p2 = center_line[i + 1]
                
                dist = self._point_to_line_distance(
                    (cx, cy), 
                    (p1[0], p1[1]), 
                    (p2[0], p2[1])
                )
                
                if dist > self.config.lane_violation_margin:
                    return BehaviorEvent(
                        track_id=track.track_id,
                        behavior_type=BehaviorType.LANE_VIOLATION,
                        severity=min(1.0, dist / 100),
                        timestamp=track.timestamp,
                        description=f"Vehicle deviating from lane by {dist:.1f} pixels",
                        evidence={"distance": dist, "lane": lane.get("id", "unknown")}
                    )
        
        return None

    def _point_to_line_distance(
        self, 
        point: Tuple[float, float], 
        line_start: Tuple[float, float], 
        line_end: Tuple[float, float]
    ) -> float:
        px, py = point
        x1, y1 = line_start
        x2, y2 = line_end
        
        dx = x2 - x1
        dy = y2 - y1
        
        if dx == 0 and dy == 0:
            return np.sqrt((px - x1)**2 + (py - y1)**2)
        
        t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
        
        proj_x = x1 + t * dx
        proj_y = y1 + t * dy
        
        return np.sqrt((px - proj_x)**2 + (py - proj_y)**2)

    def get_violation_summary(self) -> dict:
        summary = {bt.value: 0 for bt in BehaviorType}
        
        for violations in self.active_violations.values():
            for v in violations:
                summary[v.behavior_type.value] += 1
        
        return summary
