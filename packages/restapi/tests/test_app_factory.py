from hph_vision_api.app import create_app
from hph_vision_api.config import Settings


def test_create_app_registers_versioned_routes() -> None:
    app = create_app(Settings(environment="test"))
    paths = set(app.openapi()["paths"])

    assert "/health" in paths
    assert "/ready" in paths
    assert "/api/v1/version" in paths
    assert "/api/v1/sessions" in paths
