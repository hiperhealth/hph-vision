# MVP Release Checklist

This document details the checks required before tagging and publishing the first MVP release of `hphvision` (`@hiperhealth/hphvision-lib` and `@hiperhealth/hphvision-mobile`).

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

## 2. Package Build Checks

- [ ] Build the shared clinical library package:
  ```bash
  yarn workspace @hiperhealth/hphvision-lib build
  ```
- [ ] Verify the build artifacts output in `packages/mobile-lib/dist` exists and contains correct type declarations (`.d.ts`).
- [ ] Verify package dependencies are correctly defined in `packages/mobile/package.json` pointing to the newly built library.

## 3. Safety-Critical Flow Checks

- [ ] **Disclaimer Consent:** Verify the app does not allow proceeding past `DisclaimerScreen` without accepting consent (`consentAccepted: true`).
- [ ] **Triage Red Flags:** Verify that answering "Yes" to any safety red flag in `TriageScreen` correctly halts progression and shows the safety blocking layout instead of navigating to calibration or testing.
- [ ] **Accessibility (Acuity Screen):** Verify that the tumbling E optotype uses the dynamic screen-reader labels:
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

## 7. Release & Publishing Steps

1. Bump package version in the root `package.json` and package subdirectories.
2. Publish the shared library package first:
   ```bash
   cd packages/mobile-lib
   npm publish
   ```
3. Tag the release commit:
   ```bash
   git tag -a v0.1.0-mvp -m "MVP Release v0.1.0"
   git push origin v0.1.0-mvp
   ```

## 8. Rollback Plan

In case of failure post-release:

- Revert the tag locally and on GitHub.
- Publish a patch version containing the hotfix or revert.
