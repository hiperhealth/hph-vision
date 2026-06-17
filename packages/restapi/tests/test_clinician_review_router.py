from fastapi.testclient import TestClient
from helpers import valid_session_payload

from hph_vision_api.app import create_app
from hph_vision_api.config import Settings


def test_clinician_review_submission_status_and_cancel() -> None:
    client = TestClient(create_app(Settings(environment="test")))
    session_response = client.post("/api/v1/sessions", json=valid_session_payload())
    session_id = session_response.json()["id"]

    response = client.post(
        "/api/v1/clinician-review/submissions",
        json={"sessionId": session_id},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["sessionId"] == session_id
    assert body["status"] == "queued"

    status_response = client.get(
        f"/api/v1/clinician-review/submissions/{body['id']}/status"
    )
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "queued"

    cancel_response = client.post(
        f"/api/v1/clinician-review/submissions/{body['id']}/cancel"
    )
    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "cancelled"
