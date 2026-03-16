"""Test WebSocket endpoint for real-time updates"""

from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.road_safety_api import app


class TestWebSocket:
    """Test WebSocket real-time communication"""

    def test_websocket_connect(self):
        """Test WebSocket connection to road_safety endpoint"""
        client = TestClient(app)
        with client.websocket_connect("/ws/road_safety") as websocket:
            data = websocket.receive_json()
            assert data is not None
            assert data.get("type") == "connected"
            assert "message" in data

    def test_websocket_receives_connection_message(self):
        """Test that WebSocket receives connection message"""
        client = TestClient(app)
        with client.websocket_connect("/ws/road_safety") as websocket:
            data = websocket.receive_json()
            assert data["type"] == "connected"
            assert "Kenya Overwatch" in data["message"]

    def test_websocket_subscribe(self):
        """Test WebSocket subscription to channels"""
        client = TestClient(app)
        with client.websocket_connect("/ws/road_safety") as websocket:
            # Receive initial connection message
            data = websocket.receive_json()
            assert data["type"] == "connected"

            # Send subscribe message
            websocket.send_json(
                {"type": "subscribe", "channels": ["incidents", "violations"]}
            )

            # Should receive subscription confirmation
            sub_response = websocket.receive_json()
            assert sub_response.get("type") == "subscribed"
