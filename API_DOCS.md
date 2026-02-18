# Kenya Overwatch API Documentation

## Base URL
```
http://localhost:8000/api
```

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
