# hphvision REST API Plan

## Package

```text
Package: hph-vision-api
Path: packages/restapi
Runtime: Python / FastAPI / Uvicorn
Role: backend HTTP API for mobile app, clinician review, report workflows, and validation services
Depends on: hph-vision-core
```

This plan is extracted and expanded from `docs/plans/general-plan.md`. It focuses only on the REST API package: FastAPI app structure, routing, API contracts, authentication boundaries, request/response schemas, error handling, privacy, deployment, observability, and API-specific testing.

---

## 1. Purpose

`hph-vision-api` is the backend HTTP service for the hphvision platform.

It should expose stable, versioned APIs that allow the mobile app to:

1. check backend availability,
2. submit screening sessions when the user consents,
3. upload or register generated screening reports,
4. submit results for clinician review,
5. retrieve clinician-review status,
6. synchronize server-side validation or reference data when needed.

The API should orchestrate backend workflows but should avoid embedding domain-heavy logic directly in route handlers. Reusable backend logic belongs in `hph-vision-core`.

---

## 2. Responsibility Boundaries

### 2.1 In Scope

The REST API package owns:

- FastAPI app creation,
- API routing,
- request/response schemas at the HTTP boundary,
- OpenAPI documentation,
- dependency injection wiring,
- authentication and authorization integration,
- request validation and error mapping,
- CORS and trusted-host configuration,
- rate-limit integration,
- API versioning,
- clinician-review endpoint orchestration,
- report upload/download endpoint orchestration,
- persistence adapter wiring,
- background task wiring,
- service health/readiness endpoints,
- deployment entrypoints,
- API integration tests.

### 2.2 Out of Scope

The REST API should not own:

- React Native app logic,
- mobile navigation,
- mobile local persistence,
- TypeScript algorithms in `@hiperhealth/hphvision-lib`,
- reusable backend domain services,
- backend scoring logic that can be tested without FastAPI,
- persistence-independent report policy,
- clinical recommendation policy,
- raw algorithm validation logic.

Those reusable backend concerns belong in `hph-vision-core`.

### 2.3 Dependency Rule

The dependency graph should stay one-directional:

```text
hph-vision-api
        ↓
hph-vision-core
```

The REST API may import `hph_vision_core`.

The REST API must not import from:

```text
packages/mobile
packages/mobile-lib
@hiperhealth/hphvision
@hiperhealth/hphvision-lib
```

If the API and mobile library need equivalent contracts, keep them aligned through explicit JSON fixtures, documented schemas, and validation tests rather than cross-language imports.

---

## 3. Current Package Structure

Current baseline:

```text
packages/restapi/
├── pyproject.toml
├── README.md
├── src/
│   └── hph_vision_api/
│       ├── __init__.py
│       ├── main.py
│       └── routers/
│           ├── __init__.py
│           └── health.py
└── tests/
    └── test_health_router.py
```

Recommended expanded structure:

```text
packages/restapi/src/hph_vision_api/
├── __init__.py
├── main.py
├── app.py
├── config.py
├── dependencies.py
├── errors.py
├── logging.py
├── security.py
├── version.py
├── routers/
│   ├── __init__.py
│   ├── health.py
│   ├── sessions.py
│   ├── reports.py
│   ├── clinician_review.py
│   ├── device_profiles.py
│   └── validation.py
├── schemas/
│   ├── __init__.py
│   ├── common.py
│   ├── health.py
│   ├── sessions.py
│   ├── reports.py
│   ├── clinician_review.py
│   ├── device_profiles.py
│   └── validation.py
├── adapters/
│   ├── __init__.py
│   ├── persistence.py
│   ├── object_storage.py
│   ├── notifications.py
│   └── auth.py
├── services/
│   ├── __init__.py
│   ├── session_service.py
│   ├── report_service.py
│   └── clinician_review_service.py
└── middleware/
    ├── __init__.py
    ├── request_id.py
    ├── error_handler.py
    └── security_headers.py
```

Notes:

- `routers/` should stay thin.
- `schemas/` should represent HTTP contracts.
- `services/` may orchestrate application use cases but should delegate domain logic to `hph-vision-core`.
- `adapters/` should hide infrastructure details such as persistence, storage, auth provider, or notification provider.

---

## 4. Runtime and Commands

### 4.1 Root Development Commands

Run from repository root:

```bash
poetry install
yarn api:dev
yarn api:lint
yarn api:format
yarn api:test
```

Equivalent direct API run command:

```bash
poetry run uvicorn hph_vision_api.main:app --app-dir packages/restapi/src --reload
```

### 4.2 Package Script Entrypoint

`packages/restapi/pyproject.toml` defines:

```toml
[project.scripts]
hph-vision-api = "hph_vision_api.main:main"
```

This script should remain a convenient local/deployment entrypoint.

---

## 5. FastAPI App Construction

### 5.1 Goal

Move toward an app factory pattern so tests and deployments can configure the app consistently.

Recommended API:

```py
from fastapi import FastAPI

from hph_vision_api.config import Settings


def create_app(settings: Settings | None = None) -> FastAPI:
    app = FastAPI(
        title="HPH Vision API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    configure_middleware(app, settings)
    configure_exception_handlers(app)
    include_routers(app)
    return app
```

`main.py` can then expose:

```py
app = create_app()
```

### 5.2 Acceptance Criteria

- app can be created in tests with custom settings,
- routers are registered in one place,
- docs and OpenAPI metadata are clear,
- health endpoint remains available with minimal dependencies.

---

## 6. Configuration

### 6.1 Settings Source

Use environment-variable based settings, ideally via Pydantic Settings if/when added.

Initial settings:

```py
class Settings:
    environment: str
    api_version: str
    log_level: str
    cors_allowed_origins: list[str]
    trusted_hosts: list[str]
    auth_enabled: bool
    database_url: str | None
    object_storage_bucket: str | None
    max_report_upload_mb: int
```

### 6.2 Environments

Supported environments:

```text
local
test
staging
production
```

### 6.3 Configuration Principles

- no secrets in source code,
- no production defaults for sensitive settings,
- all optional integrations should be disabled by default in local dev,
- tests should not depend on external services,
- settings should be injectable into app factory.

---

## 7. API Versioning

### 7.1 Version Prefix

The MVP can keep `/health` at root for simple infrastructure checks, but product APIs should be versioned:

```text
/api/v1/sessions
/api/v1/reports
/api/v1/clinician-review/submissions
/api/v1/device-profiles
/api/v1/validation
```

### 7.2 Compatibility Rules

- additive response fields are allowed,
- removing or renaming fields requires a new API version,
- request contract changes should be backward compatible when possible,
- mobile app should send its app version and library/protocol versions with submissions.

---

## 8. Endpoint Plan

### 8.1 Health and Readiness

Current endpoint:

```text
GET /health
```

Response:

```json
{
  "service": "hph-vision",
  "status": "ok"
}
```

Future endpoints:

```text
GET /health
GET /ready
GET /api/v1/version
```

Readiness should check dependencies when they exist:

- database connectivity,
- object storage connectivity,
- auth provider metadata if required,
- queue/background worker availability if required.

Health should stay lightweight and not fail due to optional dependencies.

### 8.2 Session Submission

Purpose:

- accept screening session data from the mobile app,
- validate shape and protocol versions,
- persist or queue for clinician review if requested.

Endpoints:

```text
POST /api/v1/sessions
GET /api/v1/sessions/{session_id}
PATCH /api/v1/sessions/{session_id}
```

Initial request concept:

```json
{
  "clientSessionId": "mobile-generated-id",
  "appVersion": "0.1.0",
  "libraryVersion": "0.1.0",
  "protocolVersions": {
    "acuity": "acuity-v0.1",
    "refraction": "refraction-v0.1",
    "template": "template-v0.1"
  },
  "deviceProfile": {},
  "templateMetadata": {},
  "triageResult": {},
  "acuityResults": [],
  "refractionResult": null,
  "reliability": {},
  "warnings": [],
  "consents": []
}
```

Response concept:

```json
{
  "id": "server-session-id",
  "clientSessionId": "mobile-generated-id",
  "status": "accepted",
  "createdAt": "2026-05-12T00:00:00Z"
}
```

### 8.3 Report Registration and Export

Purpose:

- accept report metadata,
- accept generated PDF upload if enabled,
- allow mobile app or clinician workflows to retrieve reports.

Endpoints:

```text
POST /api/v1/reports
POST /api/v1/reports/{report_id}/upload-url
GET /api/v1/reports/{report_id}
GET /api/v1/reports/{report_id}/download-url
```

MVP can begin with metadata only. File upload can be added later through pre-signed object-storage URLs rather than direct API file streaming.

### 8.4 Clinician Review

Purpose:

- submit a completed screening session for clinician review,
- expose status to the mobile app,
- support future clinician dashboard workflows.

Endpoints:

```text
POST /api/v1/clinician-review/submissions
GET /api/v1/clinician-review/submissions/{submission_id}
GET /api/v1/clinician-review/submissions/{submission_id}/status
POST /api/v1/clinician-review/submissions/{submission_id}/cancel
```

Status values:

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

### 8.5 Device Profile Reference Data

Purpose:

- optionally serve server-maintained device profiles to the app,
- support profile updates without shipping a new app.

Endpoints:

```text
GET /api/v1/device-profiles
GET /api/v1/device-profiles/{profile_id}
GET /api/v1/device-profiles/search?manufacturer=&model=
```

This endpoint is optional for MVP because the app/library can include local fallback profiles.

### 8.6 Validation and Fixture Endpoints

Purpose:

- support internal validation tools,
- compare mobile submissions against expected server-side validation rules,
- not necessarily exposed publicly.

Potential endpoints:

```text
POST /api/v1/validation/sessions/check
POST /api/v1/validation/reports/check
```

These should be protected or disabled in production unless explicitly needed.

---

## 9. Request and Response Schema Rules

### 9.1 Schema Location

HTTP schemas should live in:

```text
packages/restapi/src/hph_vision_api/schemas
```

### 9.2 Schema Principles

- use explicit request and response models,
- avoid returning raw internal domain objects directly,
- preserve protocol version fields,
- include timestamps in ISO 8601 UTC format,
- include stable IDs,
- include warnings as structured arrays, not concatenated strings.

### 9.3 Error Response Shape

Recommended error response:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "deviceProfile.bodyWidthMm",
        "message": "Value must be greater than zero."
      }
    ],
    "requestId": "req_123"
  }
}
```

### 9.4 Common Error Codes

```text
validation_error
unauthorized
forbidden
not_found
conflict
payload_too_large
unsupported_protocol_version
triage_blocked
low_reliability
rate_limited
internal_error
service_unavailable
```

---

## 10. Authentication and Authorization

### 10.1 MVP Posture

Early local development can run with auth disabled.

Staging/production should require authentication or another explicit trust model before accepting personally sensitive submissions.

### 10.2 Possible Actors

```text
anonymous_user
patient_user
clinician_user
admin_user
internal_service
```

### 10.3 Access Rules

- users can access only their own sessions/reports,
- clinicians can access only assigned review submissions,
- admins can manage operational data,
- internal validation endpoints require internal authorization,
- all access decisions should be auditable.

### 10.4 Implementation Guidance

Keep auth provider specifics behind an adapter:

```text
hph_vision_api/adapters/auth.py
```

Route handlers should depend on abstract current-user/current-actor helpers rather than provider-specific objects.

---

## 11. Privacy and Safety Requirements

### 11.1 Data Minimization

Do not require unnecessary personal identifiers for MVP screening.

Prefer:

- session IDs,
- age range rather than exact DOB,
- optional contact information only when clinician review requires it,
- explicit consent for uploads.

### 11.2 Consent Records

Submissions should include consent metadata:

```json
{
  "type": "screening_upload",
  "accepted": true,
  "acceptedAt": "2026-05-12T00:00:00Z",
  "textVersion": "consent-v0.1"
}
```

### 11.3 Clinical Safety

The API should preserve and return warnings generated by mobile/library/core workflows.

The API should never transform a screening estimate into a final prescription without a clinician-review workflow and applicable regulatory decisions.

### 11.4 Audit Logging

Audit events should be recorded for:

- session submission,
- report upload,
- clinician-review submission,
- clinician-review status changes,
- data export/download,
- deletion requests,
- auth failures.

Audit logs should avoid storing sensitive clinical payloads unless strictly necessary.

---

## 12. Persistence Plan

### 12.1 MVP Persistence Options

Early stages can use in-memory or local-file adapters for development tests.

Production should use explicit persistence services, likely:

- relational database for sessions/review metadata,
- object storage for PDFs and large artifacts,
- queue/background jobs for clinician-review notifications or processing.

### 12.2 Adapter Interface

Keep storage details behind interfaces:

```py
class SessionRepository:
    async def create(self, session: SessionCreateData) -> SessionRecord: ...
    async def get(self, session_id: str) -> SessionRecord | None: ...
    async def update(self, session_id: str, data: SessionUpdateData) -> SessionRecord: ...
```

### 12.3 Persistence Principles

- route handlers do not write directly to database clients,
- repositories hide storage technology,
- tests can use fake repositories,
- migrations are required before production database use,
- sensitive fields should be encrypted or excluded according to data policy.

---

## 13. Service Layer Plan

### 13.1 Session Service

Responsibilities:

- validate session submission with `hph-vision-core`,
- enforce protocol compatibility,
- create server session record,
- preserve raw submission if policy allows,
- return stable server ID.

### 13.2 Report Service

Responsibilities:

- validate report metadata,
- create report record,
- create upload/download URLs when object storage exists,
- enforce ownership/authorization.

### 13.3 Clinician Review Service

Responsibilities:

- validate submission eligibility,
- create review submission,
- assign queue/status,
- notify clinician workflow if configured,
- expose status.

### 13.4 Health Service

Current health service comes from `hph-vision-core`:

```py
from hph_vision_core import get_health_status
```

The API can wrap this with dependency readiness checks later.

---

## 14. Observability

### 14.1 Logging

Use structured logging where possible.

Each request should include:

- request ID,
- method,
- path,
- status code,
- duration,
- actor ID when available,
- error code when applicable.

Avoid logging full clinical payloads by default.

### 14.2 Metrics

Useful metrics:

- request count by route/status,
- request latency,
- validation error count,
- session submission count,
- report generation/upload count,
- clinician-review submission count,
- dependency readiness failures.

### 14.3 Tracing

Future distributed tracing should propagate request IDs across:

- API,
- background workers,
- object storage operations,
- clinician-review notifications.

---

## 15. Security Controls

### 15.1 HTTP Security

- configure CORS explicitly,
- restrict trusted hosts in production,
- add security headers where appropriate,
- limit request body size,
- reject unsupported content types,
- use HTTPS in deployed environments,
- rate-limit sensitive endpoints.

### 15.2 Input Validation

Validate:

- physical dimensions,
- protocol versions,
- enum values,
- report metadata,
- upload file type and size,
- timestamps,
- IDs and ownership.

### 15.3 File Upload Safety

If report PDF upload is supported:

- prefer pre-signed object-storage URLs,
- restrict MIME types,
- restrict size,
- scan files if policy requires,
- store files outside public buckets,
- issue short-lived download URLs.

---

## 16. Testing Strategy

### 16.1 Unit Tests

Test:

- settings parsing,
- error response builders,
- schema validation,
- service orchestration,
- auth dependency behavior,
- repository fakes.

### 16.2 Router Tests

Test using FastAPI `TestClient` or async client:

- `GET /health`,
- validation failures,
- not-found responses,
- auth-required responses,
- session creation happy path,
- report metadata creation,
- clinician-review status flow.

### 16.3 Contract Tests

Contract tests should use JSON fixtures compatible with mobile-library/mobile-app session output.

Test that:

- mobile-generated payloads are accepted,
- missing protocol versions are rejected or warned,
- unsupported protocol versions return clear errors,
- report warnings are preserved.

### 16.4 Integration Tests

When persistence is introduced:

- repository integration tests,
- migration tests,
- object storage adapter tests with local fake service,
- auth adapter tests with mocked provider.

### 16.5 Commands

```bash
yarn api:test
yarn api:lint
yarn api:format
poetry run pytest packages/restapi/tests
```

---

## 17. Deployment Plan

### 17.1 Containerization

The API should eventually be deployable as a container.

Container entrypoint concept:

```bash
uvicorn hph_vision_api.main:app --host 0.0.0.0 --port 8000
```

Production should not use `--reload`.

### 17.2 Runtime Dependencies

Production may require:

- Python runtime,
- package installation through Poetry/exported requirements,
- database URL,
- object storage credentials,
- auth provider config,
- logging/metrics config.

### 17.3 Health Checks

Container or platform health check:

```text
GET /health
```

Readiness check:

```text
GET /ready
```

---

## 18. Documentation Requirements

The API should document:

- local development commands,
- environment variables,
- endpoint list,
- auth requirements,
- request/response examples,
- error response format,
- privacy/safety constraints,
- deployment notes.

OpenAPI docs should remain useful in local development:

```text
/docs
/redoc
/openapi.json
```

---

## 19. Implementation Milestones

### Milestone 0 — Baseline Health API

Current baseline:

- FastAPI app exists,
- `/health` route exists,
- route calls `hph-vision-core`,
- basic test exists.

Acceptance criteria:

- `poetry check -C packages/restapi` passes,
- `poetry run pytest packages/restapi/tests` passes after dependencies are installed,
- `yarn api:dev` starts locally.

### Milestone 1 — App Factory and Settings

Tasks:

- add `app.py`,
- add `config.py`,
- move app construction into `create_app`,
- add environment settings,
- add tests for settings and app creation.

Acceptance criteria:

- tests can create app with test settings,
- `/health` still works,
- local dev command still works.

### Milestone 2 — API Error Model

Tasks:

- add error response schema,
- add exception handlers,
- add request ID middleware,
- standardize validation errors.

Acceptance criteria:

- validation errors use documented shape,
- every error response includes request ID,
- tests cover common errors.

### Milestone 3 — Versioned Routing

Tasks:

- add `/api/v1` router prefix,
- add `/api/v1/version`,
- keep `/health` root endpoint,
- organize routers by domain.

Acceptance criteria:

- OpenAPI groups routes clearly,
- version endpoint returns API and core versions.

### Milestone 4 — Session Submission API

Tasks:

- define session request/response schemas,
- add session router,
- call `hph-vision-core` validators,
- use fake in-memory repository for MVP,
- add tests with fixtures.

Acceptance criteria:

- valid session submission returns accepted response,
- invalid payload returns structured validation errors,
- unsupported protocol versions return clear error.

### Milestone 5 — Report Metadata API

Tasks:

- define report schemas,
- create report metadata endpoint,
- attach reports to sessions,
- preserve disclaimers and warnings.

Acceptance criteria:

- report metadata can be created for a session,
- report includes clinical limitation statement,
- ownership/authorization hooks exist even if disabled locally.

### Milestone 6 — Clinician Review Submission

Tasks:

- define review submission schemas,
- add status model,
- add submission creation endpoint,
- add status endpoint,
- add fake queue/service adapter.

Acceptance criteria:

- mobile app can submit a session for review,
- status can be queried,
- low-confidence cases can be marked for review.

### Milestone 7 — Persistence Adapter

Tasks:

- define repository interfaces,
- add database-backed implementation,
- add migrations if database selected,
- keep fake repositories for tests.

Acceptance criteria:

- tests do not need external database by default,
- persistence integration tests are isolated,
- session/report/review records survive process restart in configured environments.

### Milestone 8 — Auth and Authorization

Tasks:

- define actor model,
- add auth dependency,
- protect session/report/review endpoints,
- preserve local auth-disabled mode.

Acceptance criteria:

- unauthorized access is rejected,
- users cannot access other users' sessions,
- clinician access can be scoped.

### Milestone 9 — Object Storage for PDFs

Tasks:

- add object storage adapter,
- generate upload URLs,
- generate download URLs,
- restrict file size/type.

Acceptance criteria:

- API does not expose public permanent file URLs,
- upload/download authorization is enforced,
- tests use fake storage adapter.

### Milestone 10 — Production Readiness

Tasks:

- add structured logging,
- add metrics hooks,
- configure CORS/trusted hosts,
- add rate limiting strategy,
- add container build,
- add deployment docs.

Acceptance criteria:

- production config has no unsafe defaults,
- logs avoid sensitive payloads,
- `/health` and `/ready` support platform checks,
- CI validates API tests and linting.

---

## 20. Risks and Mitigations

| Risk                                   | Mitigation                                           |
| -------------------------------------- | ---------------------------------------------------- |
| Route handlers accumulate domain logic | Delegate to `hph-vision-core` and API service layer  |
| Mobile/API contracts drift             | Use JSON fixtures and contract tests                 |
| Sensitive data logged accidentally     | Structured logging policy and payload redaction      |
| Users upload data without consent      | Require consent metadata and explicit mobile action  |
| API returns estimates as prescriptions | Preserve disclaimer and clinician-review requirement |
| Auth design blocks local development   | Support auth-disabled local/test settings            |
| Persistence choice changes             | Use repository interfaces and adapters               |
| PDF uploads expose private data        | Use private storage and short-lived signed URLs      |

---

## 21. Definition of Done for MVP REST API

The MVP REST API is complete when:

- FastAPI app uses an app factory,
- settings are environment-driven and testable,
- `/health` and `/api/v1/version` exist,
- structured API errors are implemented,
- session submission endpoint accepts mobile-compatible payloads,
- report metadata endpoint exists,
- clinician-review submission and status endpoints exist,
- endpoint logic delegates reusable domain rules to `hph-vision-core`,
- privacy and clinical disclaimer data are preserved,
- tests cover health, validation errors, session submission, report metadata, and review status,
- `yarn api:lint`, `yarn api:format`, and `yarn api:test` pass in CI.
