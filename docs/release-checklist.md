# MVP Release Checklist

Use this checklist before preparing an MVP release. It is an engineering and
release-readiness checklist, **not** evidence of clinical validation. HPH Vision
is an informational vision-screening and subjective-refraction-support product;
it does not autonomously diagnose, prescribe, or authorize the manufacture or
purchase of corrective lenses. Review the [clinical and engineering validation
plan](clinical-validation.md) and [regulatory and safety
notes](regulatory-notes.md) separately before any release decision.

## 1. Scope and prerequisites

- [ ] Confirm the release targets. `@hiperhealth/hphvision-lib` is the only npm
      package. `hph-vision-core` and `hph-vision-api` are the Python packages. The
      private `@hiperhealth/hphvision` React Native app is versioned for native
      builds, but is not an npm publishing target.
- [ ] Use the repository package manager: Yarn 3.6.4 (`packageManager` in the
      root `package.json`), not npm or pnpm. Install the locked JavaScript
      dependencies and Python environment:

  ```bash
  yarn install --immutable
  poetry check
  poetry install
  ```

- [ ] Start from an up-to-date `main` with a clean worktree. Record the commit
      SHA and the candidate version proposed by semantic-release.

## 2. Automated engineering gates

Run these from the repository root and retain their output with the release
record. `makim all.typecheck` covers TypeScript and Python mypy; `makim
all.test` runs the mobile, shared-library, and Python API suites.

- [ ] Type checks:

  ```bash
  makim all.typecheck
  ```

- [ ] Tests:

  ```bash
  makim all.test
  ```

- [ ] Lint and pre-commit checks. `yarn lint` is the explicit workspace lint
      command. Pre-commit also checks Markdown formatting and the configured
      TypeScript/Python hooks; inspect and commit any formatting correction it
      makes before rerunning it.

  ```bash
  yarn lint
  pre-commit run --all-files
  ```

- [ ] Build the releasable Python packages and type-check both TypeScript
      workspaces:

  ```bash
  makim all.build
  ```

- [ ] Generate the API documentation and static documentation tree:

  ```bash
  makim docs.build
  ```

- [ ] Validate package metadata and the npm package contents:

  ```bash
  makim api-core.check
  makim restapi.check
  yarn workspace @hiperhealth/hphvision-lib pack --out dist/hphvision-lib.tgz
  ```

  Confirm that the resulting `packages/mobile-lib/dist/hphvision-lib.tgz`
  contains the source entry points declared by
  `packages/mobile-lib/package.json` (`src/index.ts`). The mobile app declares `@hiperhealth/hphvision-lib` with `workspace:*` in `packages/mobile/package.json`.

## 3. Current automated-coverage review

Do not interpret a green suite as end-to-end or clinical validation. Confirm
that the candidate changes have appropriate coverage in the following current
suites, and add focused tests when they change their corresponding behavior.

| Area                          | Current automated evidence                                                                                                                                                                             | Release interpretation                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| State-machine primitives      | `packages/mobile-lib/src/state-machines/__tests__/stateMachine.test.ts` covers transitions, invalid transitions, actions, replay, and snapshot restore.                                                | Pure library behavior only; the machines are not connected to React Native route state.               |
| Onboarding and triage         | `packages/mobile-lib/src/triage/__tests__/rules.test.ts` covers red-flag blocking and recommendations.                                                                                                 | The app's normal triage path must still be checked manually; there is no route-level end-to-end test. |
| Visual acuity                 | `packages/mobile-lib/src/acuity/__tests__/acuity.test.ts` covers protocol/scoring, rendering, both-eye library flow, and flow restore.                                                                 | This does not validate the physical display, calibration, or mobile route integration.                |
| Subjective refraction         | `packages/mobile-lib/src/refraction/__tests__/` covers estimation, normalization, contradiction and confidence handling, both-eye flow, aborts, and restore.                                           | The shared flow is not the current mobile-screen implementation.                                      |
| Reliability and confidence    | `packages/mobile-lib/src/reliability/__tests__/reliability.test.ts` and refraction-flow tests cover scores and warnings.                                                                               | Sensor inputs used by the mobile prototype remain non-measured values.                                |
| Serialization and restore     | `packages/mobile-lib/src/session/__tests__/session.test.ts`, acuity tests, state-machine tests, and refraction-flow tests cover JSON round trips/restoration.                                          | The app does not durably restore a session after restart.                                             |
| Template generation           | `packages/mobile-lib/src/template-generator/__tests__/geometry.test.ts` includes geometry and snapshot coverage.                                                                                       | It validates a template document, not a native PDF or a physical print.                               |
| Test session and report model | `packages/mobile-lib/src/session/__tests__/session.test.ts` covers session serialization and validation; `packages/mobile-lib/src/reporting/__tests__/reporting.test.ts` covers the report disclaimer. | The mobile report export remains a preview/share stub.                                                |
| Mobile shell                  | `packages/mobile/__tests__/App.test.tsx` renders the app.                                                                                                                                              | It is not a route, accessibility, device, or emulator smoke test.                                     |

## 4. Safety and mobile smoke checks

Run these checks on a physical device or emulator after the automated gates.
They are release gates, not proof of clinical performance.

- [ ] Start Metro and launch the native app using the supported workspace
      commands:

  ```bash
  yarn mobile:start
  # In a separate terminal with an Android emulator or device available:
  yarn mobile:android
  ```

- [ ] On a fresh session, verify that the normal Continue action on
      `DisclaimerScreen` records consent before navigating to onboarding. Also
      verify the displayed screening disclaimer remains visible and unambiguous.
      **Known gap:** `sessionStore` currently has no centralized navigation guard,
      so this is not yet proof that every programmatic route can be blocked without
      consent.
- [ ] Answer every triage question. Verify that a positive red flag and an
      unanswered response block the normal self-test path and route to result
      guidance; verify that all-negative answers alone continue to device
      calibration. Treat any route bypass of that policy as a release blocker.
- [ ] Verify the Tumbling E control announces its changing orientation through
      the accessibility label. Check the physical calibration entry and visor
      checklist, including the printed 50 mm calibration square, at 100% print
      scale.
- [ ] Exercise the normal non-blocking route sequence:

  ```text
  disclaimer -> onboarding -> triage -> deviceCalibration -> templateGeneration
  -> visorAssembly -> acuityTest -> refractionTest -> results -> reporting
  ```

  Confirm that the current screens clearly label the acuity and refraction
  prototypes and surface their warnings. `clinicianReview` and `settings` are
  additional routes, not part of this primary self-test sequence.

## 5. Template and report release gates

- [ ] Inspect the generated template document's page size, dimensions,
      calibration marks, cut/fold guidance, and device profile. The shared-library
      geometry test is not a physical-print validation; perform the manual 100%
      print and measurement check above for any build claiming physical use.
- [ ] Verify the report model has the expected onboarding context, triage
      result, visual-acuity result, subjective-refraction estimate, reliability
      warnings, and screening disclaimer for the exercised session.
- [ ] **Do not mark native PDF checks complete for the current implementation.**
      `createTemplatePreviewFile` and `createReportPreviewFile` return in-memory
      preview stubs; native PDF rendering, print/save output, and a real report
      upload are not implemented. Consequently, no current release may claim
      validated template or report PDF dimensions/content.

## 6. Known MVP limitations and release decision

Review the following against the candidate. These limitations are described in
more detail in the [clinical and engineering validation
plan](clinical-validation.md).

- [ ] The shared state-machine and subjective-refraction flow models support
      both-eye sequencing and serialization, but the React Native refraction
      screen remains a right-eye, touch-response prototype and does not consume
      that newer flow model. The acuity screen also begins with a right-eye
      prototype sequence.
- [ ] The app has no durable persistence or restart recovery. It has no
      offline queue, automatic synchronization, or configured screening-report
      upload, although shared-library serializers have unit coverage.
- [ ] Camera/lux, tilt, sensor, and speech-recognition integrations are stubs;
      manual checks and touch responses are used instead. Reliability values in the
      current results screen include prototype rather than native sensor inputs.
- [ ] Native template/report PDF rendering, physical printing, and file/share
      integrations are stubs. Do not claim that their output was validated.
- [ ] Engineering checks and proposed validation targets do not establish
      clinical accuracy, diagnostic performance, or prescribing suitability. No
      autonomous diagnosis, treatment decision, or corrective-lens purchase may
      rely solely on an application estimate.

Document the release decision for each limitation. If the intended MVP scope
requires a capability that is still a prototype or stub, keep the release
blocked until the capability and its validation evidence exist.

## 7. CI, publishing, and rollback

- [ ] Confirm that the candidate passed the current pull-request workflows.
      `main.yaml` runs Python API tests and mypy on Python 3.11–3.14, mobile and
      mobile-library Jest tests/type checks, and the pre-commit lint job.
      `docs.yaml` runs `makim docs.build` when relevant documentation or Python
      API files change. These workflows do **not** run the release build or native
      device smoke tests, so retain the manual evidence from this checklist.
- [ ] Confirm the Conventional Commit history supports the intended
      semantic-release version. On pushes to `main`, `release.yaml` performs
      `makim release.dry-run`; it does not publish artifacts. A maintainer must
      manually dispatch the Release workflow on `main` to run `makim release.ci`,
      publish the Python and npm packages, generate documentation, and publish the
      configured GitHub release assets.
- [ ] After publishing, verify the expected artifacts only:
      `hph-vision-core`, `hph-vision-api`, and `@hiperhealth/hphvision-lib`.
- [ ] For a rollback or hotfix, prepare and merge a Conventional Commit revert
      or fix, rerun this checklist, and manually dispatch the Release workflow
      after CI passes. Do not claim that a push automatically publishes a patch;
      the current workflow only dry-runs on push.

## 8. Issue #45 acceptance mapping

| Issue #45 acceptance criterion    | Checklist evidence                                                                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release checklist exists          | This document: `docs/release-checklist.md`.                                                                                                                                       |
| Covers core package               | Sections 1–3 and 7 identify and validate `hph-vision-core` and `hph-vision-api`.                                                                                                  |
| Covers mobile package             | Sections 1–5 validate `@hiperhealth/hphvision-lib` and the private `@hiperhealth/hphvision` mobile app.                                                                           |
| Covers safety-critical flows      | Sections 3–6 cover consent, triage blocking, accessibility, prototype limits, reporting, and the clinical/safety boundary.                                                        |
| Can be used before publishing MVP | Sections 1–2 and 7 provide executable gates, CI/publishing steps, release artifacts, and rollback procedure; Sections 5–6 make unresolved capabilities explicit release blockers. |
