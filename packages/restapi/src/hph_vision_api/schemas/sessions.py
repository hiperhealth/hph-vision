from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from pydantic import Field

from hph_vision_api.schemas.common import (
    ApiModel,
    DomainWarningSchema,
    ValidationIssueSchema,
    ValidationResultSchema,
)
from hph_vision_core import (
    AcuityResult,
    ConsentRecord,
    DeviceProfile,
    DomainWarning,
    EyeRefractionEstimate,
    ProtocolVersions,
    RefractionResult,
    ReliabilityResult,
    SessionEvaluation,
    SessionSubmission,
    TemplateMetadata,
    TriageResult,
)
from hph_vision_core.sessions.models import EnvironmentContext, PatientContext


def _now_utc() -> datetime:
    return datetime.now(UTC)


class ProtocolVersionsSchema(ApiModel):
    acuity: str | None = None
    refraction: str | None = None
    template: str | None = None
    report: str | None = None

    def to_core(self) -> ProtocolVersions:
        return ProtocolVersions(
            acuity=self.acuity,
            refraction=self.refraction,
            template=self.template,
            report=self.report,
        )


class ConsentRecordSchema(ApiModel):
    type: str
    accepted: bool
    accepted_at: datetime | None = Field(default=None, alias="acceptedAt")
    text_version: str = Field(alias="textVersion")

    def to_core(self) -> ConsentRecord:
        return ConsentRecord(
            type=self.type,
            accepted=self.accepted,
            accepted_at=self.accepted_at,
            text_version=self.text_version,
        )


class DeviceProfileSchema(ApiModel):
    id: str
    manufacturer: str
    model_name: str = Field(alias="modelName")
    body_width_mm: float = Field(alias="bodyWidthMm")
    body_height_mm: float = Field(alias="bodyHeightMm")
    thickness_mm: float = Field(alias="thicknessMm")
    screen_width_px: int | None = Field(default=None, alias="screenWidthPx")
    screen_height_px: int | None = Field(default=None, alias="screenHeightPx")
    pixel_density: float | None = Field(default=None, alias="pixelDensity")
    screen_width_mm: float | None = Field(default=None, alias="screenWidthMm")
    screen_height_mm: float | None = Field(default=None, alias="screenHeightMm")
    template_family: str | None = Field(default=None, alias="templateFamily")

    def to_core(self) -> DeviceProfile:
        return DeviceProfile(
            id=self.id,
            manufacturer=self.manufacturer,
            model_name=self.model_name,
            body_width_mm=self.body_width_mm,
            body_height_mm=self.body_height_mm,
            thickness_mm=self.thickness_mm,
            screen_width_px=self.screen_width_px,
            screen_height_px=self.screen_height_px,
            pixel_density=self.pixel_density,
            screen_width_mm=self.screen_width_mm,
            screen_height_mm=self.screen_height_mm,
            template_family=self.template_family,
        )

    @classmethod
    def from_core(cls, profile: DeviceProfile) -> DeviceProfileSchema:
        return cls(
            id=profile.id,
            manufacturer=profile.manufacturer,
            modelName=profile.model_name,
            bodyWidthMm=profile.body_width_mm,
            bodyHeightMm=profile.body_height_mm,
            thicknessMm=profile.thickness_mm,
            screenWidthPx=profile.screen_width_px,
            screenHeightPx=profile.screen_height_px,
            pixelDensity=profile.pixel_density,
            screenWidthMm=profile.screen_width_mm,
            screenHeightMm=profile.screen_height_mm,
            templateFamily=profile.template_family,
        )


class TemplateMetadataSchema(ApiModel):
    template_version: str = Field(alias="templateVersion")
    generated_for_model: str = Field(alias="generatedForModel")
    page_size: str = Field(alias="pageSize")
    phone_body_width_mm: float = Field(alias="phoneBodyWidthMm")
    phone_body_height_mm: float = Field(alias="phoneBodyHeightMm")
    phone_thickness_mm: float = Field(alias="phoneThicknessMm")
    cardboard_thickness_mm: float = Field(alias="cardboardThicknessMm")
    eye_to_screen_distance_mm: float = Field(alias="eyeToScreenDistanceMm")

    def to_core(self) -> TemplateMetadata:
        return TemplateMetadata(
            template_version=self.template_version,
            generated_for_model=self.generated_for_model,
            page_size=self.page_size,
            phone_body_width_mm=self.phone_body_width_mm,
            phone_body_height_mm=self.phone_body_height_mm,
            phone_thickness_mm=self.phone_thickness_mm,
            cardboard_thickness_mm=self.cardboard_thickness_mm,
            eye_to_screen_distance_mm=self.eye_to_screen_distance_mm,
        )


class TriageResultSchema(ApiModel):
    can_continue_self_test: bool = Field(alias="canContinueSelfTest")
    red_flags: list[str] = Field(default_factory=list, alias="redFlags")
    recommendation: Literal[
        "continue",
        "seekProfessionalCare",
        "urgentCare",
    ] = "continue"
    warnings: list[DomainWarningSchema] = Field(default_factory=list)
    unanswered_question_ids: list[str] = Field(
        default_factory=list,
        alias="unansweredQuestionIds",
    )

    def to_core(self) -> TriageResult:
        return TriageResult(
            can_continue_self_test=self.can_continue_self_test,
            red_flags=tuple(self.red_flags),
            recommendation=self.recommendation,
            warnings=tuple(warning_schema_to_core(item) for item in self.warnings),
            unanswered_question_ids=tuple(self.unanswered_question_ids),
        )


class AcuityResultSchema(ApiModel):
    eye: Literal["left", "right", "binocular"]
    completed: bool
    confidence: float
    log_mar_estimate: float | None = Field(default=None, alias="logMarEstimate")
    snellen_equivalent: str | None = Field(default=None, alias="snellenEquivalent")
    reliability_warnings: list[str] = Field(
        default_factory=list,
        alias="reliabilityWarnings",
    )

    def to_core(self) -> AcuityResult:
        return AcuityResult(
            eye=self.eye,
            completed=self.completed,
            confidence=self.confidence,
            log_mar_estimate=self.log_mar_estimate,
            snellen_equivalent=self.snellen_equivalent,
            reliability_warnings=tuple(self.reliability_warnings),
        )


class EyeRefractionEstimateSchema(ApiModel):
    sphere: float | None = None
    cylinder: float | None = None
    axis: int | None = None
    spherical_equivalent: float | None = Field(
        default=None,
        alias="sphericalEquivalent",
    )

    def to_core(self) -> EyeRefractionEstimate:
        return EyeRefractionEstimate(
            sphere=self.sphere,
            cylinder=self.cylinder,
            axis=self.axis,
            spherical_equivalent=self.spherical_equivalent,
        )


class RefractionResultSchema(ApiModel):
    confidence: float
    recommendation: Literal[
        "continue_self_monitoring",
        "repeat_test",
        "clinician_review_recommended",
        "professional_exam_recommended",
        "urgent_care_recommended",
        "invalid_result",
    ]
    right_eye: EyeRefractionEstimateSchema | None = Field(
        default=None,
        alias="rightEye",
    )
    left_eye: EyeRefractionEstimateSchema | None = Field(default=None, alias="leftEye")
    binocular: EyeRefractionEstimateSchema | None = None
    reliability_warnings: list[str] = Field(
        default_factory=list,
        alias="reliabilityWarnings",
    )

    def to_core(self) -> RefractionResult:
        return RefractionResult(
            confidence=self.confidence,
            recommendation=self.recommendation,
            right_eye=self.right_eye.to_core() if self.right_eye else None,
            left_eye=self.left_eye.to_core() if self.left_eye else None,
            binocular=self.binocular.to_core() if self.binocular else None,
            reliability_warnings=tuple(self.reliability_warnings),
        )


class ReliabilityResultSchema(ApiModel):
    score: float
    level: Literal["high", "medium", "low", "invalid"]
    warnings: list[DomainWarningSchema] = Field(default_factory=list)

    def to_core(self) -> ReliabilityResult:
        return ReliabilityResult(
            score=self.score,
            level=self.level,
            warnings=tuple(warning_schema_to_core(item) for item in self.warnings),
        )


class PatientContextSchema(ApiModel):
    age_range: str | None = Field(default=None, alias="ageRange")
    current_glasses: bool | None = Field(default=None, alias="currentGlasses")
    previous_prescription: bool | None = Field(
        default=None,
        alias="previousPrescription",
    )

    def to_core(self) -> PatientContext:
        return PatientContext(
            age_range=self.age_range,
            current_glasses=self.current_glasses,
            previous_prescription=self.previous_prescription,
        )


class EnvironmentContextSchema(ApiModel):
    ambient_light_lux: float | None = Field(default=None, alias="ambientLightLux")
    screen_brightness: float | None = Field(default=None, alias="screenBrightness")
    distance_confidence: float | None = Field(default=None, alias="distanceConfidence")
    tilt_confidence: float | None = Field(default=None, alias="tiltConfidence")

    def to_core(self) -> EnvironmentContext:
        return EnvironmentContext(
            ambient_light_lux=self.ambient_light_lux,
            screen_brightness=self.screen_brightness,
            distance_confidence=self.distance_confidence,
            tilt_confidence=self.tilt_confidence,
        )


class SessionSubmissionRequest(ApiModel):
    client_session_id: str = Field(alias="clientSessionId")
    created_at: datetime | None = Field(default=None, alias="createdAt")
    app_version: str | None = Field(default=None, alias="appVersion")
    library_version: str | None = Field(default=None, alias="libraryVersion")
    protocol_versions: ProtocolVersionsSchema = Field(alias="protocolVersions")
    device_profile: DeviceProfileSchema | None = Field(
        default=None,
        alias="deviceProfile",
    )
    template_metadata: TemplateMetadataSchema | None = Field(
        default=None,
        alias="templateMetadata",
    )
    triage_result: TriageResultSchema | None = Field(default=None, alias="triageResult")
    acuity_results: list[AcuityResultSchema] = Field(
        default_factory=list,
        alias="acuityResults",
    )
    refraction_result: RefractionResultSchema | None = Field(
        default=None,
        alias="refractionResult",
    )
    reliability: ReliabilityResultSchema | None = None
    warnings: list[DomainWarningSchema] = Field(default_factory=list)
    consents: list[ConsentRecordSchema] = Field(default_factory=list)
    patient_context: PatientContextSchema | None = Field(
        default=None,
        alias="patientContext",
    )
    environment: EnvironmentContextSchema | None = None

    def to_core(self) -> SessionSubmission:
        return SessionSubmission(
            client_session_id=self.client_session_id,
            created_at=self.created_at or _now_utc(),
            app_version=self.app_version,
            library_version=self.library_version,
            protocol_versions=self.protocol_versions.to_core(),
            device_profile=(
                self.device_profile.to_core() if self.device_profile else None
            ),
            template_metadata=(
                self.template_metadata.to_core() if self.template_metadata else None
            ),
            triage_result=self.triage_result.to_core() if self.triage_result else None,
            acuity_results=tuple(item.to_core() for item in self.acuity_results),
            refraction_result=(
                self.refraction_result.to_core() if self.refraction_result else None
            ),
            reliability=self.reliability.to_core() if self.reliability else None,
            warnings=tuple(warning_schema_to_core(item) for item in self.warnings),
            consents=tuple(item.to_core() for item in self.consents),
            patient_context=(
                self.patient_context.to_core() if self.patient_context else None
            ),
            environment=self.environment.to_core() if self.environment else None,
        )


class SessionAcceptedResponse(ApiModel):
    id: str
    client_session_id: str = Field(alias="clientSessionId")
    status: str = "accepted"
    created_at: datetime = Field(alias="createdAt")
    recommendation: Literal[
        "continue_self_monitoring",
        "repeat_test",
        "clinician_review_recommended",
        "professional_exam_recommended",
        "urgent_care_recommended",
        "invalid_result",
    ]
    can_submit_for_clinician_review: bool = Field(alias="canSubmitForClinicianReview")
    validation: ValidationResultSchema
    warnings: list[DomainWarningSchema] = Field(default_factory=list)


class SessionRecordResponse(SessionAcceptedResponse):
    app_version: str | None = Field(default=None, alias="appVersion")
    library_version: str | None = Field(default=None, alias="libraryVersion")


class SessionPatchRequest(ApiModel):
    status: str | None = None


def warning_schema_to_core(schema: DomainWarningSchema) -> DomainWarning:
    return DomainWarning(
        code=schema.code,
        message=schema.message,
        severity=schema.severity,
        source=schema.source,
    )


def warning_core_to_schema(warning: DomainWarning) -> DomainWarningSchema:
    return DomainWarningSchema(
        code=warning.code,
        message=warning.message,
        severity=warning.severity,
        source=warning.source,
    )


def validation_to_schema(evaluation: SessionEvaluation) -> ValidationResultSchema:
    return ValidationResultSchema(
        ok=evaluation.validation.ok,
        errors=[
            ValidationIssueSchema(
                code=item.code,
                message=item.message,
                field=item.field,
                severity=item.severity,
            )
            for item in evaluation.validation.errors
        ],
        warnings=[
            ValidationIssueSchema(
                code=item.code,
                message=item.message,
                field=item.field,
                severity=item.severity,
            )
            for item in evaluation.validation.warnings
        ],
    )
