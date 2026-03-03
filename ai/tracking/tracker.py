from dataclasses import dataclass, field
from typing import List, Tuple, Optional
import numpy as np
from collections import defaultdict
import time


@dataclass
class Track:
    track_id: int
    class_id: int
    class_name: str
    bbox: Tuple[int, int, int, int]
    confidence: float
    timestamp: float
    history: List[Tuple[float, Tuple[int, int, int, int]]] = field(default_factory=list)
    velocity: Tuple[float, float] = (0.0, 0.0)
    plate: Optional[str] = None
    last_seen: float = field(default_factory=time.time)
    hits: int = 1
    age: int = 0

    def update(self, bbox: Tuple[int, int, int, int], confidence: float, timestamp: float):
        self.history.append((timestamp, self.bbox))
        self.bbox = bbox
        self.confidence = confidence
        self.timestamp = timestamp
        self.last_seen = time.time()
        self.hits += 1
        self.age += 1
        
        if len(self.history) > 30:
            self.history.pop(0)
        
        if len(self.history) >= 2:
            prev_time, prev_bbox = self.history[-2]
            dt = timestamp - prev_time
            if dt > 0:
                cx_prev = (prev_bbox[0] + prev_bbox[2]) / 2
                cy_prev = (prev_bbox[1] + prev_bbox[3]) / 2
                cx_curr = (bbox[0] + bbox[2]) / 2
                cy_curr = (bbox[1] + bbox[3]) / 2
                self.velocity = ((cx_curr - cx_prev) / dt, (cy_curr - cy_prev) / dt)

    def get_center(self) -> Tuple[float, float]:
        cx = (self.bbox[0] + self.bbox[2]) / 2
        cy = (self.bbox[1] + self.bbox[3]) / 2
        return (cx, cy)

    def get_speed_pixels_per_sec(self) -> float:
        vx, vy = self.velocity
        return np.sqrt(vx**2 + vy**2)


@dataclass
class TrackingConfig:
    max_age: int = 30
    min_hits: int = 3
    iou_threshold: float = 0.3
    max_velocity_diff: float = 100.0


class VehicleTracker:
    def __init__(self, config: TrackingConfig = None):
        self.config = config or TrackingConfig()
        self.tracks: dict[int, Track] = {}
        self.next_track_id = 1
        self.frame_count = 0
        self.track_history: dict[int, List[Track]] = defaultdict(list)

    def update(self, detections: List[dict], timestamp: float) -> List[Track]:
        self.frame_count += 1
        
        for track in self.tracks.values():
            track.age += 1
        
        if not detections:
            self._prune_tracks()
            return list(self.tracks.values())
        
        matched_tracks, unmatched_detections = self._match_detections(detections)
        
        for track_id, det_idx in matched_tracks:
            self.tracks[track_id].update(
                tuple(detections[det_idx]["bbox"]),
                detections[det_idx]["confidence"],
                timestamp
            )
        
        for det_idx in unmatched_detections:
            self._create_track(detections[det_idx], timestamp)
        
        self._prune_tracks()
        
        return list(self.tracks.values())

    def _match_detections(self, detections: List[dict]) -> Tuple[List[Tuple[int, int]], List[int]]:
        if not self.tracks:
            return [], list(range(len(detections)))
        
        iou_matrix = np.zeros((len(self.tracks), len(detections)))
        
        track_ids = list(self.tracks.keys())
        for i, track_id in enumerate(track_ids):
            for j, det in enumerate(detections):
                iou_matrix[i, j] = self._compute_iou(
                    self.tracks[track_id].bbox,
                    tuple(det["bbox"])
                )
        
        matched = []
        used_detections = set()
        
        for _ in range(min(len(self.tracks), len(detections))):
            max_iou = self.config.iou_threshold
            max_pos = None
            
            for i, track_id in enumerate(track_ids):
                for j in enumerate(range(len(detections))):
                    if j[1] in used_detections:
                        continue
                    if i in [m[0] for m in matched]:
                        continue
                    if iou_matrix[i, j[1]] > max_iou:
                        max_iou = iou_matrix[i, j[1]]
                        max_pos = (track_ids[i], j[1])
            
            if max_pos:
                matched.append(max_pos)
                used_detections.add(max_pos[1])
        
        unmatched_dets = [j for j in range(len(detections)) if j not in used_detections]
        
        return matched, unmatched_dets

    def _compute_iou(self, bbox1: Tuple[int, int, int, int], bbox2: Tuple[int, int, int, int]) -> float:
        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2
        
        xi1 = max(x1_1, x1_2)
        yi1 = max(y1_1, y1_2)
        xi2 = min(x2_1, x2_2)
        yi2 = min(y2_1, y2_2)
        
        inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
        
        bbox1_area = (x2_1 - x1_1) * (y2_1 - y1_1)
        bbox2_area = (x2_2 - x1_2) * (y2_2 - y1_2)
        
        union_area = bbox1_area + bbox2_area - inter_area
        
        if union_area == 0:
            return 0.0
        
        return inter_area / union_area

    def _create_track(self, detection: dict, timestamp: float):
        track = Track(
            track_id=self.next_track_id,
            class_id=detection.get("class_id", 0),
            class_name=detection.get("class_name", "unknown"),
            bbox=tuple(detection["bbox"]),
            confidence=detection["confidence"],
            timestamp=timestamp
        )
        self.tracks[self.next_track_id] = track
        self.next_track_id += 1

    def _prune_tracks(self):
        current_time = time.time()
        
        to_remove = []
        for track_id, track in self.tracks.items():
            age_ok = track.age > self.config.max_age
            hits_ok = track.hits < self.config.min_hits
            stale = (current_time - track.last_seen) > 5.0
            
            if age_ok or (hits_ok and stale):
                self.track_history[track_id].append(track)
                to_remove.append(track_id)
        
        for track_id in to_remove:
            del self.tracks[track_id]

    def get_active_tracks(self) -> List[Track]:
        return list(self.tracks.values())

    def get_track(self, track_id: int) -> Optional[Track]:
        return self.tracks.get(track_id)

    def assign_plate(self, track_id: int, plate: str):
        if track_id in self.tracks:
            self.tracks[track_id].plate = plate
