from fastapi.testclient import TestClient
from helpers import unsupported_protocol_payload, valid_session_payload

from hph_vision_api.app import create_app
from hph_vision_api.config import Settings


def test_session_submission_happy_path() -> None:
    client = TestClient(create_app(Settings(environment="test")))

    response = client.post("/api/v1/sessions", json=valid_session_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["clientSessionId"] == "mobile-session-test"
    assert body["status"] == "accepted"
    assert body["canSubmitForClinicianReview"] is True

    get_response = client.get(f"/api/v1/sessions/{body['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == body["id"]


def test_unsupported_protocol_returns_structured_error() -> None:
    client = TestClient(create_app(Settings(environment="test")))

    response = client.post("/api/v1/sessions", json=unsupported_protocol_payload())

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "unsupported_protocol_version"
    assert body["error"]["requestId"]
