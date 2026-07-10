from __future__ import annotations

from dataclasses import dataclass, fields, is_dataclass
from datetime import UTC, datetime
from typing import Any, Literal, TypeAlias, cast

WarningSeverity: TypeAlias = Literal["info", "warning", "critical"]
ResultRecommendation: TypeAlias = Literal[
    "continue_self_monitoring",
    "repeat_test",
    "clinician_review_recommended",
    "professional_exam_recommended",
    "urgent_care_recommended",
    "invalid_result",
]
Eye: TypeAlias = Literal["left", "right", "binocular"]


@dataclass(frozen=True)
class DomainWarning:
    code: str
    message: str
    severity: WarningSeverity = "warning"
    source: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return dataclass_to_dict(self)


def serialize_value(value: Any) -> Any:
    if isinstance(value, datetime):
        normalized = value
        if normalized.tzinfo is None:
            normalized = normalized.replace(tzinfo=UTC)
        return normalized.isoformat()

    if is_dataclass(value) and not isinstance(value, type):
        return {
            field.name: serialize_value(getattr(value, field.name))
            for field in fields(value)
        }

    if isinstance(value, tuple | list):
        return [serialize_value(item) for item in value]

    if isinstance(value, dict):
        return {str(key): serialize_value(item) for key, item in value.items()}

    return value


def dataclass_to_dict(instance: object) -> dict[str, Any]:
    if not is_dataclass(instance) or isinstance(instance, type):
        msg = f"Expected dataclass instance, got {type(instance)!r}."
        raise TypeError(msg)
    return cast(dict[str, Any], serialize_value(instance))
