from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable
from datetime import datetime
import re


@dataclass
class VoiceCommand:
    command_id: str
    keywords: List[str]
    description: str
    action: str
    parameters: List[str] = field(default_factory=list)
    emergency: bool = False


@dataclass
class VoiceRecognitionResult:
    command: Optional[VoiceCommand]
    transcript: str
    confidence: float
    timestamp: datetime
    action_taken: bool
    response_message: str


class VoiceCommandSystem:
    COMMANDS = {
        "emergency": VoiceCommand(
            command_id="V001",
            keywords=["help", "emergency", "sos", "accident", "crash", "help me", "save me"],
            description="Emergency assistance request",
            action="trigger_emergency",
            emergency=True
        ),
        "report_incident": VoiceCommand(
            command_id="V002",
            keywords=["report", "incident", "accident", "crash", "collision", "report accident"],
            description="Report a new incident",
            action="create_incident"
        ),
        "speed_limit": VoiceCommand(
            command_id="V003",
            keywords=["speed", "speed limit", "how fast", "limit"],
            description="Check speed limit for current road",
            action="get_speed_limit"
        ),
        "nearest_hospital": VoiceCommand(
            command_id="V004",
            keywords=["hospital", "medical", "clinic", "doctor", "health"],
            description="Find nearest medical facility",
            action="find_nearest_hospital"
        ),
        "nearest_police": VoiceCommand(
            command_id="V005",
            keywords=["police", "cop", "authority", "security"],
            description="Find nearest police station",
            action="find_nearest_police"
        ),
        "navigation": VoiceCommand(
            command_id="V006",
            keywords=["navigate", "direction", "route", "take me", "go to"],
            description="Navigate to destination",
            action="start_navigation",
            parameters=["destination"]
        ),
        "call_ambulance": VoiceCommand(
            command_id="V007",
            keywords=["ambulance", "medical emergency", "paramedic"],
            description="Call ambulance",
            action="call_ambulance",
            emergency=True
        ),
        "call_police": VoiceCommand(
            command_id="V008",
            keywords=["police", "law enforcement"],
            description="Call police",
            action="call_police",
            emergency=True
        ),
        "traffic_info": VoiceCommand(
            command_id="V009",
            keywords=["traffic", "congestion", "jam", "road conditions"],
            description="Get traffic information",
            action="get_traffic_info"
        ),
        "weather": VoiceCommand(
            command_id="V010",
            keywords=["weather", "rain", "sunny", "climate"],
            description="Get weather information",
            action="get_weather"
        ),
        "fuel_station": VoiceCommand(
            command_id="V011",
            keywords=["fuel", "petrol", "gas", "filling station"],
            description="Find nearest fuel station",
            action="find_fuel_station"
        ),
        "status": VoiceCommand(
            command_id="V012",
            keywords=["status", "system", "how are you"],
            description="Check system status",
            action="get_system_status"
        ),
    }

    def __init__(self):
        self.command_handlers: Dict[str, Callable] = {}
        self.command_history: List[VoiceRecognitionResult] = []
        self.emergency_callback: Optional[Callable] = None

    def register_handler(self, action: str, handler: Callable):
        self.command_handlers[action] = handler

    def set_emergency_handler(self, handler: Callable):
        self.emergency_callback = handler

    def process_speech(self, transcript: str) -> VoiceRecognitionResult:
        transcript_lower = transcript.lower().strip()
        
        best_match = None
        best_confidence = 0.0
        
        for command in self.COMMANDS.values():
            for keyword in command.keywords:
                if keyword in transcript_lower:
                    confidence = len(keyword) / len(transcript_lower)
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_match = command
                    if keyword == transcript_lower:
                        confidence = 1.0
                        best_confidence = confidence
                        best_match = command
        
        if best_match:
            response_message = self._execute_command(best_match, transcript)
            
            result = VoiceRecognitionResult(
                command=best_match,
                transcript=transcript,
                confidence=best_confidence,
                timestamp=datetime.now(),
                action_taken=True,
                response_message=response_message
            )
        else:
            result = VoiceRecognitionResult(
                command=None,
                transcript=transcript,
                confidence=best_confidence,
                timestamp=datetime.now(),
                action_taken=False,
                response_message="Sorry, I didn't understand that command. Try saying 'help', 'report accident', or 'navigate to...'"
            )
        
        self.command_history.append(result)
        return result

    def _execute_command(self, command: VoiceCommand, transcript: str) -> str:
        if command.action in self.command_handlers:
            handler = self.command_handlers[command.action]
            try:
                result = handler(transcript, command)
                return result
            except Exception as e:
                return f"Error executing command: {str(e)}"
        
        default_responses = {
            "trigger_emergency": "Emergency services have been notified. Help is on the way.",
            "create_incident": "Creating incident report...",
            "get_speed_limit": "The speed limit for this road is 60 km/h in urban areas.",
            "find_nearest_hospital": "Searching for nearest hospital...",
            "find_nearest_police": "Searching for nearest police station...",
            "start_navigation": "Starting navigation...",
            "call_ambulance": "Calling ambulance...",
            "call_police": "Calling police...",
            "get_traffic_info": "Getting traffic information...",
            "get_weather": "Getting weather information...",
            "find_fuel_station": "Searching for nearest fuel station...",
            "get_system_status": "All systems operational.",
        }
        
        return default_responses.get(command.action, "Command received.")

    def get_command_statistics(self) -> Dict:
        total = len(self.command_history)
        if total == 0:
            return {"total_commands": 0}
        
        emergency_count = sum(1 for r in self.command_history if r.command and r.command.emergency)
        successful = sum(1 for r in self.command_history if r.action_taken)
        
        command_counts: Dict[str, int] = {}
        for result in self.command_history:
            if result.command:
                cmd_id = result.command.command_id
                command_counts[cmd_id] = command_counts.get(cmd_id, 0) + 1
        
        return {
            "total_commands": total,
            "emergency_commands": emergency_count,
            "successful_commands": successful,
            "success_rate": successful / total if total > 0 else 0,
            "command_breakdown": command_counts
        }

    def get_supported_commands(self) -> List[Dict]:
        return [
            {
                "id": cmd.command_id,
                "keywords": cmd.keywords,
                "description": cmd.description,
                "emergency": cmd.emergency
            }
            for cmd in self.COMMANDS.values()
        ]


voice_command_system = VoiceCommandSystem()
