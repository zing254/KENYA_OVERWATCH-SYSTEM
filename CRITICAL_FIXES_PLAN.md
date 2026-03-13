# Kenya Overwatch - Critical Fixes Implementation Plan

## Current Status
- **Project Progress**: ~30% complete
- **Critical Issues**: 23 identified, 5 fixed so far
- **Major blockers**: Type mismatches, missing models, incomplete services

## Immediate Actions Required (Next 24 Hours)

### 1. Fix Type Errors in API (BLOCKING)
**File**: `backend/road_safety_api.py` lines 179-219
**Problem**: String parameters passed to functions expecting enums

**Solution**:
```python
from backend.enums import IncidentStatus, SeverityLevel

@app.get("/api/incidents")
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100
):
    # Convert strings to enums
    status_enum = IncidentStatus(status) if status else None
    severity_enum = SeverityLevel(severity) if severity else None
    
    from services.incident_service import incident_service
    incidents = incident_service.get_incidents(status=status_enum, severity=severity_enum, limit=limit)
    # ...
```

### 2. Align Database Models with Shared Enums
**File**: `backend/database_models.py`
**Action**:
- Remove duplicate enum definitions (lines 15-78)
- Import from `backend.enums`
- Update all Column(Enum(...)) references

### 3. Update Incident Service to Use Shared Enums
**File**: `backend/services/incident_service.py`
**Action**:
- Remove local enum definitions (lines 16-43)
- Import from `backend.enums`
- Update all type hints

### 4. Fix Missing Service Imports
**Files**: `backend/services/__init__.py`, subdirectories
**Action**: Create proper imports or simplify to empty __init__.py

### 5. Complete AI Model Loading
**Create**: `backend/ai/model_manager.py`
**Implement**: Lazy loading with caching, fallback when models missing

### 6. Implement Centralized Error Handling
**Create**: `backend/middleware/error_handler.py`
**Add**: Global exception handler with structured logging

### 7. Add Prometheus Metrics
**Create**: `backend/metrics.py`
**Integrate**: Into FastAPI app at `/metrics` endpoint

### 8. Complete Evidence Storage Service
**Create**: `backend/services/storage_service.py`
**Implement**: MinIO/S3 integration with pre-signed URLs

### 9. Fix Test Suite
**Files**: `backend/tests/`
**Action**: Rewrite tests to work with current architecture or mock missing components

### 10. Update Dockerfile
**File**: `backend/Dockerfile`
**Fix**: Multi-stage build, proper user, copy models, health check

## Implementation Steps

I'll now implement these fixes in order of criticality. Let me start with the shared enums integration and type error fixes.