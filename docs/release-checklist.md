# MVP Release Checklist

This document details the checks required before publishing the first MVP release of `hphvision` packages (`@hiperhealth/hphvision-lib` on npm, `hph-vision-core` / `hph-vision-api` on PyPI, and `@hiperhealth/hphvision` mobile app).

## 1. Repository & CI Checks

- [ ] Run typechecks and ensure clean compilation:
  ```bash
  yarn typecheck
  ```
- [ ] Run Javascript/Typescript test suites:
  ```bash
  yarn test
  ```
- [ ] Run Python API test suites:
  ```bash
  yarn api:test
  ```
- [ ] Run linter and formatting checks:
  ```bash
  yarn lint && yarn api:lint
  ```
- [ ] Verify that the conda development environment definition `conda/dev.yaml` matches current dependencies.

## 2. Package Validation Checks

- [ ] Verify typecheck passes cleanly for the shared clinical library package:
  ```bash
  yarn mobile-lib:typecheck
  ```
- [ ] Verify that `@hiperhealth/hphvision-lib` exposes valid TypeScript source entries directly from `src/index.ts` (the package does not use a separate `dist` compilation step).
- [ ] Verify package dependencies are correctly defined in `packages/mobile/package.json` pointing to `@hiperhealth/hphvision-lib` via workspace reference (`"workspace:*"`).

## 3. Safety-Critical Flow Checks

- [ ] **Disclaimer Consent:** Verify the app does not allow proceeding past `DisclaimerScreen` without accepting consent (`consentAccepted: true`).
- [ ] **Triage Red Flags:** Verify that answering "Yes" to any safety red flag in `TriageScreen` correctly halts progression and shows the safety blocking layout instead of navigating to calibration or testing.
- [ ] **Accessibility (Acuity Screen):** Verify that the tumbling E optotype uses dynamic screen-reader labels:
  - Accessibility label is active and reads the orientation direction (e.g., "Tumbling E pointing left").

## 4. Mobile App Smoke Tests

- [ ] **Launch Test:** Boot Metro and run the Android emulator:
  ```bash
  yarn mobile:start
  # (In a separate terminal)
  yarn mobile:android
  ```
- [ ] **Routing Validation:** Verify the user can successfully progress through the entire route loop: `disclaimer` -> `onboarding` -> `triage` -> `deviceCalibration` -> `templateGeneration` -> `visorAssembly` -> `acuityTest` -> `refractionTest` -> `results` -> `reporting`.
- [ ] **Calibration Check:** Verify physical calibration cards scale correctly according to manual millimeter offsets.

## 5. Document & PDF Verification Checks

- [ ] **Template PDF Verification:** Generate a cardboard visor template PDF and verify:
  - The document builds without errors.
  - The PDF outputs physical dimensions matching the calibrated device profile.
  - The cardboard cutout lines render with correct contrast and print guides.
- [ ] **Report PDF Verification:** Export a clinician screening report PDF and verify:
  - The document contains the correct patient age range and onboarding selections.
  - The right-eye visual acuity logMAR score and Snellen equivalent are printed.
  - The subjective refraction estimate (Sphere, Cylinder, Axis) is accurate.
  - The safety triage responses are highlighted.

## 6. Known MVP Limitations (Verification)

- [ ] Verify prototype warnings are clearly visible on:
  - `AcuityTestScreen` (acknowledging it only tests the right eye for now).
  - `RefractionTestScreen` (acknowledging it uses touch fallback inputs and does not support voice triggers).

## 7. Automated Release & Publishing Workflow

The repository utilizes an automated semantic-release pipeline (`makim release.ci`) triggered on `main` branch releases or manual dispatch.

1. Test semantic-release execution in dry-run mode locally or via CI:
   ```bash
   makim release.dry-run
   ```
2. Verify release outputs and target published artifacts:
   - **npm:** `@hiperhealth/hphvision-lib`
   - **PyPI:** `hph-vision-core` and `hph-vision-api`
3. Execute the release via GitHub Actions workflow or manually:
   ```bash
   makim release.ci
   ```

## 8. Rollback & Hotfix Plan

In case of failure post-release:

- Revert breaking commits on `main` and push to trigger automated patch release via semantic-release.
- Publish a patch release containing the hotfix.
