"""
Kenya NTSA Road Safety - SMS Notification Service
Integrates with various SMS gateways for sending alerts and notifications
"""

import asyncio
import random
from datetime import datetime, timezone
from typing import List
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SMSProvider(str, Enum):
    AFRICASTALKING = "africastalking"
    MPOWA = "mpowa"
    DUMMY = "dummy"  # For testing


class MessageType(str, Enum):
    ALERT = "alert"
    VIOLATION = "violation"
    DISPATCH = "dispatch"
    EMERGENCY = "emergency"
    REMINDER = "reminder"
    VERIFICATION = "verification"


class SMSService:
    """SMS notification service for NTSA Road Safety"""

    def __init__(self, provider: SMSProvider = SMSProvider.DUMMY):
        self.provider = provider
        self.sent_messages = []
        self.api_key = ""
        self.username = ""
        self.sender_id = "NTSA"

    def configure(self, api_key: str, username: str, sender_id: str = "NTSA"):
        """Configure SMS provider credentials"""
        self.api_key = api_key
        self.username = username
        self.sender_id = sender_id
        logger.info(f"SMS Service configured with provider: {self.provider}")

    async def send_sms(
        self, phone: str, message: str, message_type: MessageType = MessageType.ALERT
    ) -> dict:
        """Send SMS to a single recipient"""
        # Format phone number (Kenyan format)
        if phone.startswith("+"):
            phone = phone[1:]
        if phone.startswith("0"):
            phone = "254" + phone[1:]
        if not phone.startswith("254"):
            phone = "254" + phone

        msg_id = f"sms_{random.randint(100000, 999999)}"

        # In production, integrate with actual SMS provider
        if self.provider == SMSProvider.DUMMY:
            # Simulate SMS sending
            await asyncio.sleep(0.1)  # Simulate network delay
            result = {
                "success": True,
                "message_id": msg_id,
                "phone": phone,
                "status": "sent",
                "message": message,
                "message_type": message_type.value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        else:
            # Real provider integration would go here
            result = {
                "success": True,
                "message_id": msg_id,
                "phone": phone,
                "status": "sent",
                "message": message,
                "message_type": message_type.value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        self.sent_messages.append(result)
        logger.info(f"SMS sent to {phone}: {message[:50]}...")

        return result

    async def send_bulk_sms(
        self,
        phones: List[str],
        message: str,
        message_type: MessageType = MessageType.ALERT,
    ) -> dict:
        """Send SMS to multiple recipients"""
        results = []
        for phone in phones:
            try:
                result = await self.send_sms(phone, message, message_type)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to send SMS to {phone}: {str(e)}")
                results.append({"phone": phone, "success": False, "error": str(e)})

        return {
            "total": len(phones),
            "successful": len([r for r in results if r.get("success")]),
            "failed": len([r for r in results if not r.get("success")]),
            "results": results,
        }

    async def send_violation_notice(
        self,
        phone: str,
        plate_number: str,
        violation_type: str,
        fine_amount: float,
        notice_id: str,
    ) -> dict:
        """Send violation notice to vehicle owner"""
        message = f"NTSA: You have been issued a notice for {violation_type.replace('_', ' ').title()} on {datetime.now().strftime('%Y-%m-%d')}. Plate: {plate_number}. Fine: KES {int(fine_amount)}. Notice ID: {notice_id}. Pay within 30 days to avoid penalty."
        return await self.send_sms(phone, message, MessageType.VIOLATION)

    async def send_accident_alert(
        self, phone: str, severity: str, location: str
    ) -> dict:
        """Send accident alert"""
        message = f"NTSA ALERT: Accident reported at {location}. Severity: {severity.upper()}. Emergency services have been dispatched. For assistance, call 999."
        return await self.send_sms(phone, message, MessageType.ALERT)

    async def send_dispatch_notification(
        self, phone: str, team_name: str, location: str, eta: str
    ) -> dict:
        """Send dispatch notification to response team"""
        message = f"NTSA DISPATCH: {team_name} - Respond to {location}. ETA: {eta}. Check mobile app for details."
        return await self.send_sms(phone, message, MessageType.DISPATCH)

    async def send_emergency_alert(self, phones: List[str], message: str) -> dict:
        """Send emergency alert to multiple recipients"""
        full_message = f"NTSA EMERGENCY ALERT: {message}. Stay safe. Call 999 for emergency services."
        return await self.send_bulk_sms(phones, full_message, MessageType.EMERGENCY)

    async def send_reminder(self, phone: str, message: str) -> dict:
        """Send reminder notification"""
        full_message = f"NTSA REMINDER: {message}"
        return await self.send_sms(phone, full_message, MessageType.REMINDER)

    async def send_verification_code(self, phone: str, code: str) -> dict:
        """Send verification code"""
        message = f"NTSA: Your verification code is {code}. This code expires in 10 minutes. Do not share this code."
        return await self.send_sms(phone, message, MessageType.VERIFICATION)

    def get_message_history(self, limit: int = 100) -> List[dict]:
        """Get SMS message history"""
        return self.sent_messages[-limit:]

    def get_statistics(self) -> dict:
        """Get SMS sending statistics"""
        return {
            "total_sent": len(self.sent_messages),
            "successful": len(
                [m for m in self.sent_messages if m.get("status") == "sent"]
            ),
            "by_type": {
                mt.value: len(
                    [m for m in self.sent_messages if m.get("message_type") == mt.value]
                )
                for mt in MessageType
            },
        }


# Global SMS service instance
sms_service = SMSService()


# Template messages
VIOLATION_TEMPLATES = {
    "speeding": "NTSA: Speed violation detected on {date}. Location: {location}. Speed: {speed} km/h. Limit: {limit} km/h. Fine: KES {fine}. Notice: {notice_id}",
    "red_light": "NTSA: Red light violation on {date}. Location: {location}. Fine: KES {fine}. Notice: {notice_id}",
    "drunk_driving": "NTSA: DUI violation on {date}. Location: {location}. Fine: KES {fine}. License may be suspended. Notice: {notice_id}",
    "illegal_parking": "NTSA: Illegal parking on {date}. Location: {location}. Fine: KES {fine}. Notice: {notice_id}",
    "using_phone": "NTSA: Phone use while driving on {date}. Location: {location}. Fine: KES {fine}. Notice: {notice_id}",
}


async def send_violation_notification(violation_data: dict, phone: str) -> dict:
    """Send violation notification using template"""
    vtype = violation_data.get("violation_type", "speeding")
    template = VIOLATION_TEMPLATES.get(vtype, VIOLATION_TEMPLATES["speeding"])

    message = template.format(
        date=datetime.now().strftime("%Y-%m-%d"),
        location=violation_data.get("location", "Unknown"),
        speed=violation_data.get("speed_detected", "N/A"),
        limit=violation_data.get("speed_limit", "N/A"),
        fine=violation_data.get("fine_amount", 0),
        notice_id=violation_data.get("id", "N/A"),
    )

    return await sms_service.send_sms(phone, message, MessageType.VIOLATION)
