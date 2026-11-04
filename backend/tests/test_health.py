from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_modules_registered_and_independent():
    ids = [m["id"] for m in client.get("/api/modules").json()]
    assert ids == ["cd1", "cd2", "cd3"]
    for mid in ids:
        assert client.get(f"/api/{mid}/status").json()["module"] == mid
        assert client.post(f"/api/{mid}/reset").json()["reset"] is True
