from fastapi.testclient import TestClient
from helpers import valid_session_payload

from hph_vision_api.app import create_app
from hph_vision_api.config import Settings


def test_report_metadata_flow() -> None:
    client = TestClient(create_app(Settings(environment="test")))
    session_response = client.post("/api/v1/sessions", json=valid_session_payload())
    session_id = session_response.json()["id"]

    response = client.post("/api/v1/reports", json={"sessionId": session_id})

    assert response.status_code == 201
    body = response.json()
    assert body["sessionId"] == session_id
    assert body["clientSessionId"] == "mobile-session-test"
    assert body["disclaimer"].startswith("This result is a screening")

    url_response = client.post(f"/api/v1/reports/{body['id']}/upload-url")
    assert url_response.status_code == 200
    assert url_response.json()["method"] == "PUT"
