from __future__ import annotations

from hph_vision_core.device_profiles.validation import validate_device_profile
from hph_vision_core.reliability.scoring import validate_reliability
from hph_vision_core.sessions.models import (
    AcuityResult,
    ConsentRecord,
    RefractionResult,
    SessionSubmission,
    TemplateMetadata,
)
from hph_vision_core.validation.numeric import validate_number_range
from hph_vision_core.validation.protocols import validate_protocol_versions
from hph_vision_core.validation.result import (
    ValidationResult,
    combine_validation_results,
    validation_error,
    validation_warning,
)

SCREENING_CONSENT_TYPES = {"screening", "screening_disclaimer", "terms"}
REVIEW_CONSENT_TYPES = {"clinician_review", "review_upload", "data_upload"}


def has_accepted_consent(
    consents: tuple[ConsentRecord, ...],
    accepted_types: set[str],
) -> bool:
    return any(
        consent.accepted and consent.type.strip().lower() in accepted_types
        for consent in consents
    )


def validate_consent_records(consents: tuple[ConsentRecord, ...]) -> ValidationResult:
    errors = []
    warnings = []
    if not consents:
        errors.append(
            validation_error(
                "missing_consent",
                "At least one consent record is required.",
                "consents",
            )
        )

    if not has_accepted_consent(consents, SCREENING_CONSENT_TYPES):
        errors.append(
            validation_error(
                "screening_consent_required",
                "Accepted screening consent is required before storing a session.",
                "consents",
            )
        )

    for index, consent in enumerate(consents):
        field_prefix = f"consents.{index}"
        if not consent.type.strip():
            errors.append(
                validation_error(
                    "missing_consent_type",
                    "Consent type is required.",
                    f"{field_prefix}.type",
                )
            )
        if not consent.text_version.strip():
            errors.append(
                validation_error(
                    "missing_consent_text_version",
                    "Consent text version is required.",
                    f"{field_prefix}.text_version",
                )
            )
        if consent.accepted and consent.accepted_at is None:
            errors.append(
                validation_error(
                    "missing_consent_accepted_at",
                    "Accepted consent records require an accepted_at timestamp.",
                    f"{field_prefix}.accepted_at",
                )
            )
        if not consent.accepted:
            warnings.append(
                validation_warning(
                    "consent_not_accepted",
                    "A submitted consent record was not accepted.",
                    f"{field_prefix}.accepted",
                )
            )

    return ValidationResult(errors=tuple(errors), warnings=tuple(warnings))


def validate_template_metadata(metadata: TemplateMetadata) -> ValidationResult:
    return combine_validation_results(
        validate_number_range(
            metadata.phone_body_width_mm,
            "template.phone_body_width_mm",
            40,
            120,
        ),
        validate_number_range(
            metadata.phone_body_height_mm,
            "template.phone_body_height_mm",
            80,
            230,
        ),
        validate_number_range(
            metadata.phone_thickness_mm,
            "template.phone_thickness_mm",
            3,
            25,
        ),
        validate_number_range(
            metadata.cardboard_thickness_mm,
            "template.cardboard_thickness_mm",
            0.5,
            8,
        ),
        validate_number_range(
            metadata.eye_to_screen_distance_mm,
            "template.eye_to_screen_distance_mm",
            80,
            600,
        ),
    )


def validate_acuity_result(result: AcuityResult, index: int) -> ValidationResult:
    validation = validate_number_range(
        result.confidence,
        f"acuity_results.{index}.confidence",
        0,
        1,
    )
    warnings = list(validation.warnings)
    if not result.completed:
        warnings.append(
            validation_warning(
                "acuity_incomplete",
                "A submitted acuity result is incomplete.",
                f"acuity_results.{index}.completed",
            )
        )
    if result.log_mar_estimate is not None:
        range_validation = validate_number_range(
            result.log_mar_estimate,
            f"acuity_results.{index}.log_mar_estimate",
            -0.3,
            2.0,
        )
        validation = combine_validation_results(validation, range_validation)
        warnings.extend(range_validation.warnings)
    return ValidationResult(errors=validation.errors, warnings=tuple(warnings))


def validate_refraction_result(result: RefractionResult) -> ValidationResult:
    validation = validate_number_range(
        result.confidence,
        "refraction_result.confidence",
        0,
        1,
    )
    warnings = list(validation.warnings)
    if (
        result.right_eye is None
        and result.left_eye is None
        and result.binocular is None
    ):
        warnings.append(
            validation_warning(
                "refraction_missing_estimate",
                "Refraction result does not include an eye estimate.",
                "refraction_result",
            )
        )
    return ValidationResult(errors=validation.errors, warnings=tuple(warnings))


def validate_session_submission(submission: SessionSubmission) -> ValidationResult:
    results: list[ValidationResult] = [
        validate_protocol_versions(submission.protocol_versions),
        validate_consent_records(submission.consents),
    ]

    errors = []
    warnings = []

    if not submission.client_session_id.strip():
        errors.append(
            validation_error(
                "missing_client_session_id",
                "Client session id is required.",
                "client_session_id",
            )
        )
    if not submission.app_version:
        warnings.append(
            validation_warning(
                "missing_app_version",
                "App version was not submitted.",
                "app_version",
            )
        )
    if not submission.library_version:
        warnings.append(
            validation_warning(
                "missing_library_version",
                "Mobile library version was not submitted.",
                "library_version",
            )
        )

    if submission.device_profile is not None:
        results.append(validate_device_profile(submission.device_profile))
    else:
        warnings.append(
            validation_warning(
                "missing_device_profile",
                "No device profile was submitted.",
                "device_profile",
            )
        )

    if submission.template_metadata is not None:
        results.append(validate_template_metadata(submission.template_metadata))
    else:
        warnings.append(
            validation_warning(
                "missing_template_metadata",
                "No template metadata was submitted.",
                "template_metadata",
            )
        )

    if submission.triage_result is None:
        warnings.append(
            validation_warning(
                "missing_triage_result",
                "No safety triage result was submitted.",
                "triage_result",
            )
        )
    else:
        if submission.triage_result.unanswered_question_ids:
            warnings.append(
                validation_warning(
                    "triage_unanswered_questions",
                    "Safety triage has unanswered questions.",
                    "triage_result.unanswered_question_ids",
                )
            )
        if submission.triage_result.red_flags:
            warnings.append(
                validation_warning(
                    "triage_red_flags",
                    "Safety triage contains red flags.",
                    "triage_result.red_flags",
                )
            )

    if not submission.acuity_results and submission.refraction_result is None:
        warnings.append(
            validation_warning(
                "session_has_no_test_results",
                "No acuity or refraction result was submitted.",
                "acuity_results",
            )
        )

    for index, acuity_result in enumerate(submission.acuity_results):
        results.append(validate_acuity_result(acuity_result, index))

    if submission.refraction_result is not None:
        results.append(validate_refraction_result(submission.refraction_result))

    if submission.reliability is not None:
        results.append(validate_reliability(submission.reliability))
    else:
        warnings.append(
            validation_warning(
                "missing_reliability",
                "No reliability result was submitted.",
                "reliability",
            )
        )

    combined = combine_validation_results(*results)
    return ValidationResult(
        errors=(*combined.errors, *errors),
        warnings=(*combined.warnings, *warnings),
    )
