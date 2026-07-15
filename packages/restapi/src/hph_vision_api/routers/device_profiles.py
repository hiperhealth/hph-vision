from __future__ import annotations

from fastapi import APIRouter, Depends

from hph_vision_api.adapters.auth import Actor
from hph_vision_api.dependencies import get_current_actor
from hph_vision_api.errors import ApiError
from hph_vision_api.schemas.device_profiles import (
    DeviceProfileListResponse,
    DeviceProfileSearchResponse,
)
from hph_vision_api.schemas.sessions import DeviceProfileSchema
from hph_vision_core.device_profiles import normalize_device_model_name
from hph_vision_core.fixtures import make_valid_device_profile

router = APIRouter(prefix="/api/v1/device-profiles", tags=["device-profiles"])


def _profiles() -> list[DeviceProfileSchema]:
    return [DeviceProfileSchema.from_core(make_valid_device_profile())]


@router.get("", response_model=DeviceProfileListResponse)
def list_device_profiles(
    _actor: Actor = Depends(get_current_actor),
) -> DeviceProfileListResponse:
    return DeviceProfileListResponse(profiles=_profiles())


@router.get("/search", response_model=DeviceProfileSearchResponse)
def search_device_profiles(
    manufacturer: str | None = None,
    model: str | None = None,
    _actor: Actor = Depends(get_current_actor),
) -> DeviceProfileSearchResponse:
    query = " ".join(item for item in [manufacturer, model] if item)
    normalized_query = normalize_device_model_name(query)
    matches = [
        profile
        for profile in _profiles()
        if normalized_query
        in normalize_device_model_name(
            f"{profile.manufacturer} {profile.model_name}",
        )
    ]
    if not normalized_query:
        matches = _profiles()
    return DeviceProfileSearchResponse(profiles=matches, query=query)


@router.get("/{profile_id}", response_model=DeviceProfileSchema)
def get_device_profile(
    profile_id: str,
    _actor: Actor = Depends(get_current_actor),
) -> DeviceProfileSchema:
    for profile in _profiles():
        if profile.id == profile_id:
            return profile
    raise ApiError(
        code="not_found",
        message="Device profile was not found.",
        status_code=404,
    )
