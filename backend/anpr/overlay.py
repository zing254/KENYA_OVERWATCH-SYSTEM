"""
OpenCV Overlay Renderer
Kenya Overwatch - Professional ANPR Visualization

Creates sci-fi styled overlays for license plate detections
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
import datetime


class OverlayRenderer:
    """Professional overlay renderer for ANPR visualization"""
    
    # Color palette - Kenyan themed
    COLORS = {
        'primary': (15, 106, 61),       # Kenyan green
        'secondary': (187, 30, 16),      # Kenyan red  
        'accent': (255, 200, 0),         # Gold accent
        'background': (17, 17, 17),      # Charcoal
        'text': (242, 242, 242),         # Off-white
        'alert': (220, 20, 60),          # Alert red
        'success': (50, 205, 50),        # Success green
        'warning': (255, 165, 0),         # Warning orange
        'verified': (0, 255, 127),       # Verified green
        'tracking': (0, 191, 255),        # Deep sky blue
    }
    
    # Fonts
    FONT_TITLE = cv2.FONT_HERSHEY_SIMPLEX
    FONT_BODY = cv2.FONT_HERSHEY_PLAIN
    FONT_MONO = cv2.FONT_HERSHEY_DUPLEX
    
    def __init__(self):
        self.scanline_offset = 0
    
    def draw_detection_box(self, frame: np.ndarray, bbox: List[int], 
                         track_id: int = None, plate: str = None,
                         confidence: float = 0.0, verified: bool = False,
                         age: int = 0) -> np.ndarray:
        """Draw professional detection box with corner brackets"""
        x1, y1, x2, y2 = bbox
        
        # Choose color based on status
        if verified:
            color = self.COLORS['verified']
        elif confidence > 0.7:
            color = self.COLORS['primary']
        elif confidence > 0.5:
            color = self.COLORS['warning']
        else:
            color = self.COLORS['secondary']
        
        # Draw corner brackets instead of full rectangle
        bracket_length = 25
        thickness = 2
        
        # Top-left corner
        cv2.line(frame, (x1, y1), (x1 + bracket_length, y1), color, thickness)
        cv2.line(frame, (x1, y1), (x1, y1 + bracket_length), color, thickness)
        
        # Top-right corner
        cv2.line(frame, (x2, y1), (x2 - bracket_length, y1), color, thickness)
        cv2.line(frame, (x2, y1), (x2, y1 + bracket_length), color, thickness)
        
        # Bottom-left corner
        cv2.line(frame, (x1, y2), (x1 + bracket_length, y2), color, thickness)
        cv2.line(frame, (x1, y2), (x1, y2 - bracket_length), color, thickness)
        
        # Bottom-right corner
        cv2.line(frame, (x2, y2), (x2 - bracket_length, y2), color, thickness)
        cv2.line(frame, (x2, y2), (x2, y2 - bracket_length), color, thickness)
        
        # Draw plate info panel
        if plate:
            panel_height = 45
            panel_y = max(y1 - panel_height - 10, 10)
            
            # Panel background
            overlay = frame.copy()
            cv2.rectangle(overlay, (x1, panel_y), (x2, panel_y + panel_height), color, -1)
            frame = cv2.addWeighted(frame, 0.7, overlay, 0.3, 0)
            
            # Plate text
            plate_text = f"  {plate}  "
            cv2.putText(frame, plate_text, (x1 + 5, panel_y + 18), 
                       self.FONT_TITLE, 0.6, self.COLORS['text'], 2)
            
            # Confidence
            conf_text = f"{confidence*100:.1f}%"
            cv2.putText(frame, conf_text, (x1 + 5, panel_y + 38), 
                       self.FONT_BODY, 0.6, self.COLORS['text'], 1)
        
        # Draw tracking ID
        if track_id is not None:
            id_text = f"ID:{track_id:03d}"
            cv2.putText(frame, id_text, (x1, y2 + 20), 
                       self.FONT_MONO, 0.5, color, 1)
            
            # Pulsing effect for active tracking
            pulse = int(127 + 127 * np.sin(datetime.datetime.now().timestamp() * 3))
            cv2.circle(frame, (x2 - 10, y2 + 15), 5, (pulse, pulse, pulse), -1)
        
        return frame
    
    def draw_target_lock(self, frame: np.ndarray, bbox: List[int]) -> np.ndarray:
        """Draw target lock animation"""
        x1, y1, x2, y2 = bbox
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        
        # Animated crosshair
        radius = max(bbox[2] - bbox[0], bbox[3] - bbox[1]) // 2 + 20
        time_factor = int(datetime.datetime.now().timestamp() * 2) % 4
        
        # Rotating brackets
        for i in range(4):
            angle = (i * 90 + time_factor * 10) * np.pi / 180
            ex = int(cx + radius * np.cos(angle))
            ey = int(cy + radius * np.sin(angle))
            cv2.line(frame, (cx, cy), (ex, ey), self.COLORS['alert'], 2)
        
        # Center crosshair
        cv2.line(frame, (cx - 15, cy), (cx + 15, cy), self.COLORS['alert'], 2)
        cv2.line(frame, (cx, cy - 15), (cx, cy + 15), self.COLORS['alert'], 2)
        
        # TARGET LOCK text
        cv2.putText(frame, "TARGET LOCK", (x1, y1 - 30), 
                   self.FONT_TITLE, 0.7, self.COLORS['alert'], 2)
        
        return frame
    
    def draw_scan_lines(self, frame: np.ndarray, intensity: float = 0.03) -> np.ndarray:
        """Draw subtle scan lines effect"""
        h, w = frame.shape[:2]
        
        # Horizontal scanlines
        for y in range(0, h, 4):
            cv2.line(frame, (0, y), (w, y), (30, 30, 30), 1)
        
        # Vertical scanline (moving)
        self.scanline_offset = (self.scanline_offset + 1) % h
        cv2.line(frame, (0, self.scanline_offset), (w, self.scanline_offset), 
                (50, 50, 50), 1)
        
        return frame
    
    def draw_metrics_panel(self, frame: np.ndarray, stats: Dict) -> np.ndarray:
        """Draw system metrics panel"""
        h, w = frame.shape[:2]
        panel_width = 280
        panel_x = w - panel_width
        
        # Panel background
        overlay = frame.copy()
        cv2.rectangle(overlay, (panel_x, 0), (w, 180), self.COLORS['background'], -1)
        frame = cv2.addWeighted(frame, 0.8, overlay, 0.2, 0)
        
        # Border
        cv2.rectangle(frame, (panel_x, 0), (w, 180), self.COLORS['primary'], 2)
        
        # Title
        cv2.putText(frame, "SYSTEM METRICS", (panel_x + 10, 25), 
                   self.FONT_TITLE, 0.6, self.COLORS['primary'], 2)
        
        # Metrics
        y_offset = 50
        metrics = [
            ("FPS", f"{stats.get('fps', 0):.1f}", self.COLORS['success']),
            ("ACTIVE TRACKS", f"{stats.get('active_tracks', 0)}", self.COLORS['tracking']),
            ("TOTAL DETECTED", f"{stats.get('total_detections', 0)}", self.COLORS['accent']),
            ("AVG CONFIDENCE", f"{stats.get('avg_confidence', 0)*100:.1f}%", self.COLORS['primary']),
            ("LATENCY", f"{stats.get('latency_ms', 0):.0f}ms", self.COLORS['warning']),
        ]
        
        for label, value, color in metrics:
            cv2.putText(frame, label, (panel_x + 10, y_offset), 
                       self.FONT_BODY, 0.6, self.COLORS['text'], 1)
            cv2.putText(frame, value, (panel_x + 150, y_offset), 
                       self.FONT_TITLE, 0.6, color, 2)
            y_offset += 25
        
        return frame
    
    def draw_camera_info(self, frame: np.ndarray, camera_id: str, 
                        timestamp: str = None) -> np.ndarray:
        """Draw camera info overlay"""
        # Top bar
        h, w = frame.shape[:2]
        bar_height = 40
        
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, bar_height), self.COLORS['background'], -1)
        frame = cv2.addWeighted(frame, 0.8, overlay, 0.2, 0)
        
        # Camera name
        cv2.putText(frame, f"CAMERA: {camera_id.upper()}", (20, 28), 
                   self.FONT_TITLE, 0.7, self.COLORS['primary'], 2)
        
        # Timestamp
        if timestamp is None:
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, timestamp, (w - 200, 28), 
                   self.FONT_MONO, 0.6, self.COLORS['text'], 1)
        
        # Live indicator
        pulse = int(127 + 127 * np.sin(datetime.datetime.now().timestamp() * 2))
        cv2.circle(frame, (w - 230, 22), 6, (0, pulse, 0), -1)
        cv2.putText(frame, "LIVE", (w - 220, 28), 
                   self.FONT_BODY, 0.6, (0, pulse, 0), 1)
        
        return frame
    
    def draw_tracking_trail(self, frame: np.ndarray, 
                           centroid_history: List[Tuple[float, float]]) -> np.ndarray:
        """Draw vehicle movement trail"""
        if len(centroid_history) < 2:
            return frame
        
        # Draw trail
        points = np.array(centroid_history, dtype=np.int32)
        cv2.polylines(frame, [points], False, self.COLORS['tracking'], 2)
        
        # Draw direction arrow at the end
        if len(centroid_history) >= 2:
            p1 = centroid_history[-2]
            p2 = centroid_history[-1]
            cx, cy = int(p2[0]), int(p2[1])
            
            # Direction vector
            dx = p2[0] - p1[0]
            dy = p2[1] - p1[1]
            angle = np.arctan2(dy, dx)
            
            arrow_len = 15
            ex = int(cx + arrow_len * np.cos(angle))
            ey = int(cy + arrow_len * np.sin(angle))
            
            cv2.line(frame, (cx, cy), (ex, ey), self.COLORS['tracking'], 2)
        
        return frame
    
    def draw_bottom_panel(self, frame: np.ndarray, active_tracks: List[Dict]) -> np.ndarray:
        """Draw bottom panel showing active targets"""
        h, w = frame.shape[:2]
        panel_height = 120
        
        # Panel background
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, h - panel_height), (w, h), self.COLORS['background'], -1)
        frame = cv2.addWeighted(frame, 0.85, overlay, 0.15, 0)
        
        # Border line
        cv2.line(frame, (0, h - panel_height), (w, h - panel_height), 
                self.COLORS['primary'], 2)
        
        # Title
        cv2.putText(frame, "ACTIVE TARGETS", (20, h - panel_height + 25), 
                   self.FONT_TITLE, 0.6, self.COLORS['primary'], 2)
        
        # Show up to 4 active tracks
        for i, track in enumerate(active_tracks[:4]):
            x_offset = 20 + i * (w // 4)
            y_offset = h - panel_height + 50
            
            # Track box
            color = self.COLORS['verified'] if track.get('verified') else self.COLORS['tracking']
            
            # Plate
            plate = track.get('plate', 'UNKNOWN')
            cv2.putText(frame, plate, (x_offset, y_offset), 
                       self.FONT_TITLE, 0.5, color, 2)
            
            # ID and confidence
            info = f"ID:{track.get('track_id', 0):03d} | {track.get('plate_confidence', 0)*100:.0f}%"
            cv2.putText(frame, info, (x_offset, y_offset + 20), 
                       self.FONT_BODY, 0.5, self.COLORS['text'], 1)
            
            # Verified badge
            if track.get('verified'):
                cv2.putText(frame, "✓ VERIFIED", (x_offset, y_offset + 40), 
                           self.FONT_BODY, 0.5, self.COLORS['success'], 1)
        
        return frame
    
    def draw_alert(self, frame: np.ndarray, message: str, 
                   alert_type: str = "warning") -> np.ndarray:
        """Draw alert message"""
        h, w = frame.shape[:2]
        
        color = self.COLORS.get(alert_type, self.COLORS['warning'])
        
        # Alert background
        overlay = frame.copy()
        cv2.rectangle(overlay, (w//4, h//2 - 30), (3*w//4, h//2 + 30), color, -1)
        frame = cv2.addWeighted(frame, 0.7, overlay, 0.3, 0)
        
        # Border
        cv2.rectangle(frame, (w//4, h//2 - 30), (3*w//4, h//2 + 30), color, 3)
        
        # Text
        cv2.putText(frame, message, (w//4 + 20, h//2 + 8), 
                   self.FONT_TITLE, 0.7, self.COLORS['text'], 2)
        
        return frame
    
    def apply_kenyan_theme(self, frame: np.ndarray) -> np.ndarray:
        """Apply overall Kenyan-themed color grading"""
        # Slight color grade - warm tint
        frame = frame.astype(np.float32)
        frame[:, :, 0] *= 0.95  # Slight blue reduction
        frame[:, :, 1] *= 1.02  # Slight green boost
        frame = np.clip(frame, 0, 255).astype(np.uint8)
        
        return frame


def render_anpr_overlay(frame: np.ndarray, result: Dict, 
                        camera_id: str = "CAM_001") -> np.ndarray:
    """Main render function for ANPR overlay"""
    renderer = OverlayRenderer()
    
    # Apply base effects
    frame = renderer.draw_scan_lines(frame)
    frame = renderer.apply_kenyan_theme(frame)
    
    # Camera info
    frame = renderer.draw_camera_info(frame, camera_id)
    
    # Draw detections
    tracks = result.get('tracks', [])
    for track in tracks:
        frame = renderer.draw_detection_box(
            frame,
            track['bbox'],
            track.get('track_id'),
            track.get('plate'),
            track.get('plate_confidence', 0),
            track.get('verified', False),
            track.get('hits', 0)
        )
        
        # Draw target lock for verified plates
        if track.get('verified'):
            frame = renderer.draw_target_lock(frame, track['bbox'])
    
    # Metrics panel
    stats = result.get('stats', {})
    frame = renderer.draw_metrics_panel(frame, stats)
    
    # Bottom panel
    frame = renderer.draw_bottom_panel(frame, tracks)
    
    # Alert for new detection
    if tracks and any(t.get('plate') for t in tracks):
        frame = renderer.draw_alert(frame, f"VEHICLE DETECTED: {tracks[0].get('plate', 'UNKNOWN')}", "success")
    
    return frame
