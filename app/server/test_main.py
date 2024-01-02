import time
from fastapi.testclient import TestClient
from main import app

testclient = TestClient(app)


def test_get_signals():
    response = testclient.get("/api/signals/AAPL")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    body = response.json()
    assert "date" in body[0]
    assert "open" in body[0]
    assert "stop" in body[0]


def test_get_symbols():
    response = testclient.get("/api/symbols/AAPL.json")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_register_for_acces_token_and_refresh_token():
    with TestClient(app) as testclient_with_events:
        timestamp = str(time.time())
        response = testclient_with_events.post(
            "/api/register",
            data={
                "email": "test@gmail.com-xyzxxx" + timestamp,
                "username": "test-username-xyzxxx" + timestamp,
                "password": "supersecret",
                "full_name": "Test User",
            },
        )

        assert response.status_code == 201
        body = response.json()
        assert "access_token" in body
