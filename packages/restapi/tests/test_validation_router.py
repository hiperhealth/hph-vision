from fastapi.testclient import TestClient
from helpers import unsupported_protocol_payload, valid_session_payload

from hph_vision_api.app import create_app
from hph_vision_api.config import Settings


def test_validation_session_check_returns_evaluation_without_storing() -> None:
    client = TestClient(create_app(Settings(environment="test")))

    response = client.post(
        "/api/v1/validation/sessions/check",
        json=valid_session_payload(),
    )

    assert response.status_code == 200
    assert response.json()["validation"]["ok"] is True
    assert response.json()["canStore"] is True


def test_validation_session_check_reports_protocol_errors() -> None:
    client = TestClient(create_app(Settings(environment="test")))

    response = client.post(
        "/api/v1/validation/sessions/check",
        json=unsupported_protocol_payload(),
    )

    assert response.status_code == 200
    assert response.json()["validation"]["ok"] is False
