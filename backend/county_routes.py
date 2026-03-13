"""
County Analytics API Routes
REST API endpoints for county-level road safety analytics
"""

from fastapi import APIRouter, Query, HTTPException, Path, WebSocket, WebSocketDisconnect
from typing import Optional, List
from datetime import datetime
import asyncio
import random
import json

try:
    from .services.county_analytics import county_analytics
    from .county_data import KENYA_COUNTIES, get_county_by_name, get_regions
    from .services.report_generator import report_generator
    from .events import EventBroadcaster, EventType
    from .services.pdf_generator import generate_html_report, generate_all_counties_html_report
except ImportError:
    from services.county_analytics import county_analytics
    from county_data import KENYA_COUNTIES, get_county_by_name, get_regions
    try:
        from services.report_generator import report_generator
    except ImportError:
        report_generator = None
    try:
        from events import EventBroadcaster, EventType
    except ImportError:
        EventBroadcaster = EventType = None
    try:
        from services.pdf_generator import generate_html_report, generate_all_counties_html_report
    except ImportError:
        generate_html_report = generate_all_counties_html_report = None
    try:
        from services.hazard_alerts import alert_manager, AlertPriority, AlertCategory, HazardAlert
    except ImportError:
        alert_manager = None
        AlertPriority = AlertCategory = HazardAlert = None


router = APIRouter(prefix="/api/county", tags=["County Analytics"])


@router.get("/list")
async def list_counties():
    return {
        "counties": [
            {
                "code": c.code,
                "name": c.name,
                "region": c.region.value,
                "capital": c.capital,
                "population": c.population
            }
            for c in KENYA_COUNTIES
        ],
        "total": len(KENYA_COUNTIES)
    }


@router.get("/summary")
async def get_all_counties_summary(
    period: str = Query("month", pattern="^(day|week|month|quarter|year)$")
):
    return {
        "generated_at": datetime.now().isoformat(),
        "period": period,
        "counties": county_analytics.get_all_counties_summary(period)
    }


@router.get("/regions")
async def get_regions_summary():
    return {
        "generated_at": datetime.now().isoformat(),
        "regions": county_analytics.get_region_summary()
    }


@router.get("/{county_name}")
async def get_county_details(
    county_name: str,
    period: str = Query("month", pattern="^(day|week|month|quarter|year)$")
):
    county = get_county_by_name(county_name)
    if not county:
        raise HTTPException(status_code=404, detail=f"County not found: {county_name}")
    
    stats = county_analytics.get_county_stats(county_name, period)
    historical = county_analytics.get_historical_trends(county_name)
    hotspots = county_analytics.get_hazard_hotspots(county_name)
    
    return {
        "generated_at": datetime.now().isoformat(),
        "county": {
            "code": county.code,
            "name": county.name,
            "region": county.region.value,
            "capital": county.capital,
            "population": county.population,
            "area_sq_km": county.area_sq_km,
            "latitude": county.latitude,
            "longitude": county.longitude,
            "major_roads": county.major_roads,
            "road_density_km": county.road_density_km,
            "urban_centers": county.urban_centers,
            "risk_factors": county.risk_factors
        },
        "statistics": {
            "period": period,
            "total_accidents": stats.total_accidents,
            "total_violations": stats.total_violations,
            "fatalities": stats.fatalities,
            "injuries": stats.injuries,
            "risk_score": stats.risk_score,
            "trend": stats.trend,
            "top_roads": stats.top_roads,
            "incident_types": stats.incident_types,
            "monthly_data": stats.monthly_data,
            "severity_breakdown": stats.severity_breakdown
        },
        "historical": historical,
        "hotspots": [h for h in hotspots if h["county"] == county_name]
    }


@router.get("/{county_name}/comparative")
async def get_county_comparative(
    county_name: str,
    metric: str = Query("accidents", pattern="^(accidents|violations|fatalities|injuries|risk_score)$")
):
    county = get_county_by_name(county_name)
    if not county:
        raise HTTPException(status_code=404, detail=f"County not found: {county_name}")
    
    comparative = county_analytics.get_comparative_analysis(metric)
    county_rank = next((i for i, c in enumerate(comparative, 1) if c["county"] == county_name), None)
    
    return {
        "county": county_name,
        "metric": metric,
        "county_rank": county_rank,
        "total_counties": len(comparative),
        "comparison_data": comparative
    }


@router.get("/regions/{region_name}")
async def get_region_details(region_name: str):
    from .county_data import CountyRegion
    
    try:
        region = CountyRegion(region_name.title())
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Region not found: {region_name}")
    
    counties_in_region = [c for c in KENYA_COUNTIES if c.region == region]
    
    return {
        "region": region_name,
        "county_count": len(counties_in_region),
        "counties": [
            {
                "code": c.code,
                "name": c.name,
                "capital": c.capital,
                "population": c.population,
                "road_density_km": c.road_density_km
            }
            for c in counties_in_region
        ]
    }


@router.get("/hazards/hotspots")
async def get_hazard_hotspots(
    county: Optional[str] = None,
    limit: int = Query(20, le=50)
):
    hotspots = county_analytics.get_hazard_hotspots(county)
    return {
        "generated_at": datetime.now().isoformat(),
        "hotspots": hotspots[:limit],
        "total": len(hotspots)
    }


@router.get("/weather/impact")
async def get_weather_impact():
    return {
        "generated_at": datetime.now().isoformat(),
        "weather_impact": county_analytics.get_weather_impact()
    }


@router.get("/infrastructure/analysis")
async def get_infrastructure_analysis():
    return {
        "generated_at": datetime.now().isoformat(),
        "infrastructure": county_analytics.get_infrastructure_analysis()
    }


@router.get("/traffic/congestion")
async def get_traffic_congestion():
    return {
        "generated_at": datetime.now().isoformat(),
        "congestion_index": county_analytics.get_traffic_congestion_index()
    }


@router.get("/trends/{county_name}")
async def get_county_trends(
    county_name: str,
    years: int = Query(3, le=10)
):
    county = get_county_by_name(county_name)
    if not county:
        raise HTTPException(status_code=404, detail=f"County not found: {county_name}")
    
    return {
        "county": county_name,
        "years": years,
        "trends": county_analytics.get_historical_trends(county_name, years)
    }


@router.get("/leaderboard/{metric}")
async def get_county_leaderboard(
    metric: str = Path(..., pattern="^(accidents|violations|fatalities|injuries|risk_score|per_capita)$"),
    limit: int = Query(10, le=47)
):
    data = county_analytics.get_comparative_analysis(
        metric if metric != "per_capita" else "accidents"
    )
    
    sorted_data = sorted(
        data,
        key=lambda x: x.get("per_capita", 0) if metric == "per_capita" else x["value"],
        reverse=True
    )
    
    return {
        "metric": metric,
        "leaderboard": sorted_data[:limit],
        "total_counties": len(sorted_data)
    }


@router.get("/dashboard/overview")
async def get_dashboard_overview():
    all_counties = county_analytics.get_all_counties_summary("month")
    regions = county_analytics.get_region_summary()
    hotspots = county_analytics.get_hazard_hotspots()
    weather = county_analytics.get_weather_impact()
    congestion = county_analytics.get_traffic_congestion_index()
    infrastructure = county_analytics.get_infrastructure_analysis()
    
    return {
        "generated_at": datetime.now().isoformat(),
        "overview": {
            "total_counties": 47,
            "total_accidents": sum(c["total_accidents"] for c in all_counties),
            "total_violations": sum(c["total_violations"] for c in all_counties),
            "total_fatalities": sum(c["fatalities"] for c in all_counties),
            "total_injuries": sum(c["injuries"] for c in all_counties),
            "avg_risk_score": round(sum(c["risk_score"] for c in all_counties) / len(all_counties), 1),
            "high_risk_counties": len([c for c in all_counties if c["risk_score"] > 60]),
            "active_alerts": random.randint(15, 45)
        },
        "regions": regions,
        "top_hotspots": hotspots[:10],
        "weather_warnings": [w for w in weather if w["seasonal_warning"]],
        "most_congested": congestion[:5],
        "infrastructure_summary": infrastructure["summary"]
    }


@router.get("/report/{county_name}")
async def generate_county_report(
    county_name: str,
    report_type: str = Query("comprehensive", pattern="^(comprehensive|executive|hazard|infrastructure|weather_impact|traffic)$"),
    period: str = Query("month", pattern="^(day|week|month|quarter|year)$")
):
    county = get_county_by_name(county_name)
    if not county:
        raise HTTPException(status_code=404, detail=f"County not found: {county_name}")
    
    if report_generator is None:
        raise HTTPException(status_code=500, detail="Report generator not available")
    
    return {
        "generated_at": datetime.now().isoformat(),
        "county": county_name,
        "report_type": report_type,
        "period": period,
        "report": report_generator.generate_report(county_name, report_type, period)
    }


@router.get("/report/all/{report_type}")
async def generate_all_counties_report(
    report_type: str = Path(..., pattern="^(executive|comprehensive|hazard|infrastructure|weather_impact|traffic)$"),
    period: str = Query("month", pattern="^(day|week|month|quarter|year)$")
):
    if report_generator is None:
        raise HTTPException(status_code=500, detail="Report generator not available")
    
    return report_generator.generate_all_counties_report(report_type, period)


@router.get("/export/{county_name}")
async def export_county_data(
    county_name: str,
    format: str = Query("json", pattern="^(json|csv)$")
):
    county = get_county_by_name(county_name)
    if not county:
        raise HTTPException(status_code=404, detail=f"County not found: {county_name}")
    
    stats = county_analytics.get_county_stats(county_name, "month")
    
    data = {
        "county": county_name,
        "region": county.region.value,
        "population": county.population,
        "area_sq_km": county.area_sq_km,
        "statistics": {
            "total_accidents": stats.total_accidents,
            "total_violations": stats.total_violations,
            "fatalities": stats.fatalities,
            "injuries": stats.injuries,
            "risk_score": stats.risk_score
        },
        "exported_at": datetime.now().isoformat()
    }
    
    if format == "csv":
        csv_lines = ["county,region,population,accidents,violations,fatalities,injuries,risk_score"]
        csv_lines.append(f"{county_name},{county.region.value},{county.population},{stats.total_accidents},{stats.total_violations},{stats.fatalities},{stats.injuries},{stats.risk_score}")
        return {"format": "csv", "data": "\n".join(csv_lines)}
    
    return {"format": "json", "data": data}


class HazardWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast_hazard(self, hazard_data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json({
                    "type": "hazard_update",
                    "data": hazard_data,
                    "timestamp": datetime.now().isoformat()
                })
            except:
                pass
    
    async def broadcast_weather(self, weather_data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json({
                    "type": "weather_update",
                    "data": weather_data,
                    "timestamp": datetime.now().isoformat()
                })
            except:
                pass

hazard_ws_manager = HazardWebSocketManager()


@router.websocket("/ws/hazards")
async def websocket_hazards(websocket: WebSocket):
    await hazard_ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "subscribe_hazards":
                pass
            elif message.get("action") == "get_current":
                hazards = county_analytics.get_hazard_hotspots()
                await websocket.send_json({
                    "type": "current_hazards",
                    "data": hazards
                })
    except WebSocketDisconnect:
        hazard_ws_manager.disconnect(websocket)


@router.websocket("/ws/weather")
async def websocket_weather(websocket: WebSocket):
    await hazard_ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "subscribe_weather":
                pass
            elif message.get("action") == "get_current":
                weather = county_analytics.get_weather_impact()
                await websocket.send_json({
                    "type": "current_weather",
                    "data": weather
                })
    except WebSocketDisconnect:
        hazard_ws_manager.disconnect(websocket)


from fastapi.responses import HTMLResponse

@router.get("/report/{county_name}/pdf")
async def generate_county_pdf(
    county_name: str,
    period: str = Query("month", pattern="^(day|week|month|quarter|year)$")
):
    county = get_county_by_name(county_name)
    if not county:
        raise HTTPException(status_code=404, detail=f"County not found: {county_name}")
    
    if generate_html_report is None:
        raise HTTPException(status_code=500, detail="PDF generator not available")
    
    html_content = generate_html_report(county_name, "comprehensive", period)
    
    return HTMLResponse(
        content=html_content,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename={county_name}_report.html"}
    )


@router.get("/report/all/pdf")
async def generate_all_counties_pdf(
    period: str = Query("month", pattern="^(day|week|month|quarter|year)$")
):
    if generate_all_counties_html_report is None:
        raise HTTPException(status_code=500, detail="PDF generator not available")
    
    html_content = generate_all_counties_html_report(period)
    
    return HTMLResponse(
        content=html_content,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename=kenya_national_report.html"}
    )


@router.get("/alerts")
async def get_alerts(
    county: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None
):
    if alert_manager is None:
        raise HTTPException(status_code=500, detail="Alert manager not available")
    
    prio = None
    if priority:
        try:
            prio = AlertPriority[priority.upper()]
        except KeyError:
            pass
    
    cat = None
    if category:
        try:
            cat = AlertCategory[category.upper()]
        except KeyError:
            pass
    
    alerts = alert_manager.get_active_alerts(county, prio, cat)
    
    return {
        "total": len(alerts),
        "alerts": [alert_manager.to_dict(a) for a in alerts]
    }


@router.get("/alerts/summary")
async def get_alerts_summary():
    if alert_manager is None:
        raise HTTPException(status_code=500, detail="Alert manager not available")
    
    summary = alert_manager.get_alert_summary()
    return {
        "generated_at": datetime.now().isoformat(),
        **summary
    }


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, acknowledged_by: str = "System"):
    if alert_manager is None:
        raise HTTPException(status_code=500, detail="Alert manager not available")
    
    alert = alert_manager.acknowledge_alert(alert_id, acknowledged_by)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"status": "acknowledged", "alert": alert_manager.to_dict(alert)}


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    if alert_manager is None:
        raise HTTPException(status_code=500, detail="Alert manager not available")
    
    alert = alert_manager.resolve_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"status": "resolved", "alert_id": alert_id}


@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await websocket.accept()
    
    if alert_manager is None:
        await websocket.close()
        return
    
    async def send_alert(alert: HazardAlert):
        await websocket.send_json({
            "type": "new_alert",
            "data": alert_manager.to_dict(alert)
        })
    
    alert_manager.subscribe(send_alert)
    
    try:
        await websocket.send_json({
            "type": "connected",
            "message": "Subscribed to hazard alerts",
            "active_alerts": [alert_manager.to_dict(a) for a in alert_manager.get_active_alerts()]
        })
        
        while True:
            data = await websocket.receive_text()
    except:
        pass
    finally:
        alert_manager.unsubscribe(send_alert)


import random
