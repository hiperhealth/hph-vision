from __future__ import annotations

from fastapi import APIRouter, Depends

from hph_vision_api.config import Settings
from hph_vision_api.dependencies import get_settings
from hph_vision_api.schemas.health import (
    HealthResponse,
    ReadinessResponse,
    VersionResponse,
)
from hph_vision_api.version import API_VERSION, SERVICE_NAME
from hph_vision_core import (
    get_core_version,
    get_health_status,
    get_supported_protocol_versions,
)

router = APIRouter(tags=["health"])
versioned_router = APIRouter(prefix="/api/v1", tags=["version"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> dict[str, str]:
    return get_health_status().to_dict()


@router.get("/ready", response_model=ReadinessResponse)
def readiness_check(settings: Settings = Depends(get_settings)) -> ReadinessResponse:
    dependencies = {
        "database": "disabled" if settings.database_url is None else "configured",
        "object_storage": (
            "disabled" if settings.object_storage_bucket is None else "configured"
        ),
        "auth": "enabled" if settings.auth_enabled else "disabled",
    }
    return ReadinessResponse(
        service=SERVICE_NAME,
        status="ok",
        dependencies=dependencies,
    )


@versioned_router.get("/version", response_model=VersionResponse)
def version_info(settings: Settings = Depends(get_settings)) -> VersionResponse:
    return VersionResponse(
        service=SERVICE_NAME,
        api_version=settings.api_version or API_VERSION,
        core_version=get_core_version(),
        supported_protocol_versions=get_supported_protocol_versions().to_dict(),
    )
