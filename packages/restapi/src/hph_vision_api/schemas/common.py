from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ApiModel(BaseModel):
    class Config:
        allow_population_by_field_name = True
        populate_by_name = True


class ErrorDetail(ApiModel):
    field: str | None = None
    message: str
    code: str | None = None


class ErrorEnvelope(ApiModel):
    code: str
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)
    request_id: str = Field(alias="requestId")


class ErrorResponse(ApiModel):
    error: ErrorEnvelope


class DomainWarningSchema(ApiModel):
    code: str
    message: str
    severity: Literal["info", "warning", "critical"] = "warning"
    source: str | None = None


class ValidationIssueSchema(ApiModel):
    code: str
    message: str
    field: str | None = None
    severity: Literal["error", "warning"] = "error"


class ValidationResultSchema(ApiModel):
    ok: bool
    errors: list[ValidationIssueSchema] = Field(default_factory=list)
    warnings: list[ValidationIssueSchema] = Field(default_factory=list)


class MessageResponse(ApiModel):
    message: str


def model_to_json_dict(model: BaseModel) -> dict[str, Any]:
    dump = getattr(model, "model_dump", None)
    if callable(dump):
        result: dict[str, Any] = dump(by_alias=True)
        return result
    result_dict: dict[str, Any] = model.dict(by_alias=True)
    return result_dict


def datetime_to_iso(value: datetime) -> str:
    return value.isoformat()
