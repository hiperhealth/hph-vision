# HPH Vision API

FastAPI HTTP boundary for HPH Vision mobile, report, validation, and
clinician-review workflows.

The API package owns routing, HTTP schemas, error responses, settings,
middleware, and application-service orchestration. Reusable clinical/domain logic
is delegated to `hph-vision-core`.

## Local development

From the repository root:

```bash
poetry install
pnpm api:dev
pnpm api:test
pnpm api:lint
```

Direct run command:

```bash
poetry run uvicorn hph_vision_api.main:app --app-dir packages/restapi/src --reload
```

## Environment variables

- `HPH_ENVIRONMENT`: `local`, `test`, `staging`, or `production`.
- `HPH_API_VERSION`: API version string.
- `HPH_LOG_LEVEL`: logging level.
- `HPH_CORS_ALLOWED_ORIGINS`: comma-separated origins.
- `HPH_TRUSTED_HOSTS`: comma-separated host allow-list.
- `HPH_AUTH_ENABLED`: enable auth dependency enforcement.
- `HPH_DATABASE_URL`: future database adapter URL.
- `HPH_OBJECT_STORAGE_BUCKET`: future object-storage bucket.
- `HPH_MAX_REPORT_UPLOAD_MB`: report upload limit.
- `HPH_ENABLE_INTERNAL_VALIDATION_ENDPOINTS`: enable `/api/v1/validation/*`.

## MVP endpoints

- `GET /health`
- `GET /ready`
- `GET /api/v1/version`
- `POST /api/v1/sessions`
- `GET /api/v1/sessions/{session_id}`
- `PATCH /api/v1/sessions/{session_id}`
- `POST /api/v1/reports`
- `GET /api/v1/reports/{report_id}`
- `POST /api/v1/reports/{report_id}/upload-url`
- `GET /api/v1/reports/{report_id}/download-url`
- `POST /api/v1/clinician-review/submissions`
- `GET /api/v1/clinician-review/submissions/{submission_id}`
- `GET /api/v1/clinician-review/submissions/{submission_id}/status`
- `POST /api/v1/clinician-review/submissions/{submission_id}/cancel`
- `GET /api/v1/device-profiles`
- `GET /api/v1/device-profiles/search`
- `GET /api/v1/device-profiles/{profile_id}`
- `POST /api/v1/validation/sessions/check`

## Safety and privacy

The API preserves consent records, warnings, protocol versions, and the required
screening disclaimer. It must not turn a screening/refraction estimate into a
final prescription outside a clinician-review workflow and regulatory decision.

MVP persistence uses in-memory adapters for tests/local development only.
Production storage, object storage, auth, audit logging, and rate limiting should
be added behind adapters before handling real sensitive data.
