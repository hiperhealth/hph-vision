# hphvision — Technical Proposal

## Smartphone-Based Vision Screening and Prescription Estimation Platform

**Project name:** `hphvision`
**Meaning:** `hph` stands for **hiperhealth**
**Primary platform:** React Native
**Architecture:** TypeScript monorepo
**Published npm packages:**

```text
@hiperhealth/hphvision-core
@hiperhealth/hphvision-mobile
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

Instead of storing static templates, `hphvision-core` should define a geometry engine that produces vector paths from phone and template parameters.

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

The project should use a monorepo.

Repository name:

```text
hphvision
```

Suggested structure:

```text
hphvision/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── packages/
│   ├── hphvision-core/
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── acuity/
│   │   │   ├── refraction/
│   │   │   ├── device-profile/
│   │   │   ├── template-generator/
│   │   │   ├── pdf/
│   │   │   ├── reports/
│   │   │   ├── validation/
│   │   │   └── index.ts
│   │   └── tests/
│   │
│   └── hphvision-mobile/
│       ├── package.json
│       ├── app.json
│       ├── src/
│       │   ├── screens/
│       │   ├── modules/
│       │   ├── voice/
│       │   ├── calibration/
│       │   ├── testing-flow/
│       │   ├── reporting/
│       │   └── App.tsx
│       └── tests/
│
├── docs/
│   ├── clinical-validation.md
│   ├── template-spec.md
│   ├── architecture.md
│   └── regulatory-notes.md
│
└── examples/
    ├── generate-template/
    ├── run-acuity-test/
    └── run-refraction-flow/
```

---

## 11. npm Packages

The monorepo should publish two independent npm packages.

### 11.1 Core Library Package

Package name:

```text
@hiperhealth/hphvision-core
```

Purpose:

- visual acuity algorithms,
- refraction workflow logic,
- test state machines,
- device-profile models,
- template geometry generation,
- PDF/SVG generation primitives,
- report data models,
- validation utilities,
- shared TypeScript types.

This package should not depend on React Native UI.

It should be reusable from:

- the mobile app,
- a web app,
- a backend service,
- validation notebooks,
- clinician dashboards,
- automated test pipelines.

Example package metadata:

```json
{
  "name": "@hiperhealth/hphvision-core",
  "version": "0.0.0-development",
  "private": false,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"]
}
```

### 11.2 Mobile App Package

Package name:

```text
@hiperhealth/hphvision-mobile
```

Purpose:

- React Native app,
- screens,
- voice integration,
- camera/sensor integration,
- local storage,
- template export UI,
- test execution UI,
- results display,
- report sharing.

The mobile package depends on the core package:

```text
@hiperhealth/hphvision-mobile
        ↓
@hiperhealth/hphvision-core
```

Example package metadata:

```json
{
  "name": "@hiperhealth/hphvision-mobile",
  "version": "0.0.0-development",
  "private": false,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"]
}
```

---

## 12. Tooling

Recommended tooling:

```text
pnpm workspaces
Turborepo
TypeScript
React Native
Vitest or Jest
React Native Testing Library
ESLint
Prettier
semantic-release
multi-semantic-release
GitHub Actions
```

Root `package.json` example:

```json
{
  "private": true,
  "scripts": {
    "check": "turbo run lint typecheck test",
    "build": "turbo run build",
    "release": "npx multi-semantic-release"
  },
  "devDependencies": {
    "multi-semantic-release": "^3.0.0",
    "semantic-release": "^24.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 13. Release Strategy

The project should use **semantic-release** through `npx` from a CI release job.

Because the repository contains two independently published packages, the recommended setup is:

```bash
npx multi-semantic-release
```

This allows package-level releases for:

```text
@hiperhealth/hphvision-core
@hiperhealth/hphvision-mobile
```

### 13.1 Release Rules

The project should follow Conventional Commits:

```text
feat(core): add logMAR acuity scoring
fix(template): correct phone slot tolerance
feat(mobile): add voice-guided better/worse flow
docs: add clinical validation plan
```

Version mapping:

```text
fix: patch release
feat: minor release
BREAKING CHANGE: major release
```

### 13.2 CI Release Job

Example GitHub Actions workflow:

```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    name: Release packages
    runs-on: ubuntu-latest

    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run checks
        run: pnpm run check

      - name: Build packages
        run: pnpm run build

      - name: Release packages
        run: npx multi-semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 13.3 Release Principle

The core package should evolve more conservatively because it contains clinically sensitive algorithms, scoring logic, template geometry, and validation utilities.

The mobile app package may evolve faster because UI and UX will likely require frequent iteration.

Independent package releases allow this separation.

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
- offline behavior.

### 16.2 Usability Validation

Evaluate:

- whether users can assemble the cardboard visor,
- whether users understand voice instructions,
- whether older users can complete the test,
- whether touch fallback is sufficient,
- test completion time,
- user confidence.

### 16.3 Clinical Validation

Compare app results against standard clinical measurements.

For visual acuity:

- ETDRS/logMAR chart,
- Snellen chart,
- test-retest variability,
- Bland-Altman limits of agreement,
- sensitivity/specificity for reduced acuity.

For refraction:

- subjective refraction,
- autorefractor,
- final clinician prescription.

Key metrics:

- mean spherical equivalent error,
- percentage within ±0.50 D,
- percentage within ±0.75 D,
- cylinder error,
- axis error,
- patient acceptance,
- repeatability.

### 16.4 Field Validation

Run studies in:

- remote settings,
- low-resource clinics,
- school screening programs,
- telehealth workflows.

This is aligned with research showing that smartphone apps can support screening by nonprofessional personnel in resource-constrained or rural settings.

---

## 17. Security, Privacy, and Compliance

The app should be designed with healthcare privacy in mind.

Recommended practices:

- local-first storage where possible,
- encrypted local data,
- explicit consent before sharing reports,
- no unnecessary collection of identifiable data,
- anonymized analytics,
- audit trail for test sessions,
- secure backend if cloud sync is added.

Because the app may produce clinically relevant outputs, the project should also maintain:

- versioned test protocols,
- versioned algorithms,
- versioned template generator,
- traceable release artifacts,
- validation documentation.

---

## 18. Regulatory Considerations

The project should avoid premature claims such as:

```text
This app replaces an eye doctor.
```

or:

```text
This app gives a complete prescription without professional review.
```

Recommended positioning:

```text
hphvision provides guided vision screening and refractive-error estimation. Results should be reviewed by an eye-care professional before being used as a medical prescription.
```

If the project later intends to generate final prescriptions or operate as a medical device, regulatory planning will be required.

---

## 19. Roadmap

### Phase 1 — Foundation

- monorepo setup,
- TypeScript packages,
- CI,
- semantic-release,
- core data models,
- first template geometry engine,
- React Native app skeleton.

### Phase 2 — Template Generator

- phone profile database,
- manual phone dimension entry,
- A4/Letter PDF generation,
- calibration square,
- assembly instructions,
- template preview.

### Phase 3 — Visual Acuity MVP

- Tumbling E test,
- monocular test flow,
- voice prompts,
- touch fallback,
- result scoring,
- reliability score.

### Phase 4 — Refraction Estimation MVP

- guided subjective comparison flow,
- sphere estimation,
- astigmatism screening,
- confidence intervals,
- report generation.

### Phase 5 — Pilot Testing

- internal testing,
- usability testing,
- template fit validation,
- test-retest analysis.

### Phase 6 — Clinical Validation

- clinical partner study,
- comparison against standard tests,
- validation report,
- protocol refinement.

---

## 20. Final Recommendation

`hphvision` should be built as a serious, validation-oriented platform rather than just a simple eye-test app.

The most important design decisions are:

1. separate reusable clinical/testing logic into `@hiperhealth/hphvision-core`,
2. keep the React Native app in `@hiperhealth/hphvision-mobile`,
3. generate smartphone-specific cardboard templates as first-class PDF outputs,
4. use voice guidance and constrained speech recognition for hands-free testing,
5. position the app as screening and prescription estimation, not as a full replacement for an eye exam,
6. automate independent npm releases from CI using `npx multi-semantic-release`.

A concise formal description would be:

> **hphvision** is a hiperhealth smartphone-based vision-screening platform that combines React Native, reusable TypeScript vision-testing algorithms, voice-guided interaction, and dynamically generated cardboard visor templates to support low-cost visual acuity testing and eyeglass-prescription estimation. The project uses a monorepo architecture and publishes two independent npm packages: `@hiperhealth/hphvision-core` and `@hiperhealth/hphvision-mobile`, with automated semantic releases from CI.
