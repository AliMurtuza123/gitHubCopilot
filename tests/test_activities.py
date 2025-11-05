from fastapi.testclient import TestClient
from src.app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Basic sanity checks
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_duplicate_and_unregister_flow():
    activity1 = "Chess Club"
    activity2 = "Programming Class"
    email = "teststudent@example.com"

    # Ensure email is not present initially (if present from fixture, remove)
    # Try to unregister first (ignore 404)
    client.delete(f"/activities/{activity1}/participants?email={email}")
    client.delete(f"/activities/{activity2}/participants?email={email}")

    # Sign up for activity1
    resp = client.post(f"/activities/{activity1}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Attempt to sign up for activity2 with same email -> should fail (global check)
    resp2 = client.post(f"/activities/{activity2}/signup?email={email}")
    assert resp2.status_code == 400

    # Unregister from activity1
    resp3 = client.delete(f"/activities/{activity1}/participants?email={email}")
    assert resp3.status_code == 200
    assert "Unregistered" in resp3.json().get("message", "")

    # Now sign up for activity2 should succeed
    resp4 = client.post(f"/activities/{activity2}/signup?email={email}")
    assert resp4.status_code == 200
    assert "Signed up" in resp4.json().get("message", "")

    # Cleanup: unregister from activity2
    client.delete(f"/activities/{activity2}/participants?email={email}")
