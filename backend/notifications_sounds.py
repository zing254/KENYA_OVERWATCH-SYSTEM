from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications & Alerts"])


class Notification(BaseModel):
    notification_id: str
    title: str
    message: str
    notification_type: str
    severity: str
    timestamp: str
    read: bool = False
    sender: Optional[str] = None
    recipient: Optional[str] = None
    data: Optional[Dict] = None


class SoundAlert(BaseModel):
    alert_id: str
    sound_type: str
    volume: float = 1.0
    repeat: bool = False
    auto_dismiss: int = 0


class NotificationManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.notifications: Dict[str, List[Notification]] = {}
        self.sound_alerts: List[SoundAlert] = []

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

        if user_id not in self.notifications:
            self.notifications[user_id] = []

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_notification(self, notification: Notification):
        user_id = notification.recipient
        if user_id and user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(
                    {"type": "notification", "data": notification.model_dump()}
                )
            except Exception:
                pass

        if user_id:
            if user_id not in self.notifications:
                self.notifications[user_id] = []
            self.notifications[user_id].insert(0, notification)
            if len(self.notifications[user_id]) > 100:
                self.notifications[user_id] = self.notifications[user_id][:100]

    async def broadcast_notification(self, notification: Notification):
        for user_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(
                    {"type": "notification", "data": notification.model_dump()}
                )
            except Exception:
                pass

        for user_id in list(self.notifications.keys()):
            self.notifications[user_id].insert(0, notification)
            if len(self.notifications[user_id]) > 100:
                self.notifications[user_id] = self.notifications[user_id][:100]

    async def play_sound(self, sound: SoundAlert, user_id: Optional[str] = None):
        target_connections = (
            [self.active_connections[user_id]]
            if user_id and user_id in self.active_connections
            else list(self.active_connections.values())
        )

        for websocket in target_connections:
            try:
                await websocket.send_json(
                    {"type": "sound_alert", "data": sound.model_dump()}
                )
            except Exception:
                pass

    def get_user_notifications(
        self, user_id: str, unread_only: bool = False
    ) -> List[Notification]:
        notifications = self.notifications.get(user_id, [])
        if unread_only:
            notifications = [n for n in notifications if not n.read]
        return notifications[:50]

    def mark_as_read(self, user_id: str, notification_id: str):
        if user_id in self.notifications:
            for notif in self.notifications[user_id]:
                if notif.notification_id == notification_id:
                    notif.read = True

    def mark_all_as_read(self, user_id: str):
        if user_id in self.notifications:
            for notif in self.notifications[user_id]:
                notif.read = True

    async def send_emergency_alert(self, title: str, message: str, location: Dict):
        notification = Notification(
            notification_id=f"EMG_{datetime.now().timestamp()}",
            title=title,
            message=message,
            notification_type="emergency",
            severity="critical",
            timestamp=datetime.now().isoformat(),
            data=location,
        )
        await self.broadcast_notification(notification)

        sound = SoundAlert(
            alert_id=f"SND_{datetime.now().timestamp()}",
            sound_type="emergency",
            volume=1.0,
            repeat=True,
        )

        for websocket in self.active_connections.values():
            try:
                await websocket.send_json(
                    {"type": "sound_alert", "data": sound.model_dump()}
                )
            except Exception:
                pass


notification_manager = NotificationManager()


@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    await notification_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id)


@router.post("/send")
async def send_notification(notification: Notification):
    await notification_manager.send_notification(notification)
    return {"status": "sent"}


@router.post("/broadcast")
async def broadcast_notification(notification: Notification):
    await notification_manager.broadcast_notification(notification)
    return {"status": "broadcast"}


@router.post("/emergency")
async def emergency_alert(title: str, message: str, latitude: float, longitude: float):
    await notification_manager.send_emergency_alert(
        title, message, {"latitude": latitude, "longitude": longitude}
    )
    return {"status": "emergency_broadcast"}


@router.get("/user/{user_id}")
async def get_notifications(user_id: str, unread_only: bool = False):
    notifications = notification_manager.get_user_notifications(user_id, unread_only)
    return {"notifications": [n.model_dump() for n in notifications]}


@router.post("/user/{user_id}/read/{notification_id}")
async def mark_read(user_id: str, notification_id: str):
    notification_manager.mark_as_read(user_id, notification_id)
    return {"status": "marked"}


@router.post("/user/{user_id}/read-all")
async def mark_all_read(user_id: str):
    notification_manager.mark_all_as_read(user_id)
    return {"status": "all_marked"}


@router.get("/sound-types")
async def get_sound_types():
    return {
        "sounds": [
            {
                "id": "emergency",
                "name": "Emergency Alarm",
                "description": "Critical emergency alert",
            },
            {
                "id": "alert",
                "name": "General Alert",
                "description": "Standard alert notification",
            },
            {"id": "warning", "name": "Warning", "description": "Warning tone"},
            {
                "id": "notification",
                "name": "New Notification",
                "description": "New message notification",
            },
            {
                "id": "incident",
                "name": "New Incident",
                "description": "Incident assignment alert",
            },
            {
                "id": "dispatch",
                "name": "Dispatch Alert",
                "description": "Dispatch notification",
            },
            {
                "id": "road_sign",
                "name": "Road Sign Warning",
                "description": "Proximity to road sign",
            },
            {
                "id": "speed_camera",
                "name": "Speed Camera",
                "description": "Speed camera warning",
            },
        ]
    }
