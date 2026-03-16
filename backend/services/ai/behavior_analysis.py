"""
AI Behavior Analysis Module
Handles speed estimation, lane violation, accident detection, and hazard detection
"""

import logging
import math
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class CameraCalibration:
    """Camera calibration parameters for real-world measurements"""

    camera_id: str
    focal_length: float = 1000.0
    sensor_width: float = 6.4
    sensor_height: float = 4.8
    mounting_height: float = 6.0  # meters
    lane_width: float = 3.5  # meters
    pixels_per_meter: float = 100.0
    road_length_in_frame: float = 100.0  # meters visible in frame
    orientation: str = "overhead"  # overhead, side, angled
    lat: float = 0.0
    lng: float = 0.0
    road_name: str = ""
    speed_limit: float = 50.0  # km/h


@dataclass
class TrackedObject:
    """A tracked vehicle/object with history"""

    object_id: str
    class_name: str
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    center_x: float
    center_y: float
    confidence: float
    timestamp: datetime
    speed_kmh: float = 0.0
    lane: int = 0
    is_stopped: bool = False
    stopped_duration: float = 0.0
    previous_positions: List[Tuple[float, float, datetime]] = field(
        default_factory=list
    )
    trajectory: List[Tuple[float, float]] = field(default_factory=list)


@dataclass
class DetectionEvent:
    """Event generated from behavior analysis"""

    event_type: str  # overspeeding, lane_violation, dangerous_overtaking, accident, hazard, stopped_vehicle
    camera_id: str
    object_ids: List[str]
    severity: str  # low, medium, high, critical
    confidence: float
    location: Dict[str, float]
    description: str
    evidence: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class SpeedEstimator:
    """Estimates vehicle speed from video frames using camera calibration"""

    def __init__(self, calibration: CameraCalibration):
        self.calibration = calibration
        self.object_history: Dict[str, List[TrackedObject]] = defaultdict(list)
        self.speed_history: Dict[str, List[float]] = defaultdict(list)

    def estimate_speed(
        self,
        object_id: str,
        current_bbox: Tuple[int, int, int, int],
        timestamp: datetime,
    ) -> float:
        """Estimate speed in km/h using pixel displacement"""

        current_center_x = (current_bbox[0] + current_bbox[2]) / 2
        current_center_y = (current_bbox[1] + current_bbox[3]) / 2

        history = self.object_history[object_id]

        if len(history) < 2:
            # First detection, cannot calculate speed
            return 0.0

        # Get previous position
        prev = history[-1]
        prev_center_x = prev.center_x
        prev_center_y = prev.center_y

        # Calculate pixel displacement
        pixel_displacement = math.sqrt(
            (current_center_x - prev_center_x) ** 2
            + (current_center_y - prev_center_y) ** 2
        )

        # Time difference in seconds
        time_diff = (timestamp - prev.timestamp).total_seconds()

        if time_diff <= 0:
            return 0.0

        # Convert pixels to meters using calibration
        meters_per_pixel = (
            self.calibration.road_length_in_frame / self.calibration.pixels_per_meter
        )
        meters_per_pixel = 0.01  # Simplified: 1 pixel = 0.01 meters at typical distance

        # For overhead camera, Y displacement relates to movement along road
        # For angled camera, need more complex projection
        if self.calibration.orientation == "overhead":
            # Y movement is along the road
            pixel_speed = pixel_displacement / time_diff
            meters_per_second = pixel_speed * meters_per_pixel
            speed_kmh = meters_per_second * 3.6
        else:
            # Angled view - use average
            pixel_speed = pixel_displacement / time_diff
            meters_per_second = pixel_speed * meters_per_pixel * 0.7
            speed_kmh = meters_per_second * 3.6

        # Apply smoothing with history
        self.speed_history[object_id].append(speed_kmh)

        # Keep last 5 speed measurements for averaging
        if len(self.speed_history[object_id]) > 5:
            self.speed_history[object_id].pop(0)

        # Return smoothed speed
        return sum(self.speed_history[object_id]) / len(self.speed_history[object_id])

    def check_overspeeding(self, speed_kmh: float) -> Tuple[bool, str]:
        """Check if vehicle is overspeeding"""
        limit = self.calibration.speed_limit

        if speed_kmh > limit * 1.5:
            return True, "critical"
        elif speed_kmh > limit * 1.2:
            return True, "high"
        elif speed_kmh > limit:
            return True, "medium"

        return False, ""


class LaneAnalyzer:
    """Analyzes vehicle lane positions and detects violations"""

    def __init__(self, calibration: CameraCalibration):
        self.calibration = calibration
        self.lane_boundaries: List[Tuple[float, float]] = (
            []
        )  # (left_x, right_x) per lane
        self.solid_lines: List[Tuple[int, int]] = []  # (lane_left, lane_right) indices
        self.dashed_lines: List[Tuple[int, int]] = []
        self._init_default_lanes()

    def _init_default_lanes(self):
        """Initialize default lane boundaries"""
        # Assume camera view divided into lanes
        num_lanes = 3
        frame_width = 1920.0
        lane_width_px = frame_width / num_lanes

        self.lane_boundaries = []
        for i in range(num_lanes):
            left = i * lane_width_px
            right = (i + 1) * lane_width_px
            self.lane_boundaries.append((left, right))

        # Lane 1-2 and 2-3 boundaries are dashed, edges are solid
        self.solid_lines = [(0, 1), (1, 2)]  # All lines can be solid for simplicity
        self.dashed_lines = []

    def get_lane(self, center_x: float, frame_width: float = 1920.0) -> int:
        """Determine which lane a vehicle is in"""
        normalized_x = center_x / frame_width

        for i, (left, right) in enumerate(self.lane_boundaries):
            left_norm = left / frame_width
            right_norm = right / frame_width
            if left_norm <= normalized_x < right_norm:
                return i

        return 0

    def check_lane_violation(
        self, current_lane: int, previous_lane: int, crossing_solid_line: bool = False
    ) -> Tuple[bool, str]:
        """Check if lane change is a violation"""

        if current_lane == previous_lane:
            return False, ""

        # Check if crossing a solid line
        if crossing_solid_line:
            return True, "medium"  # Solid line violation

        # Check for rapid lane change (dangerous overtaking indicator)
        # This would need trajectory analysis

        return False, ""


class AccidentDetector:
    """Detects accidents using heuristics"""

    def __init__(self):
        self.stopped_vehicles: Dict[str, Dict] = (
            {}
        )  # object_id -> {location, timestamp, has_people}
        self.collision_candidates: List[Dict] = []
        self.stop_threshold_seconds = 30.0
        self.proximity_threshold_meters = 20.0

    def update(
        self,
        tracked_objects: List[TrackedObject],
        pedestrian_positions: List[Tuple[float, float]],
    ) -> List[DetectionEvent]:
        """Update state and detect accidents"""

        events = []
        current_time = datetime.now(timezone.utc)

        # Track stopped vehicles
        for obj in tracked_objects:
            if obj.is_stopped:
                if obj.object_id not in self.stopped_vehicles:
                    self.stopped_vehicles[obj.object_id] = {
                        "location": (obj.center_x, obj.center_y),
                        "start_time": current_time,
                        "has_people_nearby": False,
                    }

                # Check for pedestrians nearby
                has_people = self._check_pedestrian_proximity(
                    obj.center_x, obj.center_y, pedestrian_positions
                )
                self.stopped_vehicles[obj.object_id]["has_people_nearby"] = has_people

                # Check stop duration
                stop_duration = (
                    current_time - self.stopped_vehicles[obj.object_id]["start_time"]
                ).total_seconds()

                if stop_duration > self.stop_threshold_seconds:
                    # Possible accident - multiple stopped vehicles with people
                    if self._is_accident_candidate(obj.object_id):
                        events.append(
                            DetectionEvent(
                                event_type="accident",
                                camera_id="",
                                object_ids=[obj.object_id],
                                severity="high",
                                confidence=0.85,
                                location={"lat": 0, "lng": 0},
                                description=f"Possible accident: vehicle stopped for {stop_duration:.0f}s with people nearby",
                                evidence={"stop_duration": stop_duration},
                            )
                        )
            else:
                # Remove from stopped if moving
                if obj.object_id in self.stopped_vehicles:
                    del self.stopped_vehicles[obj.object_id]

        # Check for multiple stopped vehicles in proximity
        stopped_ids = list(self.stopped_vehicles.keys())
        for i, obj_id1 in enumerate(stopped_ids):
            for obj_id2 in stopped_ids[i + 1 :]:
                if self._check_proximity(obj_id1, obj_id2):
                    # Two stopped vehicles close together - likely accident
                    if self.stopped_vehicles[obj_id1].get(
                        "has_people_nearby"
                    ) or self.stopped_vehicles[obj_id2].get("has_people_nearby"):
                        events.append(
                            DetectionEvent(
                                event_type="accident",
                                camera_id="",
                                object_ids=[obj_id1, obj_id2],
                                severity="critical",
                                confidence=0.9,
                                location={"lat": 0, "lng": 0},
                                description="Two vehicles stopped in proximity with people nearby - likely accident",
                                evidence={"vehicles": [obj_id1, obj_id2]},
                            )
                        )

        return events

    def _check_pedestrian_proximity(
        self,
        vehicle_x: float,
        vehicle_y: float,
        pedestrians: List[Tuple[float, float]],
        threshold: float = 30.0,
    ) -> bool:
        """Check if pedestrians are near the vehicle"""
        for px, py in pedestrians:
            distance = math.sqrt((vehicle_x - px) ** 2 + (vehicle_y - py) ** 2)
            if distance < threshold:
                return True
        return False

    def _check_proximity(self, obj_id1: str, obj_id2: str) -> bool:
        """Check if two stopped vehicles are close together"""
        if obj_id1 not in self.stopped_vehicles or obj_id2 not in self.stopped_vehicles:
            return False

        pos1 = self.stopped_vehicles[obj_id1]["location"]
        pos2 = self.stopped_vehicles[obj_id2]["location"]

        distance = math.sqrt((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2)
        return distance < self.proximity_threshold_meters

    def _is_accident_candidate(self, obj_id: str) -> bool:
        """Check if stopped vehicle is likely an accident"""
        if obj_id not in self.stopped_vehicles:
            return False

        info = self.stopped_vehicles[obj_id]
        return info.get("has_people_nearby", False)


class HazardDetector:
    """Detects road hazards (debris, potholes, fallen objects)"""

    def __init__(self):
        self.static_objects: Dict[str, Dict] = (
            {}
        )  # object_id -> {position, timestamp, class}
        self.hazard_threshold_seconds = 10.0
        self.hazard_classes = {
            "debris",
            "pothole",
            "object",
            "fallen_tree",
            "broken_glass",
        }

    def update(self, detections: List[Dict]) -> List[DetectionEvent]:
        """Detect static objects that might be hazards"""

        events = []
        current_time = datetime.now(timezone.utc)

        for det in detections:
            obj_id = det.get("object_id", "")
            class_name = det.get("class", "")
            bbox = det.get("bbox", (0, 0, 0, 0))
            center_x = (bbox[0] + bbox[2]) / 2
            center_y = (bbox[1] + bbox[3]) / 2

            # Skip vehicles and pedestrians
            if class_name in {
                "car",
                "truck",
                "bus",
                "motorcycle",
                "bicycle",
                "person",
                "pedestrian",
            }:
                continue

            # Check if it's a hazard class
            if class_name.lower() in self.hazard_classes:
                if obj_id not in self.static_objects:
                    self.static_objects[obj_id] = {
                        "position": (center_x, center_y),
                        "start_time": current_time,
                        "class": class_name,
                        "bbox": bbox,
                    }
                else:
                    # Check duration
                    duration = (
                        current_time - self.static_objects[obj_id]["start_time"]
                    ).total_seconds()

                    if duration > self.hazard_threshold_seconds:
                        events.append(
                            DetectionEvent(
                                event_type="hazard",
                                camera_id="",
                                object_ids=[obj_id],
                                severity="medium",
                                confidence=0.8,
                                location={"lat": 0, "lng": 0},
                                description=f"Road hazard detected: {class_name}",
                                evidence={"class": class_name, "duration": duration},
                            )
                        )

        # Clean up old static objects
        for obj_id in list(self.static_objects.keys()):
            # Remove objects not seen recently
            pass

        return events


class BehaviorAnalyzer:
    """Main behavior analysis coordinator"""

    def __init__(self, camera_id: str, calibration: Optional[CameraCalibration] = None):
        self.camera_id = camera_id
        self.calibration = calibration or CameraCalibration(camera_id=camera_id)

        self.speed_estimator = SpeedEstimator(self.calibration)
        self.lane_analyzer = LaneAnalyzer(self.calibration)
        self.accident_detector = AccidentDetector()
        self.hazard_detector = HazardDetector()

        self.tracked_objects: Dict[str, TrackedObject] = {}
        self.previous_lanes: Dict[str, int] = {}

    def process_frame(
        self, detections: List[Dict], timestamp: Optional[datetime] = None
    ) -> List[DetectionEvent]:
        """Process a frame and return detection events"""

        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        events = []
        tracked_list = []
        pedestrian_positions = []

        # Update tracked objects
        for det in detections:
            obj_id = det.get("object_id", "")
            class_name = det.get("class", "unknown")
            bbox = det.get("bbox", (0, 0, 0, 0))
            confidence = det.get("confidence", 0.0)

            center_x = (bbox[0] + bbox[2]) / 2
            center_y = (bbox[1] + bbox[3]) / 2

            # Get or create tracked object
            if obj_id in self.tracked_objects:
                obj = self.tracked_objects[obj_id]
            else:
                obj = TrackedObject(
                    object_id=obj_id,
                    class_name=class_name,
                    bbox=bbox,
                    center_x=center_x,
                    center_y=center_y,
                    confidence=confidence,
                    timestamp=timestamp,
                )
                self.tracked_objects[obj_id] = obj

            # Update position history
            obj.previous_positions.append((center_x, center_y, timestamp))
            if len(obj.previous_positions) > 10:
                obj.previous_positions.pop(0)

            obj.trajectory.append((center_x, center_y))
            if len(obj.trajectory) > 20:
                obj.trajectory.pop(0)

            # Estimate speed for vehicles
            if class_name in {"car", "truck", "bus", "motorcycle"}:
                speed = self.speed_estimator.estimate_speed(obj_id, bbox, timestamp)
                obj.speed_kmh = speed

                # Check overspeeding
                is_overspeeding, severity = self.speed_estimator.check_overspeeding(
                    speed
                )
                if is_overspeeding:
                    events.append(
                        DetectionEvent(
                            event_type="overspeeding",
                            camera_id=self.camera_id,
                            object_ids=[obj_id],
                            severity=severity,
                            confidence=min(confidence, 0.95),
                            location={
                                "lat": self.calibration.lat,
                                "lng": self.calibration.lng,
                            },
                            description=f"Vehicle traveling at {speed:.1f} km/h in {self.calibration.speed_limit} km/h zone",
                            evidence={
                                "speed": speed,
                                "limit": self.calibration.speed_limit,
                            },
                        )
                    )

                # Check if stopped
                if speed < 1.0:
                    obj.is_stopped = True
                    if obj.previous_positions:
                        last_pos_time = obj.previous_positions[-1][2]
                        obj.stopped_duration = (
                            timestamp - last_pos_time
                        ).total_seconds()
                else:
                    obj.is_stopped = False
                    obj.stopped_duration = 0.0

            # Track lane for vehicles
            if class_name in {"car", "truck", "bus", "motorcycle"}:
                current_lane = self.lane_analyzer.get_lane(center_x)

                # Check lane violation
                if obj_id in self.previous_lanes:
                    prev_lane = self.previous_lanes[obj_id]
                    is_violation, severity = self.lane_analyzer.check_lane_violation(
                        current_lane, prev_lane
                    )
                    if is_violation:
                        events.append(
                            DetectionEvent(
                                event_type="lane_violation",
                                camera_id=self.camera_id,
                                object_ids=[obj_id],
                                severity=severity,
                                confidence=confidence,
                                location={
                                    "lat": self.calibration.lat,
                                    "lng": self.calibration.lng,
                                },
                                description="Vehicle changed lanes illegally",
                                evidence={
                                    "from_lane": prev_lane,
                                    "to_lane": current_lane,
                                },
                            )
                        )

                self.previous_lanes[obj_id] = current_lane

            # Track pedestrians
            if class_name in {"person", "pedestrian"}:
                pedestrian_positions.append((center_x, center_y))

            tracked_list.append(obj)

        # Run accident detection
        accident_events = self.accident_detector.update(
            tracked_list, pedestrian_positions
        )
        events.extend(accident_events)

        # Run hazard detection
        hazard_events = self.hazard_detector.update(detections)
        events.extend(hazard_events)

        # Clean up old tracked objects
        current_time = timestamp
        for obj_id in list(self.tracked_objects.keys()):
            obj = self.tracked_objects[obj_id]
            if (current_time - obj.timestamp).total_seconds() > 10:
                del self.tracked_objects[obj_id]
                if obj_id in self.previous_lanes:
                    del self.previous_lanes[obj_id]

        return events


# Global camera calibrations
CAMERA_CALIBRATIONS: Dict[str, CameraCalibration] = {}


def get_or_create_calibration(
    camera_id: str,
    road_name: str = "",
    speed_limit: float = 50.0,
    lat: float = 0.0,
    lng: float = 0.0,
) -> CameraCalibration:
    """Get or create camera calibration"""
    if camera_id not in CAMERA_CALIBRATIONS:
        CAMERA_CALIBRATIONS[camera_id] = CameraCalibration(
            camera_id=camera_id,
            road_name=road_name,
            speed_limit=speed_limit,
            lat=lat,
            lng=lng,
        )
    return CAMERA_CALIBRATIONS[camera_id]
