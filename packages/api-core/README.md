# HPH Vision Core

Framework-independent backend domain logic for HPH Vision.

`hph-vision-core` is consumed by `hph-vision-api` and future backend tools. It
must remain independent from FastAPI, database clients, object storage clients,
and mobile app code. Route handlers should delegate validation, recommendation,
report, reliability, and clinician-review decisions to this package.

## Public domains

- `health`: static package health primitives.
- `validation`: structured validation errors/warnings and reusable helpers.
- `device_profiles`: submitted device-profile models and validation.
- `reliability`: reliability result validation and interpretation.
- `sessions`: session submission models, protocol validation, consent checks,
  recommendation policy, and session evaluation.
- `reports`: deterministic screening-report data builder and required clinical
  disclaimer.
- `clinician_review`: review eligibility and status-transition rules.
- `fixtures`: deterministic package fixtures used by core/API tests.

## Clinical caution

Every report includes the canonical disclaimer:

> This result is a screening and estimation output. It is not a complete eye health examination.

Recommendation rules are intentionally conservative: red flags dominate other
signals, unsupported protocol versions fail validation, missing consent blocks
storage/review, and low or invalid reliability recommends repeat/invalid results.

## Development

From the repository root:

```bash
poetry install
pnpm api:test
pnpm api:lint
poetry run mypy packages/api-core/src
```

Package-only checks:

```bash
poetry check -C packages/api-core
poetry run pytest packages/api-core/tests
poetry run ruff check packages/api-core
```
