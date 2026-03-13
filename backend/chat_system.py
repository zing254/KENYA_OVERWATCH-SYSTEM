from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import json


router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    message_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    message: str
    timestamp: str
    channel: str = "general"
    is_emergency: bool = False


class ChatManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.channels: Dict[str, List[str]] = {
            "general": [],
            "emergency": [],
            "dispatch": []
        }
        self.message_history: Dict[str, List[ChatMessage]] = {
            "general": [],
            "emergency": [],
            "dispatch": []
        }
        self.user_info: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str, user_data: dict):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_info[user_id] = user_data
        
        if user_data.get("channel") and user_data["channel"] not in self.channels:
            self.channels[user_data["channel"]] = []
        
        if user_id not in self.channels["general"]:
            self.channels["general"].append(user_id)
        
        await self.send_personal_message({
            "type": "connected",
            "message": "Connected to Kenya Overwatch Chat",
            "channels": list(self.channels.keys()),
            "user_id": user_id
        }, user_id)
        
        await self.broadcast_user_list()

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        for channel in self.channels:
            if user_id in self.channels[channel]:
                self.channels[channel].remove(user_id)
        if user_id in self.user_info:
            del self.user_info[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                pass

    async def broadcast(self, message: dict, channel: str = "general"):
        if channel not in self.channels:
            channel = "general"
        
        for user_id in self.channels.get(channel, []):
            await self.send_personal_message(message, user_id)
        
        for user_id in self.active_connections:
            if user_id not in self.channels.get(channel, []):
                await self.send_personal_message(message, user_id)

    async def broadcast_user_list(self):
        users = []
        for user_id, info in self.user_info.items():
            users.append({
                "user_id": user_id,
                "name": info.get("name", "Unknown"),
                "role": info.get("role", "viewer"),
                "status": "online"
            })
        
        await self.broadcast({
            "type": "user_list",
            "users": users
        })

    async def handle_message(self, user_id: str, data: dict):
        if user_id not in self.user_info:
            return

        msg_type = data.get("type")
        user_data = self.user_info[user_id]

        if msg_type == "chat_message":
            channel = data.get("channel", "general")
            message_text = data.get("message", "").strip()
            
            if not message_text:
                return

            chat_message = ChatMessage(
                message_id=str(uuid.uuid4()),
                sender_id=user_id,
                sender_name=user_data.get("name", "Unknown"),
                sender_role=user_data.get("role", "viewer"),
                message=message_text,
                timestamp=datetime.now().isoformat(),
                channel=channel,
                is_emergency=data.get("is_emergency", False)
            )

            if channel not in self.message_history:
                self.message_history[channel] = []
            self.message_history[channel].append(chat_message)
            
            if len(self.message_history[channel]) > 100:
                self.message_history[channel] = self.message_history[channel][-100:]

            broadcast_data = {
                "type": "chat_message",
                "message": chat_message.model_dump()
            }
            
            await self.broadcast(broadcast_data, channel)

        elif msg_type == "join_channel":
            channel = data.get("channel", "general")
            if channel not in self.channels:
                self.channels[channel] = []
            
            for ch in self.channels:
                if user_id in self.channels[ch]:
                    self.channels[ch].remove(user_id)
            
            if user_id not in self.channels[channel]:
                self.channels[channel].append(user_id)
            
            history = self.message_history.get(channel, [])[-50:]
            await self.send_personal_message({
                "type": "channel_history",
                "channel": channel,
                "messages": [m.model_dump() for m in history]
            }, user_id)

        elif msg_type == "get_history":
            channel = data.get("channel", "general")
            history = self.message_history.get(channel, [])[-50:]
            await self.send_personal_message({
                "type": "channel_history",
                "channel": channel,
                "messages": [m.model_dump() for m in history]
            }, user_id)

        elif msg_type == "get_users":
            await self.broadcast_user_list()


chat_manager = ChatManager()


@router.websocket("/ws/chat/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: str):
    try:
        data = await websocket.receive_text()
        try:
            user_data = json.loads(data)
        except:
            user_data = {"name": f"User_{user_id}", "role": "viewer"}

        await chat_manager.connect(websocket, user_id, user_data)
        
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    message_data = json.loads(data)
                    await chat_manager.handle_message(user_id, message_data)
                except json.JSONDecodeError:
                    pass
        except WebSocketDisconnect:
            chat_manager.disconnect(user_id)
    except Exception as e:
        chat_manager.disconnect(user_id)


@router.get("/channels")
async def get_channels():
    return {
        "channels": [
            {"id": "general", "name": "General", "description": "General team communication"},
            {"id": "emergency", "name": "Emergency", "description": "Emergency alerts only"},
            {"id": "dispatch", "name": "Dispatch", "description": "Dispatch coordination"}
        ]
    }


@router.get("/history/{channel}")
async def get_channel_history(channel: str, limit: int = 50):
    history = chat_manager.message_history.get(channel, [])[-limit:]
    return {
        "channel": channel,
        "messages": [m.model_dump() for m in history]
    }


@router.get("/users")
async def get_online_users():
    users = []
    for user_id, info in chat_manager.user_info.items():
        users.append({
            "user_id": user_id,
            "name": info.get("name", "Unknown"),
            "role": info.get("role", "viewer"),
            "status": "online"
        })
    return {"users": users}
