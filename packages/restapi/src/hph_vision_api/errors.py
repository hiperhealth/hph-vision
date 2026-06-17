from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from hph_vision_api.schemas.common import ErrorDetail, ErrorEnvelope, ErrorResponse
from hph_vision_core.validation import ValidationError, ValidationResult


class ApiError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        *,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []


def request_id_from_request(request: Request) -> str:
    return str(getattr(request.state, "request_id", "unknown"))


def error_response_body(
    *,
    code: str,
    message: str,
    request_id: str,
    details: list[ErrorDetail] | None = None,
) -> dict[str, Any]:
    response = ErrorResponse(
        error=ErrorEnvelope(
            code=code,
            message=message,
            requestId=request_id,
            details=details or [],
        )
    )
    return response.dict(by_alias=True)


def validation_errors_to_details(
    validation_errors: tuple[ValidationError, ...],
) -> list[ErrorDetail]:
    return [
        ErrorDetail(
            field=error.field,
            message=error.message,
            code=error.code,
        )
        for error in validation_errors
    ]


def api_error_from_validation(
    validation: ValidationResult,
    *,
    message: str = "Request validation failed.",
) -> ApiError:
    code = "validation_error"
    if any(error.code == "unsupported_protocol_version" for error in validation.errors):
        code = "unsupported_protocol_version"
    return ApiError(
        code=code,
        message=message,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details=validation_errors_to_details(validation.errors),
    )


def configure_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response_body(
                code=exc.code,
                message=exc.message,
                request_id=request_id_from_request(request),
                details=exc.details,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        details = [
            ErrorDetail(
                field=".".join(str(part) for part in error.get("loc", ())),
                message=str(error.get("msg", "Invalid value.")),
                code=str(error.get("type", "request_validation_error")),
            )
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response_body(
                code="validation_error",
                message="Request validation failed.",
                request_id=request_id_from_request(request),
                details=details,
            ),
        )

    @app.exception_handler(Exception)
    async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
        _ = exc
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response_body(
                code="internal_error",
                message="An unexpected error occurred.",
                request_id=request_id_from_request(request),
            ),
        )
