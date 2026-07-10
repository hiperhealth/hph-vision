# hphvision Mobile Library Plan

## Package

```text
Package: @hiperhealth/hphvision-lib
Path: packages/mobile-lib
Platform: TypeScript / React Native-compatible library
Role: reusable mobile-domain library used by @hiperhealth/hphvision
```

This plan is extracted and expanded from `docs/plans/general-plan.md`. It focuses only on the reusable TypeScript mobile library: domain models, test protocols, scoring algorithms, template geometry, report data structures, validation helpers, and app-agnostic utilities.

---

## 1. Purpose

`@hiperhealth/hphvision-lib` is the reusable TypeScript library that powers the React Native mobile app.

It should contain the mobile-domain logic that must be:

- deterministic,
- testable,
- reusable,
- isolated from app navigation,
- isolated from native permissions,
- isolated from screen components when practical,
- suitable for future reuse by a web app, validation tooling, or clinician dashboard.

The library should make the mobile app thinner. The app should orchestrate UI and native integrations, while the library provides the clinical workflow primitives, geometry, state machines, and scoring logic.

---

## 2. Responsibility Boundaries

### 2.1 In Scope

The library should own reusable logic for:

- shared TypeScript domain types,
- visual acuity test state and scoring,
- guided subjective refraction workflow logic,
- astigmatism estimation workflow primitives,
- reliability scoring,
- safety triage models and rule evaluation,
- device profile models and validation,
- device-profile matching helpers,
- cardboard template parametric geometry,
- PDF/SVG-ready vector document models,
- report data models,
- clinical warning and recommendation rules,
- voice command canonical models,
- localization-key definitions for prompts,
- validation helpers,
- fixtures for tests and validation.

### 2.2 Out of Scope

The library should not own app-specific or native behavior:

- React Navigation routes,
- screen components tied to the app flow,
- Android/iOS permission prompts,
- native speech recognition setup,
- text-to-speech engine calls,
- camera access,
- filesystem writes,
- PDF file writing/sharing,
- HTTP API client implementation,
- local persistence implementation,
- app analytics,
- FastAPI backend code,
- Python package code.

If reusable UI components are added later, they should be clearly separated from pure domain logic and should not pull native dependencies into the core algorithm modules.

---

## 3. Package Location and Configuration

```text
packages/mobile-lib/
├── package.json
├── src/
│   └── index.ts
├── jest.config.js
└── tsconfig.json
```

Current package identity:

```json
{
  "name": "@hiperhealth/hphvision-lib",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "react-native": "src/index.ts"
}
```

Peer dependency rule:

```json
{
  "peerDependencies": {
    "react": "18.3.1",
    "react-native": "0.75.3"
  }
}
```

The peer dependency rule prevents duplicate React Native installations when the mobile app imports the library.

---

## 4. Proposed Source Structure

Recommended expanded source layout:

```text
packages/mobile-lib/src/
├── index.ts
├── acuity/
│   ├── index.ts
│   ├── optotypes.ts
│   ├── protocol.ts
│   ├── scoring.ts
│   ├── stateMachine.ts
│   ├── types.ts
│   └── __tests__/
├── refraction/
│   ├── index.ts
│   ├── protocol.ts
│   ├── spherical.ts
│   ├── astigmatism.ts
│   ├── stateMachine.ts
│   ├── scoring.ts
│   ├── types.ts
│   └── __tests__/
├── triage/
│   ├── index.ts
│   ├── questions.ts
│   ├── rules.ts
│   ├── types.ts
│   └── __tests__/
├── device-profile/
│   ├── index.ts
│   ├── database.ts
│   ├── matching.ts
│   ├── validation.ts
│   ├── types.ts
│   └── __tests__/
├── template-generator/
│   ├── index.ts
│   ├── geometry.ts
│   ├── layout.ts
│   ├── pages.ts
│   ├── primitives.ts
│   ├── validation.ts
│   ├── types.ts
│   └── __tests__/
├── reporting/
│   ├── index.ts
│   ├── reportModel.ts
│   ├── recommendations.ts
│   ├── warnings.ts
│   ├── types.ts
│   └── __tests__/
├── reliability/
│   ├── index.ts
│   ├── scoring.ts
│   ├── signals.ts
│   ├── types.ts
│   └── __tests__/
├── voice/
│   ├── index.ts
│   ├── commands.ts
│   ├── prompts.ts
│   ├── mapping.ts
│   ├── types.ts
│   └── __tests__/
├── session/
│   ├── index.ts
│   ├── events.ts
│   ├── session.ts
│   ├── versioning.ts
│   ├── types.ts
│   └── __tests__/
├── validation/
│   ├── index.ts
│   ├── numeric.ts
│   ├── units.ts
│   ├── assertions.ts
│   └── __tests__/
└── fixtures/
    ├── devices.ts
    ├── acuitySessions.ts
    ├── refractionSessions.ts
    └── templateInputs.ts
```

This structure can be introduced incrementally. The current `src/index.ts` can initially export placeholders and types, then modules can be added as implementation begins.

---

## 5. Public API Design Principles

### 5.1 Stable Entry Point

The app should import from the package root where possible:

```ts
import {
  createAcuitySession,
  generateTemplateDocument,
  evaluateTriage,
} from '@hiperhealth/hphvision-lib';
```

Avoid requiring app code to import deep internal paths such as:

```ts
import {score} from '@hiperhealth/hphvision-lib/src/acuity/scoring';
```

### 5.2 Deterministic Functions

Most library functions should be pure or deterministic:

```ts
const result = scoreAcuitySession(session, scoringOptions);
```

Avoid hidden state, timers, random values, or platform calls inside core functions.

If randomization is required, inject a random source or seed:

```ts
const trial = nextAcuityTrial(session, {
  randomSeed: 'session-123-step-4',
});
```

### 5.3 Versioned Protocols

Clinical and test protocols should carry explicit versions:

```ts
type ProtocolVersion = 'acuity-v0.1' | 'refraction-v0.1' | 'template-v0.1';
```

Every generated result should include:

- library version,
- protocol version,
- scoring version,
- input metadata.

### 5.4 Clear Error Models

Use typed errors or result objects instead of throwing for expected validation failures:

```ts
type ValidationResult<T> =
  | {ok: true; value: T}
  | {ok: false; errors: ValidationError[]};
```

Throw only for programmer errors or impossible states.

---

## 6. Core Domain Types

### 6.1 Device Profile

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

### 6.2 Phone Geometry

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
```

### 6.3 Test Session

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

### 6.4 Refraction Result

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

## 7. Triage Module Plan

### 7.1 Purpose

The triage module provides standardized safety questions and rule evaluation.

It does not render screens. The mobile app renders questions and calls the library to evaluate answers.

### 7.2 Red Flags

Initial red-flag categories:

- sudden vision loss,
- eye pain,
- flashes or floaters,
- double vision,
- recent eye trauma,
- severe redness,
- known glaucoma,
- diabetes-related eye disease risk,
- recent eye surgery.

### 7.3 Types

```ts
type TriageQuestion = {
  id: string;
  promptKey: string;
  category: TriageCategory;
  answerType: 'yesNo' | 'singleChoice' | 'multiChoice';
  blocksSelfTestOnPositive: boolean;
};

type TriageAnswer = {
  questionId: string;
  value: boolean | string | string[];
};

type TriageResult = {
  canContinueSelfTest: boolean;
  redFlags: TriageCategory[];
  recommendation: 'continue' | 'seekProfessionalCare' | 'urgentCare';
  warnings: string[];
};
```

### 7.4 Public Functions

```ts
export function getTriageQuestions(): TriageQuestion[];
export function evaluateTriage(answers: TriageAnswer[]): TriageResult;
```

### 7.5 Acceptance Criteria

- red-flag answers block self-testing,
- missing answers are reported clearly,
- question IDs are stable for persisted sessions,
- result is deterministic and unit-tested.

---

## 8. Device Profile Module Plan

### 8.1 Purpose

The device-profile module helps convert app-collected device information into physical geometry needed by the template generator.

### 8.2 Responsibilities

- define `DeviceProfile`,
- validate dimensions,
- match detected model strings to known profiles,
- normalize manufacturer/model names,
- convert profile to `PhoneGeometry`,
- report confidence and missing fields.

### 8.3 Matching Strategy

Inputs from the app may include:

```ts
type DeviceDetectionInput = {
  manufacturer?: string;
  modelName?: string;
  modelNumber?: string;
  os?: 'ios' | 'android';
  screenWidthPx?: number;
  screenHeightPx?: number;
  pixelDensity?: number;
};
```

Output:

```ts
type DeviceProfileMatch = {
  profile?: DeviceProfile;
  confidence: number;
  reason: string;
  alternatives: DeviceProfile[];
  requiresManualConfirmation: boolean;
};
```

### 8.4 Public Functions

```ts
export function validateDeviceProfile(
  profile: DeviceProfile,
): ValidationResult<DeviceProfile>;
export function matchDeviceProfile(
  input: DeviceDetectionInput,
): DeviceProfileMatch;
export function toPhoneGeometry(profile: DeviceProfile): PhoneGeometry;
```

### 8.5 Acceptance Criteria

- invalid physical dimensions are rejected,
- unknown devices return manual fallback guidance,
- profile matching is case-insensitive and resilient to manufacturer/model variants,
- tests cover common and unknown-device cases.

---

## 9. Template Generator Module Plan

### 9.1 Purpose

The template generator is a central feature. It produces a parametric cardboard visor/support document from phone geometry and template options.

The library should generate a device-independent vector document model. The mobile app decides how to render that model into a PDF file.

### 9.2 Inputs

```ts
type TemplateOptions = {
  pageSize: 'A4' | 'LETTER';
  cardboardThicknessMm: number;
  eyeToScreenDistanceMm: number;
  includeAssemblyInstructions: boolean;
};
```

### 9.3 Output

```ts
type TemplateDocument = {
  pages: TemplatePage[];
  calibrationMarks: CalibrationMark[];
  instructions: AssemblyInstruction[];
  metadata: TemplateMetadata;
};
```

### 9.4 Template Components

The generated document should include:

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

### 9.5 Geometry Primitives

Recommended primitive model:

```ts
type Point = {xMm: number; yMm: number};

type LinePath = {
  kind: 'line';
  from: Point;
  to: Point;
  role: 'cut' | 'fold' | 'guide' | 'calibration';
};

type RectPath = {
  kind: 'rect';
  origin: Point;
  widthMm: number;
  heightMm: number;
  role: 'cut' | 'fold' | 'guide' | 'calibration';
};

type TextElement = {
  kind: 'text';
  origin: Point;
  textKey: string;
  fallbackText: string;
  sizeMm: number;
};
```

### 9.6 Template Generation Pipeline

```text
PhoneGeometry + TemplateOptions
  -> validate inputs
  -> calculate clearances and tolerances
  -> calculate page layout
  -> generate structural panels
  -> generate phone holder slot
  -> generate eye window and occlusion features
  -> generate calibration marks
  -> generate labels/instructions
  -> produce TemplateDocument
```

### 9.7 Validation Rules

Validate:

- phone width > 0,
- phone height > 0,
- thickness > 0,
- cardboard thickness in practical range,
- eye-to-screen distance in practical range,
- generated paths fit selected page size,
- calibration square exactly 50 mm in document units.

### 9.8 Public Functions

```ts
export function generateTemplateDocument(
  phone: PhoneGeometry,
  options: TemplateOptions,
): ValidationResult<TemplateDocument>;

export function validateTemplateOptions(
  options: TemplateOptions,
): ValidationResult<TemplateOptions>;
```

### 9.9 Acceptance Criteria

- A4 and US Letter are supported,
- output uses millimeters consistently,
- calibration square is generated,
- impossible phone/template combinations fail clearly,
- geometry tests snapshot key dimensions,
- no React Native PDF dependency is required by the pure generator.

---

## 10. Visual Acuity Module Plan

### 10.1 Purpose

The acuity module provides logMAR-inspired visual acuity test protocol logic.

The mobile app renders optotypes and captures answers. The library decides:

- which trial comes next,
- how to score answers,
- when to stop,
- what result and reliability warnings to produce.

### 10.2 Optotypes

Initial supported optotypes:

- Tumbling E,
- Landolt C.

These are preferred because they do not require literacy and can be answered by direction.

### 10.3 Core Types

```ts
type Eye = 'left' | 'right' | 'binocular';
type OptotypeKind = 'tumblingE' | 'landoltC';
type OptotypeOrientation = 'up' | 'down' | 'left' | 'right';

type AcuityTrial = {
  id: string;
  eye: Eye;
  optotype: OptotypeKind;
  orientation: OptotypeOrientation;
  sizeLogMar: number;
  startedAt?: string;
};

type AcuityResponse = {
  trialId: string;
  answer: OptotypeOrientation | 'unknown' | 'skipped';
  responseTimeMs?: number;
  inputMethod: 'voice' | 'touch' | 'external';
  confidence?: number;
  createdAt: string;
};
```

### 10.4 Result Type

```ts
type AcuityResult = {
  eye: Eye;
  logMarEstimate?: number;
  snellenEquivalent?: string;
  completed: boolean;
  confidence: number;
  reliabilityWarnings: string[];
  trials: AcuityTrial[];
  responses: AcuityResponse[];
};
```

### 10.5 Protocol Features

The module should support:

- practice trials,
- randomized orientation,
- one-eye-at-a-time testing,
- threshold estimation,
- wrong-answer tracking,
- early stopping rules,
- repeat/unknown responses,
- reliability scoring.

### 10.6 Public Functions

```ts
export function createAcuitySession(
  options: AcuitySessionOptions,
): AcuitySession;
export function nextAcuityTrial(
  session: AcuitySession,
): AcuityTrial | undefined;
export function recordAcuityResponse(
  session: AcuitySession,
  response: AcuityResponse,
): AcuitySession;
export function scoreAcuitySession(session: AcuitySession): AcuityResult;
```

### 10.7 Acceptance Criteria

- randomization is deterministic when seeded,
- threshold scoring is unit-tested,
- incomplete sessions are handled safely,
- responses with low voice confidence affect reliability,
- result never claims diagnosis.

---

## 11. Refraction Module Plan

### 11.1 Purpose

The refraction module provides guided subjective refraction-estimation workflow logic.

The first version should estimate:

- spherical equivalent,
- sphere range,
- cylinder range,
- axis range,
- confidence score.

It should not claim to produce a final clinical-grade prescription.

### 11.2 Interaction Types

The app should render prompts derived from library trial definitions:

```text
Is this better, worse, or the same?
Which is clearer: option one or option two?
```

Canonical answer values:

```ts
type BetterWorseSame = 'better' | 'worse' | 'same' | 'unknown';
type OneTwoChoice = 'one' | 'two' | 'same' | 'unknown';
```

### 11.3 Astigmatism Estimation

Potential patterns:

- clock dial,
- fan chart,
- line-orientation comparison,
- simplified Jackson-cross-cylinder-inspired comparison.

MVP output should be an estimated range, not a final prescription.

### 11.4 Core Types

```ts
type RefractionTrial = {
  id: string;
  eye: Eye;
  kind: 'sphericalComparison' | 'cylinderComparison' | 'axisComparison';
  promptKey: string;
  optionA?: RefractionStimulus;
  optionB?: RefractionStimulus;
};

type RefractionResponse = {
  trialId: string;
  answer: BetterWorseSame | OneTwoChoice;
  responseTimeMs?: number;
  inputMethod: 'voice' | 'touch' | 'external';
  confidence?: number;
  createdAt: string;
};
```

### 11.5 Public Functions

```ts
export function createRefractionSession(
  options: RefractionSessionOptions,
): RefractionSession;

export function nextRefractionTrial(
  session: RefractionSession,
): RefractionTrial | undefined;

export function recordRefractionResponse(
  session: RefractionSession,
  response: RefractionResponse,
): RefractionSession;

export function scoreRefractionSession(
  session: RefractionSession,
): RefractionResult;
```

### 11.6 Acceptance Criteria

- contradictory answers lower confidence,
- low-confidence estimates produce clinician-review recommendation,
- unknown/skipped responses are supported,
- result output is explicit about uncertainty,
- unit tests cover normal, contradictory, and incomplete sessions.

---

## 12. Reliability Module Plan

### 12.1 Purpose

The reliability module calculates quality and confidence signals across the session.

Signals from the app and test modules should be normalized into a common model.

### 12.2 Reliability Inputs

```ts
type ReliabilitySignals = {
  repeatedAnswerConsistency?: number;
  medianResponseTimeMs?: number;
  voiceConfidence?: number;
  distanceConfidence?: number;
  tiltConfidence?: number;
  ambientLightScore?: number;
  completionRate?: number;
  contradictionScore?: number;
};
```

### 12.3 Output

```ts
type ReliabilityResult = {
  score: number;
  level: 'high' | 'medium' | 'low' | 'invalid';
  warnings: ReliabilityWarning[];
};
```

### 12.4 Public Functions

```ts
export function calculateReliability(
  signals: ReliabilitySignals,
): ReliabilityResult;
```

### 12.5 Acceptance Criteria

- score is normalized between 0 and 1 or 0 and 100 consistently,
- missing signals do not crash scoring,
- low-quality conditions generate clear warnings,
- warnings can be displayed in app and report.

---

## 13. Voice Module Plan

### 13.1 Purpose

The voice module defines canonical commands, prompt keys, and mapping helpers. It does not call native speech recognition or text-to-speech APIs.

### 13.2 Commands

Canonical commands:

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

### 13.3 Types

```ts
type VoiceCommand =
  | 'better'
  | 'worse'
  | 'same'
  | 'one'
  | 'two'
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'repeat'
  | 'stop'
  | 'unknown';

type VoiceRecognitionCandidate = {
  transcript: string;
  confidence?: number;
  locale: string;
};
```

### 13.4 Public Functions

```ts
export function mapTranscriptToCommand(
  candidate: VoiceRecognitionCandidate,
): VoiceCommand;

export function getAllowedCommandsForTrial(
  trial: AcuityTrial | RefractionTrial,
): VoiceCommand[];
```

### 13.5 Acceptance Criteria

- command mapping is locale-ready,
- synonyms can be added without changing app flow,
- low-confidence handling remains app-controlled,
- tests cover common transcripts and unknown utterances.

---

## 14. Reporting Module Plan

### 14.1 Purpose

The reporting module defines report data models and recommendation logic. The app renders the report model to PDF.

### 14.2 Report Types

```ts
type ScreeningReport = {
  id: string;
  sessionId: string;
  createdAt: string;
  appVersion?: string;
  libraryVersion?: string;
  deviceProfile?: DeviceProfile;
  templateMetadata?: TemplateMetadata;
  acuityResults: AcuityResult[];
  refractionResult?: RefractionResult;
  reliability: ReliabilityResult;
  warnings: ReportWarning[];
  recommendation: ResultRecommendation;
  disclaimer: string;
};
```

### 14.3 Required Disclaimer

```text
This result is a screening and estimation output. It is not a complete eye health examination.
```

### 14.4 Public Functions

```ts
export function createScreeningReport(session: TestSession): ScreeningReport;

export function determineRecommendation(
  input: RecommendationInput,
): ResultRecommendation;
```

### 14.5 Acceptance Criteria

- report model contains all data needed for mobile PDF rendering,
- report always contains disclaimer,
- warnings and low confidence affect recommendation,
- report creation is deterministic and unit-tested.

---

## 15. Session and Event Module Plan

### 15.1 Purpose

The session module defines reusable session events and versioning. The app can persist these events to reconstruct or debug sessions.

### 15.2 Event Examples

```ts
type SessionEvent =
  | {type: 'SESSION_CREATED'; at: string}
  | {type: 'CONSENT_ACCEPTED'; at: string}
  | {type: 'TRIAGE_COMPLETED'; at: string; result: TriageResult}
  | {type: 'DEVICE_PROFILE_SELECTED'; at: string; profile: DeviceProfile}
  | {type: 'TEMPLATE_GENERATED'; at: string; metadata: TemplateMetadata}
  | {type: 'ACUITY_RESPONSE_RECORDED'; at: string; response: AcuityResponse}
  | {
      type: 'REFRACTION_RESPONSE_RECORDED';
      at: string;
      response: RefractionResponse;
    }
  | {type: 'REPORT_CREATED'; at: string; reportId: string};
```

### 15.3 Acceptance Criteria

- event names are stable,
- events are serializable,
- session reconstruction is deterministic,
- migration/versioning strategy exists before external validation.

---

## 16. Testing Strategy

### 16.1 Unit Tests

Every pure module should have focused unit tests.

Required coverage areas:

- triage blocking rules,
- device-profile validation,
- device matching,
- template option validation,
- template geometry dimensions,
- acuity trial sequencing,
- acuity scoring,
- refraction trial sequencing,
- refraction scoring,
- reliability scoring,
- voice command mapping,
- report recommendation logic.

### 16.2 Snapshot/Fixture Tests

Useful for:

- template geometry output,
- report model output,
- deterministic acuity session paths,
- deterministic refraction session paths.

Fixtures should live in:

```text
packages/mobile-lib/src/fixtures
```

or a dedicated test fixtures folder if they become large.

### 16.3 Property/Boundary Tests

Important boundary cases:

- very small phones,
- very large phones,
- invalid thickness,
- unusual screen aspect ratios,
- incomplete sessions,
- all answers unknown,
- contradictory answers,
- low voice confidence,
- missing ambient light data.

### 16.4 Commands

```bash
yarn mobile-lib:test
yarn mobile-lib:typecheck
yarn mobile-lib:lint
```

---

## 17. Implementation Milestones

### Milestone 0 — Library Baseline

Goals:

- keep package importable by the mobile app,
- establish public export pattern,
- define initial types.

Tasks:

- expand `src/index.ts`,
- add `session`, `triage`, and `device-profile` type files,
- add basic tests,
- verify Metro resolves the package.

Acceptance criteria:

- app imports from `@hiperhealth/hphvision-lib`,
- `yarn mobile-lib:typecheck` passes,
- no duplicate React Native dependency is introduced.

### Milestone 1 — Triage and Session Models

Tasks:

- implement triage question list,
- implement triage evaluation,
- implement session/event types,
- add test fixtures.

Acceptance criteria:

- red flags block self-test in deterministic tests,
- app can render triage questions from library data,
- session events serialize to JSON.

### Milestone 2 — Device Profile and Geometry Inputs

Tasks:

- define `DeviceProfile`,
- define `PhoneGeometry`,
- implement validation,
- implement manual fallback helpers,
- add initial fixture devices.

Acceptance criteria:

- invalid geometry is rejected,
- unknown devices produce manual fallback result,
- app can generate a `PhoneGeometry` from a selected profile.

### Milestone 3 — Template Geometry Prototype

Tasks:

- define geometry primitives,
- implement A4/Letter page dimensions,
- implement calibration square,
- implement basic phone holder outline,
- implement template metadata.

Acceptance criteria:

- `generateTemplateDocument` returns a valid model,
- calibration square is exactly 50 mm,
- generated document snapshots are stable.

### Milestone 4 — Full Template Components

Tasks:

- add cut/fold/glue-tab geometry,
- add eye window,
- add monocular occlusion flap,
- add alignment markers,
- add assembly instruction model,
- add validation for page fit.

Acceptance criteria:

- output includes all MVP template components,
- impossible layouts return validation errors,
- app can render preview/PDF from document model.

### Milestone 5 — Acuity Protocol

Tasks:

- define optotype types,
- create acuity session state,
- implement deterministic trial selection,
- implement response recording,
- implement initial logMAR-style scoring.

Acceptance criteria:

- practice and test trials are represented,
- left/right eye sessions are separate,
- unit tests verify scoring and stopping rules.

### Milestone 6 — Reliability Scoring

Tasks:

- define signals,
- implement normalized score,
- implement warning generation,
- integrate with acuity results.

Acceptance criteria:

- low completion lowers score,
- contradictory answers generate warnings,
- missing optional signals are handled.

### Milestone 7 — Refraction Protocol Prototype

Tasks:

- define comparison trial types,
- implement better/worse/same flow,
- implement one/two comparison flow,
- create preliminary spherical-equivalent estimate,
- add confidence intervals.

Acceptance criteria:

- flow can run to completion from fixtures,
- contradictory answers reduce confidence,
- estimates are explicitly marked uncertain.

### Milestone 8 — Astigmatism Estimation

Tasks:

- define clock/fan/line-orientation trial types,
- implement cylinder/axis range estimation,
- add reliability warnings,
- add report integration.

Acceptance criteria:

- output includes cylinder and axis ranges,
- low confidence triggers clinician-review recommendation,
- tests cover incomplete and contradictory paths.

### Milestone 9 — Report Model

Tasks:

- define `ScreeningReport`,
- implement report creation from session,
- implement recommendations,
- include mandatory disclaimer,
- include warning aggregation.

Acceptance criteria:

- every report includes disclaimer,
- report model is sufficient for mobile PDF rendering,
- report creation is fixture-tested.

### Milestone 10 — Validation Readiness

Tasks:

- add protocol versioning,
- add deterministic fixtures,
- document scoring assumptions,
- improve boundary tests,
- add changelog/release notes for algorithm changes.

Acceptance criteria:

- validation team can reproduce results from fixtures,
- protocol/scoring versions are visible in results,
- clinically sensitive changes are reviewable.

---

## 18. Documentation Requirements

Each module should have short documentation covering:

- purpose,
- public exports,
- important types,
- known limitations,
- examples,
- validation notes.

Recommended docs inside package or central docs:

```text
docs/mobile-lib/acuity.md
docs/mobile-lib/refraction.md
docs/mobile-lib/template-generator.md
docs/mobile-lib/reliability.md
docs/mobile-lib/reporting.md
```

At minimum, `packages/mobile-lib/README.md` should explain:

- what belongs in the library,
- what belongs in the app,
- how to run tests,
- how to add a module,
- how to update protocol versions.

---

## 19. Risks and Mitigations

| Risk                                       | Mitigation                                                            |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Library becomes app-specific               | Keep native/app integrations out; enforce dependency rules            |
| Algorithms change without traceability     | Version protocols and scoring functions                               |
| Geometry errors produce bad templates      | Unit tests, dimension snapshots, calibration square, validation rules |
| Duplicate React Native dependency          | Keep React and React Native as peer dependencies                      |
| Clinical output overclaims accuracy        | Recommendation rules and disclaimers built into report model          |
| Randomized protocols are hard to reproduce | Seeded randomization and stored trial data                            |
| Incomplete sessions crash scoring          | Explicit incomplete states and validation results                     |
| App imports deep internals                 | Export stable public API from `src/index.ts`                          |

---

## 20. Definition of Done for MVP Mobile Library

The MVP mobile library is complete when:

- `@hiperhealth/hphvision-lib` exports stable domain models,
- triage questions and blocking rules are implemented,
- device profile validation and manual fallback helpers are implemented,
- template geometry generator produces A4 and US Letter document models,
- acuity protocol can run and score fixture sessions,
- refraction prototype can run and produce estimate ranges,
- reliability scoring generates normalized score and warnings,
- report model includes mandatory clinical disclaimer,
- all important outputs carry protocol/scoring versions,
- `yarn mobile-lib:lint`, `yarn mobile-lib:typecheck`, and `yarn mobile-lib:test` pass,
- the mobile app can consume the library without deep imports or duplicate React Native dependencies.
