# hphvision — Technical Proposal

## Smartphone-Based Vision Screening and Prescription Estimation Platform

**Project name:** `hphvision`
**Meaning:** `hph` stands for **hiperhealth**
**Primary platform:** React Native
**Architecture:** Yarn + Poetry monorepo
**JavaScript workspace packages:**

```text
@hiperhealth/hphvision
@hiperhealth/hphvision-lib
```

**Python workspace packages:**

```text
hph-vision-api
hph-vision-core
```

---

## 1. Executive Summary

`hphvision` is a mobile health project for guided smartphone-based vision screening and eyeglass-prescription estimation.

The project will provide a React Native app that can guide a patient through visual acuity and refraction-related tests using the smartphone screen, voice prompts, speech recognition, and a printable cardboard support/visor generated according to the patient’s cellphone dimensions.

The goal is not to immediately replace a complete optometrist or ophthalmologist exam. The first goal is to provide a technically rigorous, validated, low-cost screening and prescription-estimation workflow that can support:

- remote vision screening,
- low-resource environments,
- self-monitoring,
- tele-optometry workflows,
- prescription renewal support,
- clinician review.

Scientific literature already supports the feasibility of smartphone-based visual acuity testing and related mobile vision-screening workflows. Validated tools such as Peek Acuity have shown accurate and repeatable visual-acuity measurements, and recent studies have explored smartphone-based refraction methods and mass screening in low-resource settings.

---

## 2. Product Vision

`hphvision` should become a reusable platform for smartphone-assisted eye screening.

The system should allow a patient to:

1. identify their smartphone model,
2. generate a printable PDF cardboard template adapted to that phone,
3. assemble a simple phone support or visor,
4. run guided vision tests,
5. answer using voice or touch,
6. receive a structured screening result,
7. export a clinician-friendly report.

The app should be positioned as:

> A smartphone-based guided vision-screening and prescription-estimation platform, supported by a dynamically generated cardboard visor template customized to the user’s phone dimensions.

---

## 3. Clinical and Research Background

### 3.1 Smartphone Visual Acuity Testing

Smartphone-based visual acuity testing has already been validated in research contexts. The Peek Acuity study in _JAMA Ophthalmology_ showed that a smartphone visual-acuity test could provide accurate and repeatable acuity measurements consistent with accepted test-retest variability for logMAR-style charts.

The same study compared Peek Acuity with ETDRS and Snellen-style testing, reporting strong correlations and small mean differences in controlled settings.

### 3.2 Mobile Apps for Visual-Function Assessment

A 2024 review in _Eye_ reported that many scientifically evaluated mobile apps can mimic traditional paper-based visual-function tests, while also noting that clinicians must verify app validity before clinical adoption because incorrect visual-function recording can have serious consequences.

A 2022 systematic review and meta-analysis in _JMIR mHealth and uHealth_ concluded that mobile visual-acuity apps can play an important role in identifying visual impairment by professionals and nonprofessionals, including self-testing contexts, while also recommending further research with larger samples and longer follow-up.

### 3.3 Smartphone-Based Refraction

Recent work has explored smartphone-based refraction. A 2024 _Journal of Optometry_ article proposed using smartphone blue-light stimuli to detect changes in visual acuity and spherical refraction, reporting a small mean difference between smartphone-based spherical over-refraction and clinical measurement in the tested setting.

A 2024 rural screening pilot also reported the use of smartphone apps for visual acuity, refractive error, and ocular alignment screening by nonprofessional personnel. The authors concluded that smartphone apps have potential for mass vision screening and low-cost vision care in geographically remote or resource-constrained areas.

---

## 4. Product Scope

### 4.1 MVP Scope

The MVP should include:

1. patient onboarding,
2. safety triage,
3. device detection,
4. manual and semi-automatic phone dimension calibration,
5. dynamic cardboard-template PDF generation,
6. visual-acuity testing,
7. guided subjective refraction estimation,
8. voice-guided testing,
9. touch fallback,
10. results PDF generation,
11. clinician-review export.

### 4.2 Out of Scope for MVP

The first version should not claim to replace a full eye exam.

The MVP should not include:

- autonomous diagnosis of ocular disease,
- retina/fundus imaging,
- glaucoma screening,
- diabetic retinopathy screening,
- pediatric autonomous prescription generation,
- fully automated camera-based prescription estimation,
- progressive/multifocal lens recommendation,
- final prescription without clinician review.

---

## 5. User Workflow

### 5.1 Onboarding

The app should collect:

- age range,
- current glasses/contact lens use,
- whether the user already has a prescription,
- reason for testing,
- device model,
- preferred language,
- voice interaction preference.

### 5.2 Safety Triage

Before starting any test, the app should screen for red flags:

- sudden vision loss,
- eye pain,
- flashes or floaters,
- double vision,
- recent eye trauma,
- severe redness,
- known glaucoma,
- diabetes-related eye disease risk,
- recent eye surgery.

If red flags are present, the app should stop the self-test flow and recommend professional evaluation.

### 5.3 Device Calibration

The app should identify the phone model and determine the dimensions required for the cardboard template.

Because mobile operating systems do not reliably expose full physical chassis dimensions, the app should combine:

1. automatic model detection,
2. a device-profile database,
3. user confirmation,
4. manual fallback,
5. optional camera-based calibration with a reference object.

### 5.4 PDF Cardboard Template Generation

The app should generate a printable PDF template according to the cellphone dimensions.

The generated template should help the user create a simple cardboard visor/support that holds the smartphone in a stable and reproducible position.

### 5.5 Test Execution

The user places the phone in the support and follows voice-guided instructions.

The app presents visual stimuli and asks questions such as:

- “Which direction is the E facing?”
- “Is option one or option two clearer?”
- “Is it better, worse, or the same?”
- “Can you read this symbol?”

The user can respond by voice or touch.

### 5.6 Results

The app generates:

- visual acuity result,
- estimated refractive error,
- confidence score,
- test-quality warnings,
- recommendation,
- PDF report.

---

## 6. Cardboard Template Generator

### 6.1 Purpose

The cardboard template is a central feature of `hphvision`.

Its role is to reduce variability in:

- eye-to-screen distance,
- phone angle,
- head position,
- hand tremor,
- one-eye-at-a-time occlusion,
- lighting interference.

This is important because smartphone vision testing depends heavily on controlled geometry and repeatability.

### 6.2 Template Requirements

The app should generate a PDF template adapted to:

- phone width,
- phone height,
- phone thickness,
- screen center,
- bezel/notch/punch-hole position,
- required eye-to-screen distance,
- cardboard thickness,
- page format.

Supported PDF formats:

```text
A4
US Letter
```

Optional future exports:

```text
SVG
DXF
PNG preview
```

### 6.3 Template Components

The generated template should include:

- phone holder slot,
- fold lines,
- cut lines,
- glue tabs,
- forehead support,
- nose cutout,
- eye window,
- monocular occlusion flap,
- alignment markers,
- calibration ruler,
- 50 mm print-scale verification square,
- phone fit-check outline,
- assembly instructions.

### 6.4 Template Generation Approach

The template should be generated from parametric geometry.

Instead of storing static templates, `@hiperhealth/hphvision-lib` should define a TypeScript geometry engine that produces vector paths from phone and template parameters. Backend-only validation and persistence helpers can live in the Python `hph-vision-core` package.

Example inputs:

```ts
type PhoneGeometry = {
  modelName: string;
  bodyWidthMm: number;
  bodyHeightMm: number;
  thicknessMm: number;
  screenWidthMm?: number;
  screenHeightMm?: number;
  screenOffsetXmm?: number;
  screenOffsetYmm?: number;
};

type TemplateOptions = {
  pageSize: 'A4' | 'LETTER';
  cardboardThicknessMm: number;
  eyeToScreenDistanceMm: number;
  includeAssemblyInstructions: boolean;
};
```

Example output:

```ts
type TemplateDocument = {
  pages: TemplatePage[];
  calibrationMarks: CalibrationMark[];
  instructions: AssemblyInstruction[];
  metadata: TemplateMetadata;
};
```

The app can then render the result as PDF.

---

## 7. Vision Testing Methodology

### 7.1 Visual Acuity Test

The visual acuity module should use logMAR-inspired testing.

Recommended optotypes:

- Tumbling E,
- Landolt C.

These are preferable because they do not require literacy and can be answered with direction-based responses.

The app should:

- randomize optotype orientation,
- test one eye at a time,
- include practice trials,
- track wrong answers,
- estimate acuity threshold,
- calculate logMAR-style results,
- measure reliability.

### 7.2 Refraction Estimation

The first version should use guided subjective refraction estimation.

This is more realistic than trying to infer prescription purely from the camera.

The workflow should estimate:

- spherical equivalent,
- sphere,
- cylinder range,
- axis range,
- confidence score.

The app should present controlled stimuli and iteratively ask:

```text
Is this better, worse, or the same?
```

or:

```text
Which is clearer: option one or option two?
```

### 7.3 Astigmatism Estimation

Astigmatism testing may use:

- clock dial patterns,
- fan chart patterns,
- line-orientation comparison,
- simplified Jackson-cross-cylinder-inspired interactions.

The MVP should provide an estimated cylinder and axis range, not necessarily a final clinical-grade prescription.

### 7.4 Reliability Scoring

Each test session should produce a reliability score based on:

- repeated answer consistency,
- response time,
- voice confidence,
- distance stability,
- phone tilt,
- ambient light,
- completion rate,
- contradictory answers.

---

## 8. Voice Interaction

### 8.1 Purpose

Voice interaction is important because the user may have the phone inside the cardboard support and may not be able to tap easily.

The app should use voice for both:

1. asking questions,
2. receiving answers.

### 8.2 Voice Commands

The supported vocabulary should be intentionally small:

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

This should be implemented as constrained command recognition, not open-ended dictation.

### 8.3 Text-to-Speech

The app should use text-to-speech to guide the user:

- “Cover your left eye.”
- “Look at the symbol.”
- “Say better, worse, or same.”
- “Please repeat.”
- “Test complete.”

### 8.4 Speech Recognition

The app should support:

- native speech recognition,
- confidence thresholds,
- noise handling,
- fallback to touch input,
- accessibility mode,
- multilingual command mapping.

Every recognized answer should be confirmed visually or audibly.

---

## 9. React Native Application Architecture

The React Native app should be implemented in TypeScript.

Recommended modules:

```text
onboarding
triage
device-calibration
template-generation
voice-assistant
acuity-test
refraction-test
results
reporting
settings
```

The app should use a state-machine-based test flow because vision testing has many branching steps.

Suggested state-machine domains:

```text
onboardingFlow
templateFlow
acuityFlow
refractionFlow
reportFlow
```

This makes the test protocol easier to validate, debug, and reproduce.

---

## 10. Monorepo Architecture

The project should use the current `packages/` monorepo structure with two JavaScript/Yarn workspaces and two Python/Poetry packages.

Repository root:

```text
hph-vision/
├── package.json              # Yarn workspace root and shared scripts
├── yarn.lock
├── .yarnrc.yml               # Yarn 3, node-modules linker
├── pyproject.toml            # Poetry root dev environment
├── tsconfig.base.json        # Shared TypeScript path aliases
├── conda/
│   └── dev.yaml              # Optional local dev environment
├── packages/
│   ├── mobile/
│   │   ├── package.json      # @hiperhealth/hphvision
│   │   ├── app.json
│   │   ├── index.js
│   │   ├── App.tsx
│   │   ├── src/
│   │   ├── __tests__/
│   │   ├── android/
│   │   ├── ios/
│   │   ├── metro.config.js
│   │   ├── babel.config.js
│   │   ├── jest.config.js
│   │   └── tsconfig.json
│   │
│   ├── mobile-lib/
│   │   ├── package.json      # @hiperhealth/hphvision-lib
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── jest.config.js
│   │   └── tsconfig.json
│   │
│   ├── restapi/
│   │   ├── pyproject.toml    # hph-vision-api
│   │   ├── src/
│   │   │   └── hph_vision_api/
│   │   │       ├── main.py
│   │   │       └── routers/
│   │   └── tests/
│   │
│   └── api-core/
│       ├── pyproject.toml    # hph-vision-core
│       ├── src/
│       │   └── hph_vision_core/
│       │       └── services/
│       └── tests/
│
├── docs/
│   └── plans/
│       └── general-plan.md
└── README.md
```

### 10.1 Dependency Direction

The dependency graph should remain simple and one-directional:

```text
@hiperhealth/hphvision
        ↓
@hiperhealth/hphvision-lib
```

```text
hph-vision-api
        ↓
hph-vision-core
```

The mobile app should not import backend code directly. API communication should happen over HTTP contracts exposed by `hph-vision-api`.

The Python API should not import React Native code. If an algorithm must exist on both mobile and backend, the preferred approach is to define the canonical protocol and data models clearly, then keep implementations tested against shared fixtures.

### 10.2 Android Studio Compatibility

Android Studio should open the Gradle project directly:

```text
packages/mobile/android
```

Do not open the repository root as the Android project. The root contains Yarn and Poetry workspace files that are useful for development, but the Android Gradle project lives under `packages/mobile/android`.

The Android configuration should resolve React Native dependencies from the repository root `node_modules`:

```gradle
// packages/mobile/android/settings.gradle
pluginManagement { includeBuild("../../../node_modules/@react-native/gradle-plugin") }
includeBuild("../../../node_modules/@react-native/gradle-plugin")
```

```gradle
// packages/mobile/android/app/build.gradle
react {
    root = file("../..")
    reactNativeDir = file("../../../../node_modules/react-native")
    codegenDir = file("../../../../node_modules/@react-native/codegen")
    cliFile = file("../../../../node_modules/react-native/cli.js")
}
```

Local Android SDK configuration should remain untracked:

```text
packages/mobile/android/local.properties
```

Example:

```properties
sdk.dir=/home/<user>/Android/Sdk
```

---

## 11. Package Responsibilities

### 11.1 Mobile App Package

Package name:

```text
@hiperhealth/hphvision
```

Path:

```text
packages/mobile
```

Purpose:

- React Native application shell,
- Android and iOS native projects,
- screens and navigation,
- voice integration,
- camera/sensor integration,
- local storage,
- template export UI,
- test execution UI,
- results display,
- report sharing.

This package should usually remain private because it represents the deployable mobile app, not a reusable npm library.

### 11.2 Mobile Library Package

Package name:

```text
@hiperhealth/hphvision-lib
```

Path:

```text
packages/mobile-lib
```

Purpose:

- visual acuity algorithms,
- refraction workflow logic,
- test state machines,
- device-profile models,
- template geometry generation,
- PDF/SVG generation primitives where practical,
- report data models,
- validation utilities,
- shared React Native/TypeScript types,
- reusable hooks or non-app-specific UI components.

This package should declare `react` and `react-native` as peer dependencies to avoid duplicate React Native installations.

Example package metadata:

```json
{
  "name": "@hiperhealth/hphvision-lib",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "react-native": "src/index.ts",
  "peerDependencies": {
    "react": "18.3.1",
    "react-native": "0.75.3"
  }
}
```

### 11.3 REST API Package

Package name:

```text
hph-vision-api
```

Path:

```text
packages/restapi
```

Purpose:

- FastAPI application,
- API routers,
- health checks,
- authentication and authorization integration,
- clinician-review endpoints,
- report persistence/export endpoints,
- backend orchestration.

The API package should depend on `hph-vision-core` for backend domain logic.

### 11.4 Backend Core Package

Package name:

```text
hph-vision-core
```

Path:

```text
packages/api-core
```

Purpose:

- backend domain services,
- validation and scoring helpers,
- persistence-independent business logic,
- Python data schemas used by the API,
- integrations that should be tested independently from FastAPI.

This package should avoid importing FastAPI unless there is a strong reason. Keeping it framework-light makes it easier to test and reuse.

---

## 12. Tooling

Recommended tooling for the current monorepo:

```text
Yarn 3 workspaces
Yarn node-modules linker
React Native CLI
TypeScript
Metro
Jest
ESLint
Prettier
Poetry
FastAPI
Uvicorn
Pytest
Ruff
Mypy
pre-commit
GitHub Actions
```

Root `package.json` should act as the main command surface:

```json
{
  "name": "hph-vision",
  "private": true,
  "packageManager": "yarn@3.6.4",
  "workspaces": ["packages/mobile", "packages/mobile-lib"],
  "scripts": {
    "mobile:start": "yarn workspace @hiperhealth/hphvision start",
    "mobile:android": "yarn workspace @hiperhealth/hphvision android",
    "mobile:ios": "yarn workspace @hiperhealth/hphvision ios",
    "mobile:lint": "yarn workspace @hiperhealth/hphvision lint",
    "mobile:test": "yarn workspace @hiperhealth/hphvision test",
    "mobile:typecheck": "yarn workspace @hiperhealth/hphvision typecheck",
    "mobile-lib:lint": "yarn workspace @hiperhealth/hphvision-lib lint",
    "mobile-lib:test": "yarn workspace @hiperhealth/hphvision-lib test",
    "mobile-lib:typecheck": "yarn workspace @hiperhealth/hphvision-lib typecheck",
    "api:dev": "poetry run uvicorn hph_vision_api.main:app --app-dir packages/restapi/src --reload",
    "api:lint": "poetry run ruff check packages/api-core packages/restapi",
    "api:format": "poetry run ruff format packages/api-core packages/restapi",
    "api:test": "poetry run pytest packages/api-core/tests packages/restapi/tests",
    "lint": "yarn mobile:lint && yarn mobile-lib:lint && yarn api:lint",
    "test": "yarn mobile:test && yarn mobile-lib:test && yarn api:test",
    "typecheck": "yarn mobile:typecheck && yarn mobile-lib:typecheck"
  }
}
```

Python dependencies should be managed by Poetry from the repository root:

```bash
poetry install
poetry run pytest packages/api-core/tests packages/restapi/tests
poetry run uvicorn hph_vision_api.main:app --app-dir packages/restapi/src --reload
```

JavaScript dependencies should be installed from the repository root:

```bash
yarn install
yarn mobile:start
yarn mobile:android
```

---

## 13. Release Strategy

Initial development can keep all packages private while product-market fit, clinical validation, and regulatory positioning are still evolving.

Recommended initial release posture:

```text
@hiperhealth/hphvision       private mobile app workspace
@hiperhealth/hphvision-lib   private reusable mobile library workspace
hph-vision-api               private Poetry package
hph-vision-core              private Poetry package
```

If parts of the system become reusable outside this repository, the first candidate for publishing is usually:

```text
@hiperhealth/hphvision-lib
```

The mobile app package should normally be released through app-store/mobile deployment pipelines rather than npm. The backend packages should normally be released through container images or internal package registries rather than public PyPI unless there is a clear reason to publish them.

### 13.1 Conventional Commits

The project should follow Conventional Commits with scopes matching the monorepo packages:

```text
feat(mobile): add voice-guided acuity flow
fix(mobile-lib): correct logMAR threshold calculation
feat(restapi): add clinician report endpoint
fix(api-core): improve health status schema
docs: update clinical validation plan
```

Version mapping:

```text
fix: patch release
feat: minor release
BREAKING CHANGE: major release
```

### 13.2 CI Validation Job

Example GitHub Actions workflow for validation:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  checks:
    name: Checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: yarn

      - name: Install JS dependencies
        run: yarn install --immutable

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Poetry
        run: pipx install poetry

      - name: Install Python dependencies
        run: poetry install

      - name: Lint
        run: yarn lint

      - name: Typecheck
        run: yarn typecheck

      - name: Test
        run: yarn test
```

### 13.3 Future Release Automation

If npm publication becomes necessary, use package-level release automation only for packages intended to be published. For example, `@hiperhealth/hphvision-lib` could later use `semantic-release` while the mobile app continues to use Android/iOS deployment workflows.

The clinically sensitive algorithm and scoring code should evolve conservatively and require validation evidence before release.

---

## 14. Data Model

### 14.1 DeviceProfile

```ts
type DeviceProfile = {
  id: string;
  manufacturer: string;
  modelName: string;
  modelNumber?: string;

  bodyWidthMm: number;
  bodyHeightMm: number;
  thicknessMm: number;

  screenWidthPx: number;
  screenHeightPx: number;
  pixelDensity: number;

  screenWidthMm?: number;
  screenHeightMm?: number;

  activeDisplayOffsetXmm?: number;
  activeDisplayOffsetYmm?: number;

  notchMask?: NotchMask;
  templateFamily: string;
};
```

### 14.2 TestSession

```ts
type TestSession = {
  id: string;
  createdAt: string;

  deviceProfile: DeviceProfile;
  templateVersion?: string;

  patientContext: {
    ageRange?: string;
    currentGlasses?: boolean;
    previousPrescription?: boolean;
  };

  environment: {
    ambientLightLux?: number;
    screenBrightness?: number;
    distanceConfidence?: number;
    tiltConfidence?: number;
  };

  acuityResult?: AcuityResult;
  refractionResult?: RefractionResult;

  reliabilityScore: number;
  warnings: string[];
};
```

### 14.3 RefractionResult

```ts
type RefractionResult = {
  rightEye?: EyeRefractionEstimate;
  leftEye?: EyeRefractionEstimate;
  binocular?: EyeRefractionEstimate;
  confidence: number;
  recommendation: ResultRecommendation;
};

type EyeRefractionEstimate = {
  sphere?: number;
  cylinder?: number;
  axis?: number;
  sphericalEquivalent?: number;
  confidenceInterval?: {
    sphere?: [number, number];
    cylinder?: [number, number];
    axis?: [number, number];
  };
};
```

---

## 15. Report Generation

The app should generate two types of PDF.

### 15.1 Cardboard Template PDF

Includes:

- cut lines,
- fold lines,
- glue tabs,
- phone holder,
- calibration square,
- assembly instructions,
- phone model,
- template version.

### 15.2 Vision Screening Report PDF

Includes:

- patient/session metadata,
- device used,
- whether template/visor was used,
- visual acuity results,
- refraction estimate,
- reliability score,
- warnings,
- clinician review recommendation.

The report should clearly state:

```text
This result is a screening and estimation output. It is not a complete eye health examination.
```

---

## 16. Validation Plan

### 16.1 Engineering Validation

Test:

- PDF scale accuracy,
- phone fit accuracy,
- template assembly repeatability,
- screen brightness handling,
- voice recognition accuracy,
- test flow consistency,
- offline behavior,
- Android Gradle build from `packages/mobile/android`,
- Metro resolution of `@hiperhealth/hphvision-lib`,
- Poetry path dependency resolution between `restapi` and `api-core`.

### 16.2 Usability Validation

Evaluate:

- whether users can assemble the cardboard visor,
- whether users understand voice instructions,
- whether older users can complete the test,
- whether touch fallback is sufficient,
- test completion time,
- user confidence.

### 16.3 Clinical Validation

Compare app results against standard clinical measurements performed by qualified eye-care professionals.

Validation should compare:

- visual acuity against ETDRS or accepted clinical chart workflows,
- estimated refraction against subjective clinical refraction,
- test-retest repeatability,
- reliability-score usefulness,
- failure/uncertain-result detection,
- usability across age groups and smartphone models.

The system should not present prescription-estimation results as a final prescription until clinical validation, clinician-review workflows, and applicable regulatory requirements are satisfied.

---

## 17. Near-Term Implementation Milestones

1. Stabilize the monorepo foundation.
2. Keep Android Studio opening cleanly from `packages/mobile/android`.
3. Move reusable mobile logic from app screens into `@hiperhealth/hphvision-lib`.
4. Define shared TypeScript test-session and device-profile models.
5. Expand the FastAPI health check into versioned API routing.
6. Add backend core services to `hph-vision-core` only when logic is reused or independently testable.
7. Add CI for Yarn and Poetry checks.
8. Begin cardboard-template geometry prototypes in the mobile library.
9. Add validation fixtures shared between mobile and backend tests.
10. Document clinical disclaimers and review workflows before user-facing release.
