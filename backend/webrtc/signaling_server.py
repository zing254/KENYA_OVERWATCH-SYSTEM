"""
WebRTC Signaling Server for Mobile Phone Camera Integration
Handles real-time video streaming from mobile devices
"""

import asyncio
import websockets
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Set
import websockets.server

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebRTCSignalingServer:
    """
    WebRTC signaling server for mobile phone connections
    Manages phone streams and forwards to dashboards
    """

    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port
        self.connected_phones: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.connected_dashboards: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.phone_streams: Dict[str, dict] = {}
        self.dashboard_subscriptions: Dict[str, Set[str]] = {}

    async def handler(self, websocket: websockets.WebSocketServerProtocol, path: str):
        """WebSocket message handler for all connections"""
        client_id = None

        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")

                    if msg_type == "register_phone":
                        client_id = await self._handle_phone_register(websocket, data)
                    elif msg_type == "register_dashboard":
                        client_id = await self._handle_dashboard_register(
                            websocket, data
                        )
                    elif msg_type == "offer":
                        await self._handle_offer(client_id, data)
                    elif msg_type == "answer":
                        await self._handle_answer(client_id, data)
                    elif msg_type == "candidate":
                        await self._handle_ice_candidate(client_id, data)
                    elif msg_type == "subscribe_streams":
                        await self._handle_subscribe(client_id, data)
                    elif msg_type == "location_update":
                        await self._handle_location_update(client_id, data)
                    elif msg_type == "stream_status":
                        await self._handle_stream_status(client_id, data)
                    else:
                        logger.warning(f"Unknown message type: {msg_type}")

                except json.JSONDecodeError:
                    logger.error("Invalid JSON message received")
                except Exception as e:
                    logger.error(f"Error handling message: {e}")

        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client disconnected: {client_id}")
        finally:
            await self._cleanup_client(client_id)

    async def _handle_phone_register(
        self, websocket: websockets.WebSocketServerProtocol, data: dict
    ) -> str:
        """Register a new phone"""
        phone_id = data.get("phone_id", str(uuid.uuid4()))
        owner_name = data.get("owner_name", "Unknown")

        self.connected_phones[phone_id] = websocket

        self.phone_streams[phone_id] = {
            "phone_id": phone_id,
            "owner_name": owner_name,
            "status": "connected",
            "facing": data.get("facing", "back"),
            "resolution": data.get("resolution", "720p"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "last_seen": datetime.now(timezone.utc).isoformat(),
        }

        await websocket.send(
            json.dumps(
                {
                    "type": "registered",
                    "phone_id": phone_id,
                    "message": "Phone registered successfully",
                }
            )
        )

        await self._notify_dashboards(
            {"type": "phone_connected", "phone_id": phone_id, "owner_name": owner_name}
        )

        logger.info(f"Phone connected: {phone_id} ({owner_name})")
        return phone_id

    async def _handle_dashboard_register(
        self, websocket: websockets.WebSocketServerProtocol, data: dict
    ) -> str:
        """Register a dashboard/client"""
        dashboard_id = data.get("dashboard_id", str(uuid.uuid4()))
        self.connected_dashboards[dashboard_id] = websocket
        self.dashboard_subscriptions[dashboard_id] = set()

        await websocket.send(
            json.dumps(
                {
                    "type": "registered",
                    "dashboard_id": dashboard_id,
                    "available_streams": list(self.phone_streams.keys()),
                }
            )
        )

        logger.info(f"Dashboard connected: {dashboard_id}")
        return dashboard_id

    async def _handle_offer(self, client_id: str, data: dict):
        """Handle WebRTC offer from phone"""
        sdp_offer = data.get("sdp")
        stream_id = data.get("stream_id", "main")
        target = data.get("target")

        if client_id in self.phone_streams:
            self.phone_streams[client_id]["status"] = "streaming"
            self.phone_streams[client_id]["stream_id"] = stream_id

            await self._notify_dashboards(
                {
                    "type": "new_stream_available",
                    "phone_id": client_id,
                    "stream_id": stream_id,
                    "sdp": sdp_offer,
                    "owner_name": self.phone_streams[client_id].get("owner_name"),
                }
            )

    async def _handle_answer(self, client_id: str, data: dict):
        """Handle WebRTC answer"""
        sdp_answer = data.get("sdp")
        target = data.get("target")

        if target and target in self.connected_phones:
            await self.connected_phones[target].send(
                json.dumps({"type": "answer", "sdp": sdp_answer})
            )

    async def _handle_ice_candidate(self, client_id: str, data: dict):
        """Handle ICE candidate exchange"""
        candidate = data.get("candidate")
        target = data.get("target")

        if target:
            if (
                client_id in self.connected_phones
                and target in self.connected_dashboards
            ):
                await self.connected_dashboards[target].send(
                    json.dumps(
                        {
                            "type": "candidate",
                            "phone_id": client_id,
                            "candidate": candidate,
                        }
                    )
                )
            elif (
                client_id in self.connected_dashboards
                and target in self.connected_phones
            ):
                await self.connected_phones[target].send(
                    json.dumps({"type": "candidate", "candidate": candidate})
                )

    async def _handle_subscribe(self, client_id: str, data: dict):
        """Handle dashboard subscription to phone streams"""
        phone_ids = data.get("phone_ids", [])

        if client_id in self.dashboard_subscriptions:
            self.dashboard_subscriptions[client_id] = set(phone_ids)

            await self._send_to_dashboard(
                client_id,
                {
                    "type": "subscription_confirmed",
                    "subscribed_streams": list(phone_ids),
                },
            )

    async def _handle_location_update(self, client_id: str, data: dict):
        """Handle GPS location update from phone"""
        if client_id in self.phone_streams:
            self.phone_streams[client_id]["latitude"] = data.get("latitude")
            self.phone_streams[client_id]["longitude"] = data.get("longitude")
            self.phone_streams[client_id]["last_seen"] = datetime.now(
                timezone.utc
            ).isoformat()

            await self._notify_dashboards(
                {
                    "type": "phone_location_update",
                    "phone_id": client_id,
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude"),
                    "accuracy": data.get("accuracy"),
                    "speed": data.get("speed"),
                    "heading": data.get("heading"),
                }
            )

    async def _handle_stream_status(self, client_id: str, data: dict):
        """Handle stream status update"""
        status = data.get("status")

        if client_id in self.phone_streams:
            self.phone_streams[client_id]["status"] = status

            await self._notify_dashboards(
                {
                    "type": "stream_status_update",
                    "phone_id": client_id,
                    "status": status,
                }
            )

    async def _notify_dashboards(self, message: dict):
        """Broadcast message to all connected dashboards"""
        for dashboard_id, websocket in list(self.connected_dashboards.items()):
            try:
                await websocket.send(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending to dashboard {dashboard_id}: {e}")

    async def _send_to_dashboard(self, dashboard_id: str, message: dict):
        """Send message to specific dashboard"""
        if dashboard_id in self.connected_dashboards:
            try:
                await self.connected_dashboards[dashboard_id].send(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending to dashboard {dashboard_id}: {e}")

    async def _cleanup_client(self, client_id: str):
        """Clean up when client disconnects"""
        if client_id in self.connected_phones:
            del self.connected_phones[client_id]

            if client_id in self.phone_streams:
                self.phone_streams[client_id]["status"] = "disconnected"

            await self._notify_dashboards(
                {"type": "phone_disconnected", "phone_id": client_id}
            )

            logger.info(f"Phone disconnected: {client_id}")

        if client_id in self.connected_dashboards:
            del self.connected_dashboards[client_id]

            if client_id in self.dashboard_subscriptions:
                del self.dashboard_subscriptions[client_id]

            logger.info(f"Dashboard disconnected: {client_id}")

    async def start(self):
        """Start the WebRTC signaling server"""
        logger.info(f"Starting WebRTC Signaling Server on ws://{self.host}:{self.port}")

        async with websockets.serve(self.handler, self.host, self.port):
            logger.info("WebRTC Signaling Server running")
            await asyncio.Future()


async def main():
    server = WebRTCSignalingServer(host="0.0.0.0", port=8765)
    await server.start()


if __name__ == "__main__":
    asyncio.run(main())
