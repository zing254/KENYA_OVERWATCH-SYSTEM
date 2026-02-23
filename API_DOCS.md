# Kenya Overwatch API Documentation

## Base URL
```
http://localhost:8000/api
```

## Interactive Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "operator",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "operator",
    "email": "operator@kenya-overwatch.go.ke",
    "role": "operator"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

## Incidents

### List Incidents
```http
GET /api/incidents
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (active, resolved, pending)
- `severity` - Filter by severity (low, medium, high, critical)
- `page` - Page number
- `limit` - Items per page

### Get Incident
```http
GET /api/incidents/{incident_id}
Authorization: Bearer <token>
```

## Evidence

### List Evidence
```http
GET /api/evidence
Authorization: Bearer <token>
```

### Review Evidence
```http
POST /api/evidence/{evidence_id}/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "reviewer_id": "user_uuid",
  "decision": "approve|reject",
  "notes": "Review notes"
}
```

## System

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "up",
    "ai_pipeline": "up",
    "websocket": "up"
  },
  "timestamp": "2026-02-18T12:00:00Z"
}
```

### System Metrics
```http
GET /api/analytics/performance
Authorization: Bearer <token>
```

## WebSocket

### Connect
```javascript
ws://localhost:8000/ws/{username}
```

### Subscribe to Alerts
```json
{
  "type": "subscribe_alerts"
}
```

### Receive Alert
```json
{
  "type": "alert",
  "data": {
    "id": "alert_uuid",
    "title": "High Risk Detected",
    "severity": "critical",
    "timestamp": "2026-02-18T12:00:00Z"
  }
}
```

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

## Rate Limits

- Auth endpoints: 5 requests/minute
- API endpoints: 60 requests/minute
- WebSocket: 1 connection per user

## Cameras

### List Cameras
```http
GET /api/cameras
```
Query Parameters:
- `status` - Filter by status (active, inactive, maintenance)

### Get Camera
```http
GET /api/cameras/{camera_id}
```

### Create Camera
```http
POST /api/cameras
Content-Type: application/json

{
  "name": "Camera Name",
  "location": "Location",
  "latitude": -1.2864,
  "longitude": 36.8232,
  "status": "active"
}
```

### Update Camera
```http
PUT /api/cameras/{camera_id}
```

### Toggle Camera
```http
POST /api/cameras/{camera_id}/toggle
```

## Teams

### List Teams
```http
GET /api/teams
```

### Create Team
```http
POST /api/teams
```

### Dispatch Team
```http
POST /api/teams/{team_id}/dispatch
```

## Alerts

### List Alerts
```http
GET /api/alerts
```

### Acknowledge Alert
```http
POST /api/alerts/{alert_id}/acknowledge
```

### Bulk Acknowledge
```http
POST /api/alerts/bulk-acknowledge
```

## AI

### AI Status
```http
GET /api/ai/status
```

### Analyze Image
```http
POST /api/ai/analyze
```

### Pipeline Stats
```http
GET /api/ai/pipeline/stats
```

## ANPR

### ANPR Statistics
```http
GET /api/anpr/stats
```

### Detect Plate
```http
POST /api/anpr/detect
```

### Validate Plate
```http
GET /api/anpr/validate-plate?plate=KAA001A
```

## Dashboard

### Dashboard Stats
```http
GET /api/dashboard/stats
```

### Dashboard Summary
```http
GET /api/dashboard/summary
```

## Users

### List Users
```http
GET /api/users
```

### Get User
```http
GET /api/users/{user_id}
```

### Create User
```http
POST /api/users
```

## Configuration

### Get Config
```http
GET /api/config
```

### Update Config
```http
PATCH /api/config
```

## Cache

### Get Cache Stats
```http
GET /api/cache-stats
```

### Clear Cache
```http
POST /api/cache/clear
```
