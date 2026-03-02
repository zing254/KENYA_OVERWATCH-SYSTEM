"""
Kenya NTSA Road Safety - Email Notification Service
Email notifications for reports, alerts, and updates
"""

import asyncio
import random
from datetime import datetime, timezone
from typing import List, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class EmailProvider(str, Enum):
    SMTP = "smtp"
    SENDGRID = "sendgrid"
    SES = "ses"
    DUMMY = "dummy"


class EmailType(str, Enum):
    VIOlATION_NOTICE = "violation_notice"
    ACCIDENT_ALERT = "accident_alert"
    DISPATCH_NOTICE = "dispatch_notice"
    WEEKLY_REPORT = "weekly_report"
    SYSTEM_ALERT = "system_alert"
    VERIFICATION = "verification"


class EmailService:
    """Email notification service for NTSA Road Safety"""
    
    def __init__(self, provider: EmailProvider = EmailProvider.DUMMY):
        self.provider = provider
        self.sent_emails = []
        self.smtp_host = ""
        self.smtp_port = 587
        self.smtp_user = ""
        self.smtp_password = ""
        self.from_email = "noreply@ntsa.go.ke"
        self.from_name = "NTSA Road Safety"
    
    def configure(self, smtp_host: str, smtp_port: int, smtp_user: str, smtp_password: str, from_email: str = None):
        """Configure SMTP settings"""
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_password = smtp_password
        if from_email:
            self.from_email = from_email
        logger.info(f"Email Service configured with provider: {self.provider}")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        email_type: EmailType = EmailType.SYSTEM_ALERT,
        html: bool = False
    ) -> dict:
        """Send email to a recipient"""
        msg_id = f"msg_{random.randint(100000, 999999)}"
        
        # In production, integrate with actual email provider
        if self.provider == EmailProvider.DUMMY:
            # Simulate email sending
            await asyncio.sleep(0.1)
            result = {
                "success": True,
                "message_id": msg_id,
                "to": to_email,
                "subject": subject,
                "status": "sent",
                "email_type": email_type.value,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            # Real provider integration would go here
            result = {
                "success": True,
                "message_id": msg_id,
                "to": to_email,
                "subject": subject,
                "status": "sent",
                "email_type": email_type.value,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        self.sent_emails.append(result)
        logger.info(f"Email sent to {to_email}: {subject[:50]}...")
        
        return result
    
    async def send_violation_notice(self, to_email: str, violation_data: dict) -> dict:
        """Send violation notice email"""
        subject = f"NTSA Violation Notice - {violation_data.get('id', 'N/A')}"
        body = f"""
Dear Vehicle Owner,

You have been issued a traffic violation notice by the National Transport and Safety Authority (NTSA).

Violation Details:
- Notice ID: {violation_data.get('id', 'N/A')}
- Violation Type: {violation_data.get('violation_type', 'N/A')}
- Location: {violation_data.get('location', 'N/A')}
- Date: {violation_data.get('detected_at', 'N/A')}
- Fine Amount: KES {violation_data.get('fine_amount', 0):,}
- Penalty Points: {violation_data.get('penalty_points', 0)}

Please pay your fine within 30 days to avoid additional penalties.

Pay online at: https://ntsa.go.ke/pay-fines

For inquiries, contact: +254-709-932-000

This is an automated message from NTSA Kenya.
        """
        return await self.send_email(to_email, subject, body, EmailType.VIOlATION_NOTICE)
    
    async def send_weekly_report(self, to_email: str, report_data: dict) -> dict:
        """Send weekly report email"""
        subject = "NTSA Weekly Road Safety Report"
        body = f"""
Dear NTSA Stakeaker,

Please find below the weekly road safety report summary:

ACCIDENTS:
- Total Accidents: {report_data.get('total_accidents', 0)}
- Casualties: {report_data.get('total_casualties', 0)}
- Injuries: {report_data.get('total_injuries', 0)}

VIOLATIONS:
- Total Violations: {report_data.get('total_violations', 0)}
- Fines Collected: KES {report_data.get('fines_collected', 0):,}
- Pending Fines: KES {report_data.get('pending_fines', 0):,}

HOTSPOTS:
{report_data.get('hotspots', 'No significant hotspots this week.')}

ROAD CONDITIONS:
{report_data.get('road_conditions', 'All major roads are operational.')}

For detailed information, please log in to the NTSA Dashboard.

Best regards,
National Transport and Safety Authority
Kenya
        """
        return await self.send_email(to_email, subject, body, EmailType.WEEKLY_REPORT)
    
    async def send_accident_alert(self, to_email: str, accident_data: dict) -> dict:
        """Send accident alert email"""
        subject = f"NTSA Alert: Accident at {accident_data.get('location', 'Unknown Location')}"
        body = f"""
Dear Stakeholder,

An accident has been reported:

Location: {accident_data.get('location', 'Unknown')}
Road: {accident_data.get('road_name', 'Unknown')}
Severity: {accident_data.get('severity', 'Unknown').upper()}
Type: {accident_data.get('accident_type', 'Unknown')}
Casualties: {accident_data.get('casualties', 0)}
Injuries: {accident_data.get('injuries', 0)}

Emergency services have been dispatched.

This is an automated alert from NTSA Kenya.
        """
        return await self.send_email(to_email, subject, body, EmailType.ACCIDENT_ALERT)
    
    async def send_dispatch_notice(self, to_email: str, dispatch_data: dict) -> dict:
        """Send dispatch notice to response team"""
        subject = f"NTSA Dispatch: {dispatch_data.get('incident_type', 'Incident')} - Priority {dispatch_data.get('priority', 'Normal')}"
        body = f"""
Dear Response Team,

You have been dispatched to an incident:

Incident Type: {dispatch_data.get('incident_type', 'Unknown')}
Location: {dispatch_data.get('location', 'Unknown')}
Priority: {dispatch_data.get('priority', 'Normal').upper()}
ETA: {dispatch_data.get('eta', '10 minutes')}

Please acknowledge and proceed to the location immediately.

NTSA Emergency Response Center
        """
        return await self.send_email(to_email, subject, body, EmailType.DISPATCH_NOTICE)
    
    async def send_system_alert(self, to_email: str, alert_data: dict) -> dict:
        """Send system alert"""
        subject = f"NTSA System Alert: {alert_data.get('title', 'System Notification')}"
        body = f"""
Dear Administrator,

System Alert Details:

Title: {alert_data.get('title', 'System Notification')}
Severity: {alert_data.get('severity', 'Normal').upper()}
Message: {alert_data.get('message', 'No additional details.')}
Time: {alert_data.get('timestamp', datetime.now(timezone.utc).isoformat())}

Please take necessary action if required.

NTSA System
        """
        return await self.send_email(to_email, subject, body, EmailType.SYSTEM_ALERT)
    
    def get_email_history(self, limit: int = 100) -> List[dict]:
        """Get email sending history"""
        return self.sent_emails[-limit:]
    
    def get_statistics(self) -> dict:
        """Get email sending statistics"""
        return {
            "total_sent": len(self.sent_emails),
            "successful": len([e for e in self.sent_emails if e.get("status") == "sent"]),
            "by_type": {
                etype.value: len([e for e in self.sent_emails if e.get("email_type") == etype.value])
                for etype in EmailType
            }
        }


# Global email service instance
email_service = EmailService()
