"""
Kenya NTSA Road Safety - Reports & Export API
Generate and export reports in various formats
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json
import csv
import io
import random

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# In-memory report storage
REPORTS_DB = []


class ReportConfig(BaseModel):
    report_type: str
    title: str
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    filters: Optional[dict] = None


class ReportResponse(BaseModel):
    id: str
    report_type: str
    title: str
    generated_at: str
    status: str
    download_url: Optional[str] = None


# Generate mock report data
def generate_accident_report(date_from: str, date_to: str, filters: Optional[dict] = None):
    """Generate accident report data"""
    data = []
    for i in range(50):
        data.append({
            "id": f"acc_{i+1:04d}",
            "date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "type": random.choice(["head_on", "rear_end", "side_impact", "hit_pedestrian"]),
            "location": random.choice(["Mombasa Road", "Thika Highway", "Kenyatta Ave", "Ngong Road"]),
            "severity": random.choice(["low", "medium", "high", "critical"]),
            "casualties": random.randint(0, 5),
            "injuries": random.randint(0, 10),
            "vehicles": random.randint(1, 4),
            "cause": random.choice(["speeding", "reckless_driving", "red_light", "fatigue"]),
            "status": random.choice(["cleared", "under_investigation", "closed"])
        })
    return data


def generate_violation_report(date_from: str, date_to: str, filters: Optional[dict] = None):
    """Generate violation report data"""
    data = []
    for i in range(100):
        data.append({
            "id": f"viol_{i+1:04d}",
            "date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "type": random.choice(["speeding", "red_light", "drunk_driving", "illegal_parking", "using_phone"]),
            "plate_number": f"KAA{random.randint(100,999)}{random.choice('ABC')}",
            "location": random.choice(["Mombasa Road", "Thika Highway", "Kenyatta Ave", "Ngong Road"]),
            "fine_amount": random.randint(1000, 50000),
            "status": random.choice(["paid", "pending", "overdue"]),
            "points": random.randint(1, 14)
        })
    return data


def generate_revenue_report(date_from: str, date_to: str, filters: Optional[dict] = None):
    """Generate revenue report data"""
    data = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for month in months:
        data.append({
            "month": month,
            "fines_issued": random.randint(1000, 5000) * 1000,
            "fines_collected": random.randint(800, 4000) * 1000,
            "pending": random.randint(100, 1000) * 1000,
            "collection_rate": random.uniform(70, 95)
        })
    return data


@router.post("/generate")
async def generate_report(config: ReportConfig):
    """Generate a new report"""
    report_id = f"report_{len(REPORTS_DB) + 1:04d}"
    
    # Generate data based on report type
    if config.report_type == "accidents":
        data = generate_accident_report(
            config.date_from or "2024-01-01",
            config.date_to or "2024-12-31",
            config.filters
        )
    elif config.report_type == "violations":
        data = generate_violation_report(
            config.date_from or "2024-01-01",
            config.date_to or "2024-12-31",
            config.filters
        )
    elif config.report_type == "revenue":
        data = generate_revenue_report(
            config.date_from or "2024-01-01",
            config.date_to or "2024-12-31",
            config.filters
        )
    elif config.report_type == "road_safety":
        data = {
            "accidents": generate_accident_report(config.date_from or "2024-01-01", config.date_to or "2024-12-31"),
            "violations": generate_violation_report(config.date_from or "2024-01-01", config.date_to or "2024-12-31"),
            "revenue": generate_revenue_report(config.date_from or "2024-01-01", config.date_to or "2024-12-31")
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    report = {
        "id": report_id,
        "report_type": config.report_type,
        "title": config.title,
        "generated_at": datetime.now().isoformat(),
        "status": "completed",
        "data": data,
        "download_url": f"/api/reports/{report_id}/download"
    }
    
    REPORTS_DB.append(report)
    
    return {
        "id": report_id,
        "report_type": config.report_type,
        "title": config.title,
        "generated_at": report["generated_at"],
        "status": "completed",
        "download_url": report["download_url"]
    }


@router.get("/")
async def list_reports(limit: int = 50):
    """List all generated reports"""
    return REPORTS_DB[-limit:]


@router.get("/{report_id}")
async def get_report(report_id: str):
    """Get a specific report"""
    report = next((r for r in REPORTS_DB if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/{report_id}/download")
async def download_report(report_id: str, format: str = "json"):
    """Download report in specified format"""
    report = next((r for r in REPORTS_DB if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if format == "json":
        return StreamingResponse(
            io.StringIO(json.dumps(report["data"], indent=2)),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={report_id}.json"}
        )
    elif format == "csv":
        # Convert to CSV
        output = io.StringIO()
        if report["data"] and len(report["data"]) > 0:
            writer = csv.DictWriter(output, fieldnames=report["data"][0].keys())
            writer.writeheader()
            writer.writerows(report["data"])
        
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={report_id}.csv"}
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'json' or 'csv'")


@router.get("/templates")
async def get_report_templates():
    """Get available report templates"""
    return [
        {
            "id": "daily_summary",
            "name": "Daily Summary Report",
            "description": "Summary of accidents and violations for the day",
            "report_type": "road_safety"
        },
        {
            "id": "weekly_analysis",
            "name": "Weekly Analysis",
            "description": "Detailed weekly analysis of road safety metrics",
            "report_type": "road_safety"
        },
        {
            "id": "monthly_accidents",
            "name": "Monthly Accident Report",
            "description": "Comprehensive monthly accident statistics",
            "report_type": "accidents"
        },
        {
            "id": "violation_summary",
            "name": "Violation Summary",
            "description": "Summary of all traffic violations",
            "report_type": "violations"
        },
        {
            "id": "revenue_collection",
            "name": "Revenue Collection Report",
            "description": "Fines revenue and collection rates",
            "report_type": "revenue"
        },
        {
            "id": "hotspot_analysis",
            "name": "Accident Hotspot Analysis",
            "description": "Analysis of high-risk accident locations",
            "report_type": "accidents"
        },
        {
            "id": "speed_violations",
            "name": "Speed Violation Report",
            "description": "Detailed speed violation analysis",
            "report_type": "violations"
        }
    ]


@router.get("/quick/{template_id}")
async def generate_quick_report(template_id: str):
    """Generate a quick report from template"""
    templates = {
        "daily_summary": {
            "report_type": "road_safety",
            "title": "Daily Summary Report",
            "date_from": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "date_to": datetime.now().strftime("%Y-%m-%d")
        },
        "weekly_analysis": {
            "report_type": "road_safety",
            "title": "Weekly Analysis Report",
            "date_from": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
            "date_to": datetime.now().strftime("%Y-%m-%d")
        },
        "monthly_accidents": {
            "report_type": "accidents",
            "title": "Monthly Accident Report",
            "date_from": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "date_to": datetime.now().strftime("%Y-%m-%d")
        },
        "violation_summary": {
            "report_type": "violations",
            "title": "Violation Summary Report",
            "date_from": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "date_to": datetime.now().strftime("%Y-%m-%d")
        },
        "revenue_collection": {
            "report_type": "revenue",
            "title": "Revenue Collection Report",
            "date_from": (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d"),
            "date_to": datetime.now().strftime("%Y-%m-%d")
        },
        "hotspot_analysis": {
            "report_type": "accidents",
            "title": "Hotspot Analysis Report",
            "date_from": (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d"),
            "date_to": datetime.now().strftime("%Y-%m-%d")
        },
        "speed_violations": {
            "report_type": "violations",
            "title": "Speed Violation Report",
            "date_from": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "date_to": datetime.now().strftime("%Y-%m-%d")
        }
    }
    
    if template_id not in templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    config = ReportConfig(**templates[template_id])
    return await generate_report(config)
