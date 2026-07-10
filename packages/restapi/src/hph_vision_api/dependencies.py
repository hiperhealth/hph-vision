from __future__ import annotations

from fastapi import Request, status

from hph_vision_api.adapters.auth import Actor, anonymous_actor
from hph_vision_api.adapters.object_storage import FakeObjectStorageAdapter
from hph_vision_api.adapters.persistence import InMemoryRepository
from hph_vision_api.config import Settings
from hph_vision_api.errors import ApiError


def get_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_repository(request: Request) -> InMemoryRepository:
    repository: InMemoryRepository = request.app.state.repository
    return repository


def get_object_storage(request: Request) -> FakeObjectStorageAdapter:
    storage: FakeObjectStorageAdapter = request.app.state.object_storage
    return storage


def get_current_actor(request: Request) -> Actor:
    settings = get_settings(request)
    if not settings.auth_enabled:
        return anonymous_actor()
    raise ApiError(
        code="unauthorized",
        message="Authentication is required for this endpoint.",
        status_code=status.HTTP_401_UNAUTHORIZED,
    )
