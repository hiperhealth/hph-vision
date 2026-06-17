# hphvision Mobile App Plan

## Package

```text
Package: @hiperhealth/hphvision
Path: packages/mobile
Platform: React Native
Role: deployable Android/iOS application
Depends on: @hiperhealth/hphvision-lib
```

This plan is extracted and expanded from `docs/plans/general-plan.md`. It focuses only on the mobile application package: UI, native integration, navigation, user workflows, app state, device permissions, local persistence, API integration, and mobile release readiness.

---

## 1. Product Purpose

The mobile app is the patient-facing React Native application for guided smartphone-based vision screening and eyeglass-prescription estimation.

The app should guide a user through:

1. onboarding,
2. safety triage,
3. device detection and calibration,
4. cardboard visor/template generation,
5. visual-acuity testing,
6. guided subjective refraction estimation,
7. voice or touch response capture,
8. result review,
9. PDF report export,
10. optional clinician-review handoff.

The app must clearly communicate that its output is a screening and estimation result, not a complete eye-health examination or final prescription.

---

## 2. Primary Responsibilities

The mobile app owns all concerns that are specific to the deployable app experience.

### 2.1 In Scope

- React Native app shell.
- Android and iOS native projects.
- App navigation.
- Screens and user flows.
- App-specific state orchestration.
- Runtime permissions.
- Device information collection.
- Camera, speech, audio, sensor, filesystem, and sharing integrations.
- Calling reusable algorithms from `@hiperhealth/hphvision-lib`.
- Calling backend HTTP APIs exposed by `hph-vision-api`.
- Rendering templates and reports to PDF.
- Persisting local draft sessions.
- Handling offline/incomplete sessions.
- Accessibility and localization UX.
- App-store/mobile deployment preparation.

### 2.2 Out of Scope

These concerns should not be implemented directly inside the app unless there is a strong app-specific reason:

- reusable acuity scoring algorithms,
- reusable refraction state machines,
- reusable template geometry generation,
- reusable domain TypeScript types,
- reusable reliability scoring,
- backend business logic,
- FastAPI route logic,
- clinical data persistence on the server.

Those belong in `@hiperhealth/hphvision-lib`, `hph-vision-api`, or `hph-vision-core`.

---

## 3. Monorepo Location and Commands

### 3.1 Package Location

```text
packages/mobile/
├── package.json
├── app.json
├── index.js
├── App.tsx
├── src/
├── __tests__/
├── android/
├── ios/
├── metro.config.js
├── babel.config.js
├── jest.config.js
└── tsconfig.json
```

### 3.2 Root Commands

Run these from the repository root:

```bash
yarn install
yarn mobile:start
yarn mobile:android
yarn mobile:ios
yarn mobile:lint
yarn mobile:test
yarn mobile:typecheck
```

### 3.3 Android Studio

Open this folder directly in Android Studio:

```text
packages/mobile/android
```

Do not open the repository root as the Android project.

The app's Android Gradle configuration resolves React Native dependencies from root `node_modules`:

```gradle
react {
    root = file("../..")
    reactNativeDir = file("../../../../node_modules/react-native")
    codegenDir = file("../../../../node_modules/@react-native/codegen")
    cliFile = file("../../../../node_modules/react-native/cli.js")
}
```

Local SDK configuration remains untracked:

```text
packages/mobile/android/local.properties
```

---

## 4. High-Level App Architecture

The app should be organized around feature modules and flow orchestration.

Recommended source layout:

```text
packages/mobile/src/
├── app/
│   ├── AppProvider.tsx
│   ├── navigation/
│   ├── routes.ts
│   └── startup.ts
├── features/
│   ├── onboarding/
│   ├── triage/
│   ├── device-calibration/
│   ├── template-generation/
│   ├── visor-assembly/
│   ├── acuity-test/
│   ├── refraction-test/
│   ├── results/
│   ├── reporting/
│   ├── clinician-review/
│   └── settings/
├── integrations/
│   ├── api/
│   ├── audio/
│   ├── camera/
│   ├── device-info/
│   ├── filesystem/
│   ├── sensors/
│   ├── sharing/
│   ├── speech-recognition/
│   └── text-to-speech/
├── components/
│   ├── layout/
│   ├── forms/
│   ├── feedback/
│   ├── testing/
│   └── accessibility/
├── state/
│   ├── appStore.ts
│   ├── sessionStore.ts
│   └── persistence.ts
├── theme/
├── i18n/
├── utils/
└── test-utils/
```

### 4.1 Dependency Rules

```text
screens/features
  -> mobile app services/integrations
  -> @hiperhealth/hphvision-lib
  -> React Native/native modules
```

The app may import from `@hiperhealth/hphvision-lib`:

```ts
import {
  createAcuitySession,
  scoreAcuityResponse,
} from '@hiperhealth/hphvision-lib';
```

The app should not import from:

```text
hph_vision_api
hph_vision_core
packages/restapi
packages/api-core
```

Backend communication must happen through HTTP clients in `src/integrations/api`.

---

## 5. User Flow Map

### 5.1 Full MVP Flow

```text
App Launch
  -> Startup Checks
  -> Consent / Disclaimer
  -> Onboarding
  -> Safety Triage
  -> Device Detection
  -> Device Calibration
  -> Template Generation
  -> Print / Share Template
  -> Visor Assembly Instructions
  -> Environment Check
  -> Acuity Practice
  -> Right Eye Acuity
  -> Left Eye Acuity
  -> Refraction Practice
  -> Right Eye Refraction
  -> Left Eye Refraction
  -> Reliability Review
  -> Results
  -> PDF Report
  -> Clinician Review Export
```

### 5.2 Minimal Early Development Flow

To ship incrementally, the first internal build can implement:

```text
App Launch
  -> Disclaimer
  -> Basic Onboarding
  -> Manual Device Dimensions
  -> Template Preview
  -> Static Acuity Prototype
  -> Basic Result Summary
```

This allows the team to validate app navigation, Metro monorepo resolution, and early UX without waiting for the full algorithms.

---

## 6. Screen-Level Plan

### 6.1 Startup Screen

Purpose:

- initialize app services,
- load local session state,
- detect first-run status,
- verify required native capabilities,
- route user to the correct next screen.

Checks:

- app version,
- saved incomplete session,
- local storage availability,
- backend availability if online,
- required permissions status,
- language preference.

Acceptance criteria:

- app can launch offline,
- app can resume incomplete session,
- startup failures show actionable recovery messages.

### 6.2 Disclaimer and Consent Screen

Purpose:

- explain clinical limitations,
- collect acknowledgement,
- document that results are screening/estimation only.

Required text summary:

```text
This result is a screening and estimation output. It is not a complete eye health examination.
```

Acceptance criteria:

- user must acknowledge before testing,
- acknowledgement is stored with session metadata,
- text is accessible and localizable.

### 6.3 Onboarding Screens

Collect:

- age range,
- current glasses/contact lens use,
- previous prescription availability,
- reason for testing,
- preferred language,
- voice interaction preference,
- clinician-review preference.

Design notes:

- split into short screens,
- avoid long medical forms initially,
- allow skipping non-critical fields,
- use plain-language explanations.

Data output:

```ts
type OnboardingAnswers = {
  ageRange?: string;
  currentGlasses?: boolean;
  contactLensUse?: boolean;
  hasPreviousPrescription?: boolean;
  testingReason?: string;
  preferredLanguage: string;
  voiceEnabled: boolean;
};
```

### 6.4 Safety Triage Screens

Screen for red flags:

- sudden vision loss,
- eye pain,
- flashes or floaters,
- double vision,
- recent eye trauma,
- severe redness,
- known glaucoma,
- diabetes-related eye disease risk,
- recent eye surgery.

Behavior:

- if no red flags: continue,
- if red flags: stop self-test flow and recommend professional evaluation,
- store triage result in session.

Acceptance criteria:

- red-flag branch prevents testing,
- red-flag recommendation is clear and prominent,
- triage result appears in exported report.

### 6.5 Device Detection Screen

Purpose:

- identify phone model,
- use library device-profile matching,
- show detected model to user for confirmation.

Possible app integrations:

- device manufacturer,
- model name,
- OS version,
- screen pixel dimensions,
- pixel density,
- safe area/notch approximation.

Fallback:

- manual manufacturer/model search,
- manual dimensions entry.

Acceptance criteria:

- app works when automatic detection is unavailable,
- user can override detected device,
- selected profile is saved in session.

### 6.6 Device Calibration Screens

Purpose:

- confirm or refine phone physical dimensions,
- reduce template fit errors,
- estimate screen active area and center.

MVP calibration modes:

1. profile-based confirmation,
2. manual dimensions entry,
3. print-scale verification after PDF generation.

Future calibration modes:

1. camera-based calibration with reference card,
2. screen ruler calibration,
3. user-guided notch/punch-hole adjustment.

Acceptance criteria:

- user can enter body width, height, and thickness in millimeters,
- validation prevents impossible dimensions,
- calibration confidence is tracked.

### 6.7 Template Generation Screen

Purpose:

- generate cardboard visor/support template,
- preview fit and print pages,
- export/share PDF.

Inputs:

- selected `DeviceProfile`,
- `TemplateOptions`,
- paper size: `A4` or `LETTER`,
- cardboard thickness,
- desired eye-to-screen distance.

The app should call `@hiperhealth/hphvision-lib` for geometry:

```ts
const template = generateTemplateDocument(phoneGeometry, templateOptions);
```

The app owns PDF rendering and sharing:

```text
TemplateDocument -> React Native PDF renderer -> file -> share/print
```

Acceptance criteria:

- generated PDF includes calibration square,
- generated PDF includes assembly instructions,
- user can share or save PDF,
- template metadata is attached to session.

### 6.8 Visor Assembly Instructions

Purpose:

- help the user assemble the cardboard template correctly,
- reduce poor-quality tests due to bad assembly.

UX requirements:

- step-by-step screens,
- illustrations or preview images,
- safety notes for cutting/folding,
- final fit-check checklist.

Checklist examples:

- phone fits snugly,
- cut/fold lines are aligned,
- calibration square measured correctly,
- eye window is unobstructed,
- phone is not tilted,
- screen is clean.

### 6.9 Environment Check Screen

Purpose:

- verify conditions before testing.

Signals:

- ambient light,
- screen brightness,
- phone orientation,
- approximate tilt,
- audio output readiness,
- microphone readiness if voice mode enabled.

MVP behavior:

- show manual checklist if sensors are unavailable,
- warn but do not block unless a condition is critical.

Acceptance criteria:

- environment warnings are saved to session,
- warnings affect reliability score,
- user can retry checks.

### 6.10 Acuity Test Screens

Purpose:

- run visual acuity workflow using optotypes and scoring from `@hiperhealth/hphvision-lib`.

MVP optotypes:

- Tumbling E,
- Landolt C.

Screen requirements:

- high-contrast optotype display,
- controlled background,
- one-eye-at-a-time instructions,
- practice trials,
- randomized orientation,
- touch answer fallback,
- voice answer support,
- progress indicator,
- pause/stop controls.

Touch responses:

```text
up
down
left
right
I don't know
repeat
stop
```

Voice responses:

```text
up
down
left
right
repeat
stop
I don't know
```

Acceptance criteria:

- answers are recorded with timestamps,
- wrong/right answers are not shown in a way that biases testing,
- incomplete tests can be resumed or discarded,
- session stores reliability signals.

### 6.11 Refraction Test Screens

Purpose:

- run guided subjective refraction estimation.

Prompt forms:

```text
Is this better, worse, or the same?
Which is clearer: option one or option two?
```

Screen requirements:

- present controlled stimuli,
- alternate comparison options,
- support voice and touch responses,
- allow repeated question,
- track inconsistent answers,
- display clear stop/pause controls.

MVP output:

- spherical equivalent estimate,
- sphere range,
- cylinder range,
- axis range,
- confidence score,
- reliability warnings.

Acceptance criteria:

- results are visibly marked as estimates,
- low confidence results are not over-presented,
- contradictory answers generate warnings.

### 6.12 Results Screen

Purpose:

- summarize completed tests,
- show confidence and warnings,
- provide next-step recommendation.

Display:

- visual acuity result per eye,
- estimated refractive error per eye,
- confidence/reliability score,
- warnings,
- clinician-review recommendation,
- disclaimer.

Safety behavior:

- do not present output as final prescription,
- use cautious wording,
- route red-flag or low-confidence cases to professional review.

### 6.13 Report Generation Screen

Purpose:

- generate shareable report PDF.

Report includes:

- patient/session metadata,
- device used,
- whether template/visor was used,
- visual acuity result,
- refraction estimate,
- reliability score,
- warnings,
- clinician-review recommendation,
- disclaimer.

Acceptance criteria:

- PDF can be generated offline,
- PDF file can be shared,
- PDF includes session ID and timestamp,
- report content matches displayed result.

### 6.14 Clinician Review Export

Purpose:

- prepare results for remote clinician review.

MVP export options:

- PDF share,
- JSON session export for debugging/validation,
- backend upload if authenticated and online.

Future options:

- clinician dashboard integration,
- encrypted submission,
- status tracking,
- messaging.

### 6.15 Settings

Settings should include:

- language,
- voice mode,
- units,
- paper size default,
- accessibility preferences,
- privacy/data controls,
- clear local data,
- about and version info.

---

## 7. App State and Session Model

### 7.1 Session Lifecycle

```text
created
  -> consented
  -> onboarded
  -> triaged
  -> calibrated
  -> templateGenerated
  -> testingStarted
  -> testingCompleted
  -> reportGenerated
  -> exported
  -> archived
```

Sessions can also enter:

```text
blockedByTriage
cancelled
incomplete
invalid
```

### 7.2 Local Session State

The app should persist enough data to resume an interrupted session.

Recommended persisted data:

- session ID,
- app version,
- consent acknowledgement,
- onboarding answers,
- triage answers,
- device profile,
- calibration inputs,
- template metadata,
- test progress,
- raw responses,
- environment warnings,
- final results,
- generated report file references.

Avoid storing unnecessary personally identifying information in early MVP builds.

### 7.3 State Management Approach

Use a predictable state approach. Options:

- lightweight store for app/session state,
- state-machine library for protocol flows,
- reducer-based flow state if avoiding new dependencies.

The protocol flow should be deterministic and testable. Each transition should have:

- current state,
- event,
- guard conditions,
- next state,
- side effects.

Example transition:

```ts
type FlowEvent =
  | {type: 'CONSENT_ACCEPTED'}
  | {type: 'TRIAGE_COMPLETED'; result: TriageResult}
  | {type: 'DEVICE_PROFILE_SELECTED'; profileId: string}
  | {type: 'ACUITY_RESPONSE_RECORDED'; responseId: string}
  | {type: 'SESSION_CANCELLED'};
```

---

## 8. Native Integrations

### 8.1 Device Information

Required:

- manufacturer,
- model,
- OS,
- screen dimensions,
- pixel density.

Used for:

- device-profile matching,
- template sizing,
- debugging,
- validation analytics.

### 8.2 Camera

MVP:

- not required for first static template and acuity flow.

Future:

- reference-object calibration,
- alignment verification,
- assembly verification,
- distance/position assistance.

### 8.3 Sensors

Potential sensors:

- accelerometer,
- gyroscope,
- light sensor where available.

Used for:

- phone tilt warnings,
- environment checks,
- reliability scoring.

### 8.4 Audio and Text-to-Speech

The app should provide voice guidance for hands-free use.

Capabilities:

- speak prompts,
- repeat instructions,
- control volume expectations,
- support multilingual prompt strings.

### 8.5 Speech Recognition

Voice recognition should use constrained commands, not open dictation.

Command set:

```text
better
worse
same
one
two
left
right
up
down
repeat
stop
I don't know
```

The app should map recognized utterances into command enums from `@hiperhealth/hphvision-lib` where possible.

### 8.6 Filesystem and Sharing

Used for:

- generated cardboard template PDFs,
- generated result PDFs,
- JSON session exports,
- debug logs in development builds.

Files should be stored in app-private storage unless user explicitly shares them.

---

## 9. API Integration

The app should communicate with `hph-vision-api` through a typed HTTP client.

Recommended layout:

```text
src/integrations/api/
├── client.ts
├── endpoints.ts
├── errors.ts
├── healthApi.ts
├── sessionsApi.ts
└── reportsApi.ts
```

### 9.1 Initial Endpoints

MVP backend integration can start with:

```text
GET /health
```

Future endpoints:

```text
POST /sessions
GET /sessions/{id}
POST /sessions/{id}/reports
POST /clinician-review/submissions
GET /clinician-review/submissions/{id}
```

### 9.2 Offline Behavior

The app should be usable offline for:

- onboarding,
- triage,
- device calibration,
- template generation,
- local testing,
- local report generation.

Online access is needed for:

- backend upload,
- clinician review,
- server-side account sync,
- server-side analytics if enabled.

Offline submissions should be queued only after explicit user consent.

---

## 10. Accessibility and Localization

### 10.1 Accessibility

Requirements:

- large touch targets,
- high-contrast UI,
- screen-reader labels,
- non-color-only indicators,
- voice and touch alternatives,
- clear progress and stop controls,
- simple language.

Special consideration: users may have impaired vision. The UI must not assume normal acuity.

### 10.2 Localization

Localize:

- onboarding labels,
- triage questions,
- voice prompts,
- test instructions,
- result explanations,
- disclaimers,
- errors.

Voice command recognition should support locale-specific synonyms mapped into canonical command values.

---

## 11. Security, Privacy, and Safety

### 11.1 Safety Principles

- never claim to diagnose disease,
- never present estimates as final prescription,
- stop testing on red flags,
- display clear uncertainty,
- preserve warnings in reports,
- recommend clinician review for low-confidence cases.

### 11.2 Privacy Principles

- collect minimal data,
- keep local data local unless user chooses export/upload,
- avoid storing unnecessary personal identifiers,
- clearly explain export behavior,
- make local data deletion available.

### 11.3 Auditability

Each result should be reproducible from stored session data:

- protocol version,
- library version,
- app version,
- device profile,
- template options,
- raw answers,
- environment warnings,
- scoring output.

---

## 12. Testing Strategy

### 12.1 Unit Tests

Test:

- screen utility functions,
- mappers from app inputs to library models,
- API client error handling,
- storage serialization,
- navigation guards.

### 12.2 Component Tests

Test:

- onboarding forms,
- triage branching,
- template option forms,
- acuity response controls,
- refraction response controls,
- results summary,
- report disclaimer display.

### 12.3 Flow Tests

Test full app flows:

- happy-path screening,
- red-flag triage stop,
- manual device calibration fallback,
- voice disabled touch-only mode,
- interrupted session resume,
- low-confidence result path,
- offline report generation.

### 12.4 Native/Platform Tests

Android:

```bash
cd packages/mobile/android
./gradlew assembleDebug
```

React Native:

```bash
yarn mobile:test
yarn mobile:typecheck
yarn mobile:lint
```

### 12.5 Manual QA Checklist

- app launches on emulator,
- app launches on physical Android device,
- Metro resolves `@hiperhealth/hphvision-lib`,
- Android Studio opens `packages/mobile/android`,
- permissions prompts are understandable,
- generated PDFs open correctly,
- share sheet works,
- back navigation does not corrupt test state,
- stop/cancel controls are always available during testing.

---

## 13. Implementation Milestones

### Milestone 0 — Monorepo App Baseline

Goals:

- confirm app package runs from `packages/mobile`,
- confirm Android Studio compatibility,
- confirm Metro resolves the library workspace.

Tasks:

- keep `metro.config.js` monorepo-aware,
- keep Android Gradle paths pointed at root `node_modules`,
- import one value from `@hiperhealth/hphvision-lib`,
- run app on Android emulator.

Acceptance criteria:

- `yarn mobile:start` works,
- `yarn mobile:android` works locally,
- Android Studio can sync Gradle from `packages/mobile/android`.

### Milestone 1 — App Shell and Navigation

Tasks:

- replace copied app screens with hphvision app shell,
- define route names,
- create layout components,
- add theme and typography,
- add disclaimer screen,
- add placeholder screens for all MVP steps.

Acceptance criteria:

- user can navigate through the skeleton flow,
- disclaimer is mandatory before testing,
- app has no references to old copied project branding.

### Milestone 2 — Onboarding and Triage

Tasks:

- implement onboarding forms,
- implement safety triage questions,
- implement red-flag blocking path,
- persist onboarding and triage answers.

Acceptance criteria:

- red-flag answers prevent testing,
- non-red-flag answers proceed to calibration,
- saved state survives app restart.

### Milestone 3 — Device Detection and Manual Calibration

Tasks:

- add device-info integration,
- match detected device to library profiles,
- implement manual fallback,
- validate physical dimensions.

Acceptance criteria:

- user can confirm or override device,
- manual dimensions feed template generation,
- invalid dimensions show clear errors.

### Milestone 4 — Template Preview and PDF Export

Tasks:

- call library template generator,
- render preview,
- generate PDF,
- save/share PDF,
- show print-scale verification guidance.

Acceptance criteria:

- A4 and US Letter templates export,
- PDF includes calibration square,
- template metadata is stored in session.

### Milestone 5 — Acuity Prototype

Tasks:

- implement acuity practice screen,
- display randomized optotypes,
- capture touch responses,
- call library scoring,
- show basic result.

Acceptance criteria:

- right/left eye flows run independently,
- raw responses are saved,
- result includes reliability warnings.

### Milestone 6 — Voice Guidance and Voice Responses

Tasks:

- add text-to-speech prompts,
- add speech recognition command mapping,
- add confidence thresholds,
- add touch fallback.

Acceptance criteria:

- user can complete a simple acuity flow hands-free,
- low-confidence recognition asks user to repeat,
- voice can be disabled.

### Milestone 7 — Refraction Prototype

Tasks:

- implement better/worse/same screens,
- implement one/two comparison screens,
- call library refraction state machine,
- show estimate ranges and confidence.

Acceptance criteria:

- refraction result is marked as estimate,
- contradictory answers reduce confidence,
- low-confidence cases recommend clinician review.

### Milestone 8 — Results and Report PDF

Tasks:

- build final results screen,
- generate report PDF,
- include disclaimers,
- include warnings and reliability score,
- enable share/export.

Acceptance criteria:

- report matches app results,
- report includes device/template metadata,
- report includes clinical limitation statement.

### Milestone 9 — Backend Upload / Clinician Review Handoff

Tasks:

- add API client,
- call health endpoint,
- add authenticated or anonymous submission model,
- upload session/report only with user consent.

Acceptance criteria:

- offline mode still works,
- failed uploads can be retried,
- user understands what is shared.

### Milestone 10 — Pre-Validation Hardening

Tasks:

- improve accessibility,
- improve localization,
- add QA fixture sessions,
- add crash/error boundaries,
- add analytics only if privacy-reviewed,
- prepare internal validation builds.

Acceptance criteria:

- app is ready for controlled engineering/usability validation,
- known limitations are documented,
- clinician-facing disclaimers are present.

---

## 14. Risks and Mitigations

| Risk                                             | Mitigation                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| Users misunderstand result as final prescription | Mandatory disclaimer, cautious language, clinician-review recommendation |
| Poor template print scale                        | Calibration square, print instructions, fit-check workflow               |
| Bad lighting or unstable phone position          | Environment warnings, reliability scoring, retest recommendation         |
| Voice recognition errors                         | Constrained vocabulary, confidence thresholds, touch fallback            |
| Android Studio fails in monorepo                 | Open `packages/mobile/android`, keep Gradle paths documented and tested  |
| Duplicate React Native dependency                | Keep library peer dependencies, use root Yarn workspaces                 |
| Interrupted test loses data                      | Local session persistence after each important step                      |
| Backend unavailable                              | Offline-first local testing and report generation                        |

---

## 15. Definition of Done for MVP Mobile App

The MVP mobile app is complete when:

- Android app runs from the monorepo structure,
- user can complete onboarding and safety triage,
- red flags block the self-test flow,
- user can select or manually enter device dimensions,
- app can generate and share a cardboard template PDF,
- app can run a guided visual-acuity test,
- app can run a guided subjective refraction-estimation prototype,
- app supports voice prompts and touch fallback,
- app generates a screening report PDF,
- results include confidence and warnings,
- all result screens and PDFs include clinical limitation language,
- local sessions can resume after interruption,
- `yarn mobile:lint`, `yarn mobile:typecheck`, and `yarn mobile:test` pass in CI.
