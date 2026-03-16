from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
import json

router = APIRouter(prefix="/api/v1/tracking", tags=["Real-time Tracking"])


class LocationUpdate(BaseModel):
    responder_id: str
    latitude: float
    longitude: float
    speed: Optional[float] = 0
    heading: Optional[float] = 0
    timestamp: Optional[str] = None


class ResponderLocation(BaseModel):
    responder_id: str
    responder_name: str
    responder_type: str
    status: str
    latitude: float
    longitude: float
    speed: float
    heading: float
    timestamp: str
    assigned_incident: Optional[str] = None


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.responder_locations: Dict[str, ResponderLocation] = {}
        self.dashboard_connections: List[WebSocket] = []

    async def connect_responder(self, websocket: WebSocket, responder_id: str):
        await websocket.accept()
        self.active_connections[responder_id] = websocket

    def disconnect_responder(self, responder_id: str):
        if responder_id in self.active_connections:
            del self.active_connections[responder_id]
        if responder_id in self.responder_locations:
            del self.responder_locations[responder_id]

    async def connect_dashboard(self, websocket: WebSocket):
        await websocket.accept()
        self.dashboard_connections.append(websocket)
        await self.send_all_locations(websocket)

    def disconnect_dashboard(self, websocket: WebSocket):
        if websocket in self.dashboard_connections:
            self.dashboard_connections.remove(websocket)

    async def update_responder_location(self, location: LocationUpdate):
        responder_id = location.responder_id

        self.responder_locations[responder_id] = ResponderLocation(
            responder_id=responder_id,
            responder_name=f"Responder {responder_id}",
            responder_type="police",
            status="active",
            latitude=location.latitude,
            longitude=location.longitude,
            speed=location.speed,
            heading=location.heading,
            timestamp=location.timestamp or datetime.now().isoformat(),
        )

        await self.broadcast_location_update(self.responder_locations[responder_id])

    async def broadcast_location_update(self, location: ResponderLocation):
        message = {"type": "location_update", "data": location.model_dump()}

        for dashboard in self.dashboard_connections:
            try:
                await dashboard.send_json(message)
            except Exception:
                pass

    async def send_all_locations(self, websocket: WebSocket):
        locations = list(self.responder_locations.values())
        await websocket.send_json(
            {"type": "all_locations", "data": [loc.model_dump() for loc in locations]}
        )

    async def broadcast_incident_assignment(
        self, responder_id: str, incident_id: str, incident_location: dict
    ):
        if responder_id in self.active_connections:
            await self.active_connections[responder_id].send_json(
                {
                    "type": "incident_assignment",
                    "data": {"incident_id": incident_id, "location": incident_location},
                }
            )


manager = ConnectionManager()


@router.websocket("/ws/responder/{responder_id}")
async def websocket_responder(websocket: WebSocket, responder_id: str):
    await manager.connect_responder(websocket, responder_id)
    try:
        while True:
            data = await websocket.receive_text()
            location_data = json.loads(data)
            location = LocationUpdate(
                responder_id=responder_id,
                latitude=location_data.get("latitude", 0),
                longitude=location_data.get("longitude", 0),
                speed=location_data.get("speed", 0),
                heading=location_data.get("heading", 0),
                timestamp=location_data.get("timestamp", datetime.now().isoformat()),
            )
            await manager.update_responder_location(location)
    except WebSocketDisconnect:
        manager.disconnect_responder(responder_id)


@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await manager.connect_dashboard(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_dashboard(websocket)


@router.get("/locations")
async def get_all_locations():
    return {
        "locations": [loc.model_dump() for loc in manager.responder_locations.values()]
    }


@router.get("/locations/{responder_id}")
async def get_responder_location(responder_id: str):
    if responder_id not in manager.responder_locations:
        raise HTTPException(status_code=404, detail="Responder not found")
    return manager.responder_locations[responder_id]


@router.post("/locations/{responder_id}/assignment")
async def assign_incident(
    responder_id: str, incident_id: str, incident_lat: float, incident_lng: float
):
    await manager.broadcast_incident_assignment(
        responder_id, incident_id, {"latitude": incident_lat, "longitude": incident_lng}
    )
    return {"status": "assigned"}
