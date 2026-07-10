from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime

from hph_vision_core.device_profiles.models import DeviceProfile
from hph_vision_core.fixtures.device_profiles import make_valid_device_profile
from hph_vision_core.reliability.models import ReliabilityLevel, ReliabilityResult
from hph_vision_core.sessions.models import (
    AcuityResult,
    ConsentRecord,
    EyeRefractionEstimate,
    ProtocolVersions,
    RefractionResult,
    SessionSubmission,
    TemplateMetadata,
    TriageResult,
)
from hph_vision_core.sessions.protocol import get_default_protocol_versions
from hph_vision_core.types import DomainWarning
from hph_vision_core.version import (
    REVIEW_CONSENT_TEXT_VERSION,
    SCREENING_CONSENT_TEXT_VERSION,
)

FIXED_CREATED_AT = datetime(2026, 5, 12, 0, 0, 0, tzinfo=UTC)


def make_screening_consent() -> ConsentRecord:
    return ConsentRecord(
        type="screening",
        accepted=True,
        accepted_at=FIXED_CREATED_AT,
        text_version=SCREENING_CONSENT_TEXT_VERSION,
    )


def make_review_consent() -> ConsentRecord:
    return ConsentRecord(
        type="clinician_review",
        accepted=True,
        accepted_at=FIXED_CREATED_AT,
        text_version=REVIEW_CONSENT_TEXT_VERSION,
    )


def make_template_metadata(
    device_profile: DeviceProfile | None = None,
) -> TemplateMetadata:
    device = device_profile or make_valid_device_profile()
    return TemplateMetadata(
        template_version="template-v0.1",
        generated_for_model=device.model_name,
        page_size="LETTER",
        phone_body_width_mm=device.body_width_mm,
        phone_body_height_mm=device.body_height_mm,
        phone_thickness_mm=device.thickness_mm,
        cardboard_thickness_mm=1.5,
        eye_to_screen_distance_mm=220,
    )


def make_valid_triage_result() -> TriageResult:
    return TriageResult(can_continue_self_test=True, recommendation="continue")


def make_red_flag_triage_result(urgent: bool = False) -> TriageResult:
    warning = DomainWarning(
        code="triage.eye_pain",
        message=(
            "A safety triage answer indicates professional evaluation is recommended."
        ),
        severity="critical" if urgent else "warning",
        source="triage",
    )
    return TriageResult(
        can_continue_self_test=False,
        red_flags=("eye_pain",),
        recommendation="urgentCare" if urgent else "seekProfessionalCare",
        warnings=(warning,),
    )


def make_acuity_result(completed: bool = True) -> AcuityResult:
    return AcuityResult(
        eye="right",
        completed=completed,
        confidence=0.86 if completed else 0.35,
        log_mar_estimate=0.1 if completed else None,
        snellen_equivalent="20/25" if completed else None,
    )


def make_refraction_result(confidence: float = 0.82) -> RefractionResult:
    return RefractionResult(
        confidence=confidence,
        recommendation="clinician_review_recommended",
        right_eye=EyeRefractionEstimate(
            sphere=-1.25,
            cylinder=-0.5,
            axis=90,
            spherical_equivalent=-1.5,
        ),
    )


def make_reliability_result(score: float = 0.84) -> ReliabilityResult:
    level: ReliabilityLevel
    if score >= 0.8:
        level = "high"
    elif score >= 0.6:
        level = "medium"
    elif score >= 0.35:
        level = "low"
    else:
        level = "invalid"
    warnings: tuple[DomainWarning, ...] = ()
    if score < 0.6:
        warnings = (
            DomainWarning(
                code="reliability.low",
                message="The session reliability is low.",
                severity="warning" if score >= 0.35 else "critical",
                source="reliability",
            ),
        )
    return ReliabilityResult(score=score, level=level, warnings=warnings)


def make_valid_session_submission() -> SessionSubmission:
    device = make_valid_device_profile()
    return SessionSubmission(
        client_session_id="mobile-session-fixture",
        created_at=FIXED_CREATED_AT,
        app_version="0.0.1",
        library_version="0.0.1",
        protocol_versions=get_default_protocol_versions(),
        device_profile=device,
        template_metadata=make_template_metadata(device),
        triage_result=make_valid_triage_result(),
        acuity_results=(make_acuity_result(),),
        refraction_result=make_refraction_result(),
        reliability=make_reliability_result(),
        warnings=(),
        consents=(make_screening_consent(), make_review_consent()),
    )


def make_red_flag_session_submission(urgent: bool = False) -> SessionSubmission:
    return replace(
        make_valid_session_submission(),
        triage_result=make_red_flag_triage_result(urgent=urgent),
    )


def make_low_reliability_session_submission() -> SessionSubmission:
    return replace(
        make_valid_session_submission(),
        reliability=make_reliability_result(0.42),
    )


def make_unsupported_protocol_session_submission() -> SessionSubmission:
    return replace(
        make_valid_session_submission(),
        protocol_versions=ProtocolVersions(
            acuity="acuity-v9.9",
            refraction="refraction-v0.1",
            template="template-v0.1",
            report="report-v0.1",
        ),
    )


def make_no_review_consent_session_submission() -> SessionSubmission:
    return replace(
        make_valid_session_submission(),
        consents=(make_screening_consent(),),
    )


def make_review_eligible_session_submission() -> SessionSubmission:
    return make_valid_session_submission()
