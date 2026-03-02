"""
Kenya NTSA Road Safety - Notification Service
Unified notification service for SMS, Email, and Push notifications
"""

import os
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
import asyncio

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    SMS = "sms"
    EMAIL = "email"
    PUSH = "push"
    ALL = "all"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationService:
    """Unified notification service"""
    
    def __init__(self):
        self.sms_enabled = os.environ.get("SMS_ENABLED", "false").lower() == "true"
        self.email_enabled = os.environ.get("EMAIL_ENABLED", "false").lower() == "true"
        
        # Load templates
        self.templates = self._load_templates()
        
        # Notification history
        self.history: List[Dict] = []
    
    def _load_templates(self) -> Dict:
        """Load notification templates"""
        return {
            "violation_detected": {
                "sms": "NTSA: Speed violation detected for plate {plate}. Speed: {speed}km/h at {location}. Fine: KES {fine}",
                "email": "Speed Violation Notice\n\nDear {owner_name},\n\nA speeding violation was recorded for vehicle {plate}.\n\nDetails:\n- Location: {location}\n- Speed: {speed} km/h\n- Limit: {limit} km/h\n- Fine: KES {fine}\n\nPay within 30 days to avoid penalties.\n\nNTSA Kenya",
                "subject": "NTSA Speed Violation Notice - {plate}"
            },
            "accident_alert": {
                "sms": "NTSA Alert: Accident reported at {location}. Severity: {severity}. Emergency teams dispatched.",
                "email": "Accident Alert\n\nAn accident has been reported:\n\n- Location: {location}\n- Severity: {severity}\n- Type: {accident_type}\n- Reported: {time}\n\nEmergency response teams have been notified.\n\nNTSA Kenya",
                "subject": "NTSA Accident Alert - {location}"
            },
            "team_dispatched": {
                "sms": "NTSA: Team {team_name} dispatched to {location}. ETA: {eta}",
                "email": "Dispatch Notification\n\nTeam {team_name} has been dispatched:\n\n- Location: {location}\n- ETA: {eta}\n- Incident: {incident_type}\n\nNTSA Kenya",
                "subject": "NTSA Team Dispatched"
            },
            "payment_received": {
                "sms": "NTSA: Payment received for violation {violation_id}. Thank you.",
                "email": "Payment Confirmation\n\nYour payment has been received.\n\n- Violation ID: {violation_id}\n- Amount: KES {amount}\n- Date: {date}\n\nNTSA Kenya",
                "subject": "NTSA Payment Confirmation"
            },
            "emergency_alert": {
                "sms": "NTSA EMERGENCY: {message}. Location: {location}. Report to: {contact}",
                "email": "EMERGENCY ALERT\n\n{message}\n\nLocation: {location}\nTime: {time}\n\nNTSA Kenya",
                "subject": "NTSA EMERGENCY ALERT"
            },
            "reminder": {
                "sms": "NTSA Reminder: Your violation {violation_id} is due in {days} days. Fine: KES {fine}",
                "email": "Payment Reminder\n\nYour traffic violation is due soon.\n\n- Violation ID: {violation_id}\n- Due: {due_date}\n- Fine: KES {fine}\n\nPay online at www.ntsa.go.ke\n\nNTSA Kenya",
                "subject": "NTSA Payment Reminder"
            }
        }
    
    def format_message(self, template_name: str, notification_type: NotificationType, **kwargs) -> Dict[str, str]:
        """Format notification message from template"""
        template = self.templates.get(template_name, {})
        
        result = {}
        if notification_type in [NotificationType.SMS, NotificationType.ALL]:
            result["sms"] = template.get("sms", "").format(**kwargs)
        if notification_type in [NotificationType.EMAIL, NotificationType.ALL]:
            result["email"] = template.get("email", "").format(**kwargs)
            result["subject"] = template.get("subject", "NTSA Notification").format(**kwargs)
        
        return result
    
    async def send_violation_notification(self, violation: Dict, vehicle: Optional[Dict] = None):
        """Send violation notification"""
        plate = violation.get("plate_number", "Unknown")
        location = violation.get("location", "Unknown")
        speed = violation.get("speed_detected", 0)
        limit = violation.get("speed_limit", 0)
        fine = violation.get("fine_amount", 0)
        
        owner_name = vehicle.get("owner_name", "Vehicle Owner") if vehicle else "Vehicle Owner"
        
        messages = self.format_message(
            "violation_detected",
            NotificationType.ALL,
            plate=plate,
            location=location,
            speed=speed,
            limit=limit,
            fine=fine,
            owner_name=owner_name
        )
        
        # Get vehicle owner phone/email
        phone = vehicle.get("phone", "+254700000000") if vehicle else None
        email = vehicle.get("email", "owner@example.com") if vehicle else None
        
        return await self.send(phone=phone, email=email, **messages)
    
    async def send_accident_notification(self, accident: Dict):
        """Send accident alert notification"""
        messages = self.format_message(
            "accident_alert",
            NotificationType.ALL,
            location=accident.get("location", "Unknown"),
            severity=accident.get("severity", "Unknown"),
            accident_type=accident.get("accident_type", "Unknown"),
            time=accident.get("reported_at", datetime.now().isoformat())
        )
        
        # Broadcast to emergency contacts
        return await self.send_bulk(
            recipients=["+254700000001", "+254700000002"],
            **messages
        )
    
    async def send_team_dispatch_notification(self, team: Dict, incident: Dict):
        """Send team dispatch notification"""
        messages = self.format_message(
            "team_dispatched",
            NotificationType.ALL,
            team_name=team.get("name", "Team"),
            location=incident.get("location", "Unknown"),
            eta=team.get("eta", "10 min"),
            incident_type=incident.get("type", "incident")
        )
        
        return await self.send(phone=team.get("phone"), **messages)
    
    async def send(self, phone: Optional[str] = None, email: Optional[str] = None, 
                   sms: Optional[str] = None, email_body: Optional[str] = None,
                   subject: Optional[str] = None) -> Dict:
        """Send notification via configured channels"""
        results = {
            "sent_at": datetime.now().isoformat(),
            "channels": []
        }
        
        # Send SMS
        if self.sms_enabled and phone and sms:
            try:
                # Import and use SMS service
                from services.sms_notifications import sms_service
                result = await sms_service.send_sms(phone, sms)
                results["channels"].append({
                    "type": "sms",
                    "status": "sent",
                    "message_id": result.get("message_id")
                })
            except Exception as e:
                logger.error(f"SMS send error: {e}")
                results["channels"].append({
                    "type": "sms",
                    "status": "failed",
                    "error": str(e)
                })
        
        # Send Email
        if self.email_enabled and email and email_body:
            try:
                from services.email_notifications import email_service
                result = await email_service.send_email(
                    to=email,
                    subject=subject or "NTSA Notification",
                    body=email_body
                )
                results["channels"].append({
                    "type": "email",
                    "status": "sent",
                    "message_id": result.get("message_id")
                })
            except Exception as e:
                logger.error(f"Email send error: {e}")
                results["channels"].append({
                    "type": "email",
                    "status": "failed",
                    "error": str(e)
                })
        
        # Log to history
        self.history.append({
            **results,
            "phone": phone,
            "email": email
        })
        
        return results
    
    async def send_bulk(self, recipients: List[str], **kwargs) -> Dict:
        """Send to multiple recipients"""
        results = []
        for recipient in recipients:
            result = await self.send(phone=recipient, **kwargs)
            results.append(result)
        
        return {
            "total": len(recipients),
            "results": results
        }
    
    def get_history(self, limit: int = 100) -> List[Dict]:
        """Get notification history"""
        return self.history[-limit:]
    
    def get_stats(self) -> Dict:
        """Get notification statistics"""
        return {
            "total_sent": len(self.history),
            "sms_enabled": self.sms_enabled,
            "email_enabled": self.email_enabled,
            "by_type": {
                "sms": len([h for h in self.history if "sms" in h.get("channels", [])]),
                "email": len([h for h in self.history if "email" in h.get("channels", [])])
            }
        }


# Global notification service
notification_service = NotificationService()
