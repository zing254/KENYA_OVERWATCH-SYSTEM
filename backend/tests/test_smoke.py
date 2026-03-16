from fastapi.testclient import TestClient


def _get_client():
    try:
        from backend.road_safety_api import app
    except Exception:  # pragma: no cover
        # Fallback import path if module layout changes during iteration
        from road_safety_api import app  # type: ignore
    return TestClient(app)


def test_health_endpoint():
    client = _get_client()
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)


def test_root_endpoint():
    client = _get_client()
    resp = client.get("/")
    # Root should respond with a 200 or 404 depending on routing; we expect 200 here
    assert resp.status_code in (200, 307, 302)
