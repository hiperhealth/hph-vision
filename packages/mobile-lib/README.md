# @hiperhealth/hphvision-lib

Reusable TypeScript domain library for the hphvision React Native app.

This package owns deterministic, app-agnostic logic such as:

- safety triage questions and rules,
- device profile validation and matching,
- cardboard template geometry models,
- visual acuity protocol and scoring,
- subjective refraction protocol and scoring,
- reliability scoring,
- voice command normalization,
- session and report models.

It should not own React Navigation screens, native permissions, camera access,
filesystem writes, FastAPI code, or Python backend logic.

## Commands

Run from the repository root:

```bash
pnpm mobile-lib:lint
pnpm mobile-lib:typecheck
pnpm mobile-lib:test
```
