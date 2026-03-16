from fastapi.testclient import TestClient


def _get_client(role: str | None = None) -> TestClient:
    try:
        from backend.road_safety_api import app
    except Exception:
        from road_safety_api import app
    client = TestClient(app)
    if role:
        client.headers.update({"X-Role": role})
    return client


def test_rbac_allows_admin():
    client = _get_client("admin")
    payload = {
        "title": "RBAC smoke",
        "description": "Testing admin create incident",
        "incident_type": "test",
        "severity": "low",
        "location": "RBAC Test Location",
    }
    resp = client.post("/api/incidents", data=payload)
    assert resp.status_code in (200, 201)


def test_rbac_denies_guest():
    client = _get_client("guest")
    payload = {
        "title": "RBAC smoke",
        "description": "Testing guest create incident",
        "incident_type": "test",
        "severity": "low",
        "location": "RBAC Test Location",
    }
    resp = client.post("/api/incidents", data=payload)
    assert resp.status_code == 403
