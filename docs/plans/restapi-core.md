# hphvision REST API Core Plan

## Package

```text
Package: hph-vision-core
Path: packages/api-core
Runtime: Python
Role: reusable backend domain logic for hph-vision-api and future backend tools
Must not depend on: FastAPI unless explicitly justified
```

This plan is extracted and expanded from `docs/plans/general-plan.md`. It focuses only on the backend core package: framework-independent domain services, validation, backend data schemas, recommendation policy, session/report domain logic, clinician-review domain rules, and test fixtures used by the REST API.

---

## 1. Purpose

`hph-vision-core` is the reusable backend domain package for the hphvision backend.

It should contain logic that is:

- independent from FastAPI,
- independent from HTTP request/response details,
- independent from database clients,
- deterministic and unit-testable,
- reusable by CLI tools, batch jobs, validation pipelines, and the REST API,
- safe for clinically sensitive workflows.

The package exists so that `hph-vision-api` route handlers and services remain thin and orchestration-focused.

---

## 2. Responsibility Boundaries

### 2.1 In Scope

The core package should own:

- backend domain models,
- backend validation rules,
- protocol/version compatibility checks,
- session submission validation,
- report domain model construction,
- recommendation policy,
- clinical warning aggregation,
- reliability interpretation helpers,
- clinician-review eligibility rules,
- health/status primitives,
- serialization helpers for domain objects,
- test fixtures shared by backend tests,
- persistence-independent service functions.

### 2.2 Out of Scope

The core package should not own:

- FastAPI route definitions,
- HTTP status codes,
- request/response schema decorators,
- auth provider integration,
- database clients,
- object storage clients,
- background queue clients,
- React Native code,
- TypeScript imports,
- app navigation,
- mobile PDF rendering.

### 2.3 Dependency Rule

The dependency graph should be:

```text
hph-vision-api
        ↓
hph-vision-core
```

`hph-vision-core` should not import `hph_vision_api`.

`hph-vision-core` should not import from:

```text
packages/mobile
packages/mobile-lib
@hiperhealth/hphvision
@hiperhealth/hphvision-lib
```

Cross-language alignment should happen through explicit JSON fixtures and documented contracts.

---

## 3. Current Package Structure

Current baseline:

```text
packages/api-core/
├── pyproject.toml
├── README.md
├── src/
│   └── hph_vision_core/
│       ├── __init__.py
│       └── services/
│           ├── __init__.py
│           └── health.py
└── tests/
    └── test_health.py
```

Recommended expanded structure:

```text
packages/api-core/src/hph_vision_core/
├── __init__.py
├── version.py
├── errors.py
├── types.py
├── health/
│   ├── __init__.py
│   ├── models.py
│   └── service.py
├── sessions/
│   ├── __init__.py
│   ├── models.py
│   ├── validation.py
│   ├── protocol.py
│   ├── recommendations.py
│   └── service.py
├── reports/
│   ├── __init__.py
│   ├── models.py
│   ├── builder.py
│   ├── disclaimers.py
│   ├── warnings.py
│   └── validation.py
├── clinician_review/
│   ├── __init__.py
│   ├── models.py
│   ├── eligibility.py
│   ├── status.py
│   └── service.py
├── device_profiles/
│   ├── __init__.py
│   ├── models.py
│   ├── validation.py
│   └── matching.py
├── reliability/
│   ├── __init__.py
│   ├── models.py
│   ├── scoring.py
│   └── warnings.py
├── validation/
│   ├── __init__.py
│   ├── result.py
│   ├── numeric.py
│   ├── dates.py
│   └── protocols.py
└── fixtures/
    ├── __init__.py
    ├── sessions.py
    ├── reports.py
    └── device_profiles.py
```

The existing `services/health.py` can either remain temporarily or be migrated into `health/service.py` once more modules are added.

---

## 4. Development Commands

Run from repository root:

```bash
poetry install
yarn api:lint
yarn api:format
yarn api:test
```

Package-specific checks:

```bash
poetry check -C packages/api-core
poetry run pytest packages/api-core/tests
poetry run ruff check packages/api-core
poetry run ruff format packages/api-core
poetry run mypy packages/api-core/src
```

---

## 5. Design Principles

### 5.1 Framework Independence

Domain functions should accept and return Python objects, dataclasses, or typed dictionaries. They should not depend on FastAPI request objects, responses, dependencies, or exceptions.

Good:

```py
def evaluate_session_submission(submission: SessionSubmission) -> ValidationResult:
    ...
```

Avoid:

```py
def evaluate_session_submission(request: fastapi.Request) -> fastapi.Response:
    ...
```

### 5.2 Deterministic Logic

Core functions should avoid hidden I/O, current-time calls, randomness, or global state.

If time is needed, pass it in:

```py
def create_report(session: SessionSubmission, *, created_at: datetime) -> ScreeningReport:
    ...
```

### 5.3 Typed Validation Results

Expected validation failures should return structured results rather than raising generic exceptions.

```py
@dataclass(frozen=True)
class ValidationError:
    code: str
    field: str | None
    message: str

@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    errors: tuple[ValidationError, ...] = ()
```

### 5.4 Explicit Clinical Caution

The core package should preserve domain language that prevents overclaiming.

Required disclaimer:

```text
This result is a screening and estimation output. It is not a complete eye health examination.
```

This disclaimer should be available from a single canonical constant or function.

### 5.5 Version Awareness

All clinically sensitive validation and recommendation functions should know the versions they support:

- acuity protocol version,
- refraction protocol version,
- template protocol version,
- report schema version,
- recommendation policy version.

---

## 6. Public API Strategy

### 6.1 Package Root Exports

`hph_vision_core.__init__` should export stable, intentional APIs only.

Current baseline:

```py
from hph_vision_core import HealthStatus, get_health_status
```

Future exports may include:

```py
from hph_vision_core import (
    SCREENING_DISCLAIMER,
    HealthStatus,
    ValidationError,
    ValidationResult,
    evaluate_session_submission,
    build_screening_report,
    determine_clinician_review_eligibility,
)
```

Avoid exporting every internal helper from the package root.

### 6.2 Internal Module Imports

Internal modules can import each other, but circular dependencies should be avoided.

Recommended direction:

```text
models/types
  -> validation helpers
  -> domain services
  -> public package exports
```

---

## 7. Domain Model Plan

### 7.1 Session Submission

The backend should accept mobile-compatible screening session data while keeping a Python-native representation internally.

Conceptual model:

```py
@dataclass(frozen=True)
class SessionSubmission:
    client_session_id: str
    app_version: str | None
    library_version: str | None
    protocol_versions: ProtocolVersions
    device_profile: DeviceProfile | None
    template_metadata: TemplateMetadata | None
    triage_result: TriageResult | None
    acuity_results: tuple[AcuityResult, ...]
    refraction_result: RefractionResult | None
    reliability: ReliabilityResult | None
    warnings: tuple[DomainWarning, ...]
    consents: tuple[ConsentRecord, ...]
```

### 7.2 Protocol Versions

```py
@dataclass(frozen=True)
class ProtocolVersions:
    acuity: str | None = None
    refraction: str | None = None
    template: str | None = None
    report: str | None = None
```

### 7.3 Consent Record

```py
@dataclass(frozen=True)
class ConsentRecord:
    type: str
    accepted: bool
    accepted_at: datetime | None
    text_version: str
```

### 7.4 Device Profile

Python model should mirror the important backend fields from the mobile-library `DeviceProfile` contract:

```py
@dataclass(frozen=True)
class DeviceProfile:
    id: str
    manufacturer: str
    model_name: str
    body_width_mm: float
    body_height_mm: float
    thickness_mm: float
    screen_width_px: int | None = None
    screen_height_px: int | None = None
    pixel_density: float | None = None
```

### 7.5 Screening Report

```py
@dataclass(frozen=True)
class ScreeningReport:
    id: str
    session_id: str
    created_at: datetime
    device_profile: DeviceProfile | None
    acuity_results: tuple[AcuityResult, ...]
    refraction_result: RefractionResult | None
    reliability: ReliabilityResult
    warnings: tuple[DomainWarning, ...]
    recommendation: ResultRecommendation
    disclaimer: str
```

---

## 8. Validation Module Plan

### 8.1 Purpose

Validation should be reusable by API services, CLI tools, test fixtures, and future background jobs.

### 8.2 Validation Result Types

```py
@dataclass(frozen=True)
class ValidationError:
    code: str
    message: str
    field: str | None = None
    severity: Literal["error", "warning"] = "error"

@dataclass(frozen=True)
class ValidationResult:
    errors: tuple[ValidationError, ...] = ()
    warnings: tuple[ValidationError, ...] = ()

    @property
    def ok(self) -> bool:
        return not self.errors
```

### 8.3 Common Validation Functions

```py
def validate_positive_mm(value: float, field: str) -> ValidationResult: ...
def validate_iso_datetime(value: str, field: str) -> ValidationResult: ...
def validate_protocol_versions(versions: ProtocolVersions) -> ValidationResult: ...
def combine_validation_results(*results: ValidationResult) -> ValidationResult: ...
```

### 8.4 Acceptance Criteria

- validation results are structured,
- validation can include warnings and errors,
- API can map validation errors to HTTP responses,
- no FastAPI dependency is required.

---

## 9. Session Validation Plan

### 9.1 Purpose

Session validation checks whether a submitted mobile screening session is structurally valid, protocol-compatible, and safe to store or route for review.

### 9.2 Validation Categories

Validate:

- required session ID,
- app/library/protocol version presence,
- supported protocol versions,
- consent metadata,
- device dimensions,
- template metadata consistency,
- triage result presence,
- red-flag triage handling,
- acuity result structure,
- refraction estimate uncertainty,
- reliability score range,
- warnings format.

### 9.3 Public Function

```py
def evaluate_session_submission(
    submission: SessionSubmission,
) -> SessionEvaluation:
    ...
```

Conceptual output:

```py
@dataclass(frozen=True)
class SessionEvaluation:
    validation: ValidationResult
    can_store: bool
    can_submit_for_clinician_review: bool
    warnings: tuple[DomainWarning, ...]
    recommendation: ResultRecommendation
```

### 9.4 Acceptance Criteria

- red-flag sessions are flagged,
- unsupported protocol versions are rejected or clearly warned according to policy,
- low reliability affects recommendation,
- validation is deterministic and covered by fixtures.

---

## 10. Report Domain Plan

### 10.1 Purpose

The report domain builds backend report models from validated sessions.

The core does not generate PDF bytes. It creates report data that the API or other tooling can render or store.

### 10.2 Required Report Content

A screening report should include:

- session ID,
- report ID,
- created timestamp,
- app/library/protocol versions,
- device used,
- whether template/visor was used,
- visual acuity results,
- refraction estimate,
- reliability score,
- warnings,
- recommendation,
- mandatory disclaimer.

### 10.3 Public Functions

```py
def build_screening_report(
    session: SessionSubmission,
    *,
    report_id: str,
    created_at: datetime,
) -> ScreeningReport:
    ...


def get_screening_disclaimer() -> str:
    ...
```

### 10.4 Acceptance Criteria

- every report includes disclaimer,
- warnings are preserved,
- recommendation is derived consistently,
- report output can be serialized to JSON,
- no PDF renderer dependency is required.

---

## 11. Recommendation Policy Plan

### 11.1 Purpose

Recommendation policy converts session quality, red flags, and results into cautious next-step guidance.

### 11.2 Recommendation Values

```text
continue_self_monitoring
repeat_test
clinician_review_recommended
professional_exam_recommended
urgent_care_recommended
invalid_result
```

### 11.3 Inputs

- triage red flags,
- acuity result severity,
- refraction confidence,
- reliability score,
- environment warnings,
- completion status,
- contradiction warnings.

### 11.4 Public Function

```py
def determine_recommendation(
    input: RecommendationInput,
) -> ResultRecommendation:
    ...
```

### 11.5 Policy Rules

Initial rules:

- red flags -> professional or urgent care recommendation,
- very low reliability -> invalid result or repeat test,
- low confidence refraction -> clinician review,
- incomplete session -> repeat test,
- successful screening with medium/high reliability -> clinician review optional depending on product policy.

### 11.6 Acceptance Criteria

- recommendations never imply final diagnosis,
- low confidence is visible,
- red flags dominate other results,
- rules are unit-tested and versioned.

---

## 12. Clinician Review Domain Plan

### 12.1 Purpose

Clinician-review domain logic decides whether a session is eligible for review and what status transitions are valid.

The API handles persistence and authorization. Core handles domain rules.

### 12.2 Status Values

```text
submitted
queued
in_review
needs_more_information
completed
cancelled
rejected
expired
```

### 12.3 Eligibility Rules

A session may be eligible when:

- consent for review/upload exists,
- session has enough data for review,
- report has been generated or can be generated,
- unsupported protocol versions are not present,
- required warnings and disclaimers are preserved.

A session may be ineligible when:

- user did not consent,
- payload is invalid,
- session is too incomplete,
- triage indicates urgent professional care rather than async review,
- protocol is unsupported.

### 12.4 Public Functions

```py
def determine_clinician_review_eligibility(
    session: SessionSubmission,
) -> ClinicianReviewEligibility:
    ...


def validate_review_status_transition(
    current: ReviewStatus,
    next_status: ReviewStatus,
) -> ValidationResult:
    ...
```

### 12.5 Acceptance Criteria

- review eligibility is deterministic,
- consent is required,
- invalid transitions are rejected,
- status transition tests cover the full state model.

---

## 13. Reliability Domain Plan

### 13.1 Purpose

Backend reliability helpers interpret reliability signals submitted by the mobile app and preserve warnings for reports/review.

The Python core should not necessarily duplicate all mobile scoring algorithms in MVP, but it should validate and interpret submitted reliability data.

### 13.2 Model

```py
@dataclass(frozen=True)
class ReliabilityResult:
    score: float
    level: Literal["high", "medium", "low", "invalid"]
    warnings: tuple[DomainWarning, ...]
```

### 13.3 Public Functions

```py
def validate_reliability(result: ReliabilityResult) -> ValidationResult: ...
def interpret_reliability(result: ReliabilityResult) -> ReliabilityInterpretation: ...
```

### 13.4 Acceptance Criteria

- score range is enforced,
- invalid/low reliability affects recommendations,
- missing reliability result is handled safely,
- warnings are serializable.

---

## 14. Device Profile Domain Plan

### 14.1 Purpose

Backend device-profile logic validates submitted device data and can support future server-maintained profile reference data.

### 14.2 Validation Rules

Validate:

- body width > 0,
- body height > 0,
- thickness > 0,
- screen dimensions are plausible,
- pixel dimensions are positive if provided,
- manufacturer/model fields are not empty when profile is claimed.

### 14.3 Public Functions

```py
def validate_device_profile(profile: DeviceProfile) -> ValidationResult: ...
def normalize_device_model_name(value: str) -> str: ...
```

### 14.4 Future Responsibilities

Potential future backend responsibilities:

- canonical device-profile database,
- profile search,
- profile review workflow,
- conflict detection between submitted dimensions and canonical profiles.

---

## 15. Health Module Plan

### 15.1 Current Baseline

Current service:

```py
@dataclass(frozen=True)
class HealthStatus:
    service: str = "hph-vision"
    status: str = "ok"


def get_health_status() -> HealthStatus:
    return HealthStatus()
```

### 15.2 Future Expansion

Health core can expose static service health. API readiness checks should live in the API because they depend on infrastructure.

Core may expose:

```py
def get_core_version() -> str: ...
def get_supported_protocol_versions() -> SupportedProtocolVersions: ...
```

---

## 16. Serialization Strategy

### 16.1 Goal

Core domain objects should be easy to serialize for API responses, persistence, and validation fixtures.

### 16.2 Options

Initial simple approach:

- dataclasses,
- `to_dict()` helpers where needed,
- explicit serializer functions.

Future option:

- Pydantic models in core if useful, but avoid coupling all domain logic to API-specific schemas.

### 16.3 Principles

- serialize enums as stable strings,
- serialize datetimes as ISO 8601 UTC,
- avoid lossy transformations,
- avoid leaking internal-only fields in public serializers,
- keep fixture JSON stable.

---

## 17. Fixture Strategy

### 17.1 Purpose

Fixtures keep mobile, API, and core behavior aligned.

### 17.2 Fixture Types

```text
valid-session-minimal.json
valid-session-full.json
red-flag-session.json
low-reliability-session.json
unsupported-protocol-session.json
valid-report.json
invalid-device-profile.json
clinician-review-eligible-session.json
```

### 17.3 Location

Python fixtures can live in:

```text
packages/api-core/tests/fixtures
```

or exported package fixtures can live in:

```text
packages/api-core/src/hph_vision_core/fixtures
```

Use package fixtures only when runtime code needs access to them. Test-only fixtures should remain under `tests/`.

### 17.4 Acceptance Criteria

- API tests use core fixtures,
- fixtures include protocol versions,
- fixtures include disclaimer expectations where report output is involved,
- invalid fixtures document expected errors.

---

## 18. Testing Strategy

### 18.1 Unit Tests

Required unit test areas:

- health status,
- validation result composition,
- protocol version compatibility,
- consent validation,
- device-profile validation,
- session submission evaluation,
- report building,
- recommendation policy,
- clinician-review eligibility,
- review status transitions,
- reliability interpretation.

### 18.2 Boundary Tests

Test:

- missing fields,
- impossible physical dimensions,
- unsupported protocol versions,
- no consent,
- red-flag triage,
- low reliability,
- incomplete session,
- contradictory warnings,
- empty acuity/refraction results,
- invalid status transitions.

### 18.3 Contract Tests

Core should provide or consume JSON fixtures that correspond to mobile-library session outputs.

Contract tests should ensure:

- JSON payload can be parsed into core domain model,
- core validation gives expected errors/warnings,
- API schemas can map to/from core objects.

### 18.4 Commands

```bash
poetry run pytest packages/api-core/tests
poetry run ruff check packages/api-core
poetry run ruff format packages/api-core
poetry run mypy packages/api-core/src
```

---

## 19. Documentation Requirements

`packages/api-core/README.md` should grow to include:

- package purpose,
- dependency boundary,
- public APIs,
- module descriptions,
- validation policy,
- recommendation policy,
- fixture strategy,
- how to run tests,
- how to add domain modules,
- how to version protocol-sensitive logic.

Additional docs can be added later:

```text
docs/restapi-core/session-validation.md
docs/restapi-core/recommendation-policy.md
docs/restapi-core/clinician-review.md
docs/restapi-core/fixtures.md
```

---

## 20. Implementation Milestones

### Milestone 0 — Baseline Core Health

Current baseline:

- package exists,
- health service exists,
- health test exists.

Acceptance criteria:

- `poetry check -C packages/api-core` passes,
- `poetry run pytest packages/api-core/tests` passes after dependencies are installed.

### Milestone 1 — Core Package Structure

Tasks:

- add `version.py`,
- add `validation/result.py`,
- add `errors.py`,
- organize health module,
- keep backwards-compatible health export.

Acceptance criteria:

- imports remain stable,
- validation result type is tested,
- package root exports only intentional APIs.

### Milestone 2 — Domain Models

Tasks:

- define session models,
- define protocol version models,
- define consent model,
- define warning model,
- define recommendation model.

Acceptance criteria:

- models are immutable where practical,
- models serialize predictably,
- basic fixtures can be represented.

### Milestone 3 — Protocol and Consent Validation

Tasks:

- define supported protocol versions,
- validate submitted versions,
- validate consent records,
- implement validation composition helpers.

Acceptance criteria:

- unsupported versions produce structured errors,
- missing consent blocks upload/review eligibility,
- tests cover warnings vs errors.

### Milestone 4 — Device Profile Validation

Tasks:

- add device profile model,
- validate dimensions,
- normalize manufacturer/model names,
- add invalid/valid fixtures.

Acceptance criteria:

- impossible dimensions are rejected,
- valid profile passes,
- validation errors include fields.

### Milestone 5 — Session Evaluation

Tasks:

- implement session submission model,
- validate session completeness,
- evaluate red-flag and reliability conditions,
- determine store/review eligibility flags.

Acceptance criteria:

- valid session can be accepted,
- red-flag session is flagged,
- incomplete session returns clear warnings/errors.

### Milestone 6 — Recommendation Policy

Tasks:

- implement recommendation inputs,
- implement policy rules,
- include policy version,
- test all major branches.

Acceptance criteria:

- red flags dominate recommendation,
- low reliability recommends repeat/invalid,
- clinician-review recommendation is explicit.

### Milestone 7 — Report Builder

Tasks:

- define screening report model,
- add mandatory disclaimer,
- aggregate warnings,
- include recommendation,
- serialize report model.

Acceptance criteria:

- report builder is deterministic,
- every report includes disclaimer,
- report fixture tests pass.

### Milestone 8 — Clinician Review Rules

Tasks:

- define review status enum,
- implement eligibility,
- implement transition validation,
- add fixtures.

Acceptance criteria:

- no-consent sessions are ineligible,
- invalid transitions are rejected,
- eligible sessions return clear reasons.

### Milestone 9 — API Integration Support

Tasks:

- provide mapper-friendly types,
- document how API schemas map to core models,
- add contract fixtures for API tests,
- ensure no FastAPI imports exist.

Acceptance criteria:

- `grep` or lint confirms no FastAPI dependency in core,
- API can validate session submissions through core,
- contract tests use shared fixtures.

### Milestone 10 — Validation Readiness

Tasks:

- add protocol-sensitive versioning,
- document recommendation policy,
- document validation assumptions,
- expand fixtures for validation scenarios,
- add strict mypy coverage.

Acceptance criteria:

- validation team can reproduce recommendation outcomes,
- clinically sensitive policy changes are reviewable,
- all core tests pass in CI.

---

## 21. Risks and Mitigations

| Risk                                             | Mitigation                                                      |
| ------------------------------------------------ | --------------------------------------------------------------- |
| Core becomes coupled to FastAPI                  | Keep no-FastAPI dependency rule and test/lint for imports       |
| Mobile/API contracts drift                       | Maintain JSON fixtures and contract tests                       |
| Clinical recommendations overclaim               | Central disclaimer and cautious recommendation policy           |
| Unsupported protocol versions accepted silently  | Explicit protocol validation and errors                         |
| Report builder omits warnings                    | Warning aggregation tests and required fields                   |
| Status transitions become inconsistent           | Central transition validation                                   |
| Persistence details leak into core               | Use pure domain models and repository code only in API/adapters |
| Duplicate logic diverges from TypeScript library | Shared fixtures and documented expected outputs                 |

---

## 22. Definition of Done for MVP REST API Core

The MVP backend core package is complete when:

- `hph-vision-core` has framework-independent domain models,
- validation result types and helpers are implemented,
- protocol version validation exists,
- consent validation exists,
- device-profile validation exists,
- session submission evaluation exists,
- recommendation policy exists and is cautious,
- report builder includes mandatory disclaimer,
- clinician-review eligibility and status transition rules exist,
- fixtures cover valid, invalid, red-flag, low-reliability, and review-eligible sessions,
- no FastAPI dependency is required by core logic,
- `poetry run pytest packages/api-core/tests`, `ruff`, and `mypy` pass in CI.
