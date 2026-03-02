# Kenya Overwatch - API Reference

## Base URL
```
http://localhost:8001
```

## Authentication

All endpoints (except `/api/health` and auth) require JWT Bearer token:
```
Authorization: Bearer <token>
```

### Login
```
POST /api/auth/token
Content-Type: application/x-www-form-urlencoded

username=admin&password=DevSetup@2024
```

Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 30
}
```

## Endpoints

### Health Check
```
GET /api/health
```
Response:
```json
{
  "status": "healthy",
  "api_version": "v2",
  "services": {
    "road_safety_engine": "up",
    "accident_db": "up",
    "violation_db": "up",
    "speed_detection": "up",
    "websocket": "up"
  },
  "timestamp": "2026-03-02T18:46:40.191077+00:00"
}
```

### Dashboard
```
GET /api/dashboard/stats
GET /api/dashboard/summary
```

### Accidents
```
GET /api/accidents?status=<status>&severity=<severity>&limit=100
POST /api/accidents
```
Request Body:
```json
{
  "accident_type": "rear_end",
  "cause": "speeding",
  "location": "Mombasa Road Junction",
  "road_name": "Mombasa Road (A109)",
  "lat": -1.33,
  "lng": 36.98,
  "severity": "high",
  "vehicles": ["KAA001A"],
  "description": "Two vehicles collided"
}
```

### Violations
```
GET /api/violations?status=<status>&plate_number=<plate>
POST /api/violations
```
Request Body:
```json
{
  "violation_type": "speeding",
  "plate_number": "KAA001A",
  "vehicle_type": "saloon",
  "location": "Mombasa Road",
  "road_name": "Mombasa Road (A109)",
  "lat": -1.33,
  "lng": 36.98,
  "camera_id": "cam_001",
  "speed_detected": 120,
  "speed_limit": 100
}
```

### Incidents (v1)
```
GET /api/v1/services/incidents
POST /api/v1/services/incidents
GET /api/v1/services/incidents/{id}
PATCH /api/v1/services/incidents/{id}/status
GET /api/v1/services/incidents/active
GET /api/v1/services/incidents/nearby?lat=<lat>&lng=<lng>&radius=<km>
```
Request Body:
```json
{
  "incident_type": "accident",
  "location": {"lat": -1.33, "lng": 36.98},
  "address": "Mombasa Road Junction",
  "road_name": "A109",
  "county": "Nairobi",
  "description": "Traffic accident",
  "severity_modifier": "high"
}
```

Status Update:
```json
{
  "status": "verified"
}
```

### Responders (v1)
```
GET /api/v1/services/responders
POST /api/v1/services/responders
GET /api/v1/services/responders/{id}
PATCH /api/v1/services/responders/{id}/status
GET /api/v1/services/responders/available
```
Request Body:
```json
{
  "id": "resp_001",
  "name": "Alpha Unit",
  "type": "police",
  "badge_number": "P001",
  "phone": "+254700000001",
  "station": "CBD",
  "latitude": -1.2864,
  "longitude": 36.8232
}
```

### Dispatch (v1)
```
POST /api/v1/services/dispatch
GET /api/v1/services/dispatch/incident/{incident_id}
PATCH /api/v1/services/dispatch/{dispatch_id}/acknowledge
PATCH /api/v1/services/dispatch/{dispatch_id}/enroute
PATCH /api/v1/services/dispatch/{dispatch_id}/onscene
PATCH /api/v1/services/dispatch/{dispatch_id}/resolve
```
Request Body:
```json
{
  "incident_id": "INC-9822298A",
  "required_types": ["police", "ambulance"],
  "optional_types": ["tow_truck"]
}
```

### Cameras
```
GET /api/cameras
GET /api/cameras/{id}
POST /api/cameras
POST /api/cameras/{id}/start
POST /api/cameras/{id}/stop
```

### Teams
```
GET /api/teams
GET /api/teams/{id}
```

### Alerts
```
GET /api/alerts?acknowledged=false
POST /api/alerts/{id}/acknowledge
```

### Analytics
```
GET /api/v1/services/analytics/predictions
GET /api/v1/services/analytics/high-risk-roads
GET /api/v1/services/analytics/statistics
```

### Locations
```
GET /api/v1/services/locations
GET /api/v1/services/locations/{responder_id}
PUT /api/v1/services/locations/{responder_id}/gps
```
Request Body:
```json
{
  "latitude": -1.2864,
  "longitude": 36.8232
}
```

### Routing
```
GET /api/v1/services/routing/eta?from_lat=<>&from_lng=<>&to_lat=<>&to_lng=<>
```

### ANPR
```
GET /api/anpr/plates
POST /api/anpr/detect
GET /api/anpr/search/{plate_number}
```

## Response Formats

### Success Response
```json
{
  "data": { ... }
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

### List Response
```json
{
  "total": 100,
  "items": [ ... ]
}
```

## WebSocket

Connect to: `ws://localhost:8001/ws`

Subscribe to channels:
- `incidents` - Real-time incident updates
- `responders` - Responder location updates
- `alerts` - System alerts

## Rate Limiting

- 100 requests/minute for authenticated users
- 20 requests/minute for unauthenticated users

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
