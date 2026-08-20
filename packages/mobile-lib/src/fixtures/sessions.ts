import {createEmptyTestSession} from '../session';
import {fixtureAcuityResult} from './acuitySessions';
import {fixtureRefractionResult} from './refractionSessions';

// minimal session containing only onboarding and triage data — no test results
export const fixtureSessionOnboardingOnly = createEmptyTestSession(
  'fixture-session-onboarding',
  '2026-05-12T00:00:00Z',
);

// session with acuity result only
export const fixtureSessionAcuityOnly = {
  ...createEmptyTestSession('fixture-session-acuity', '2026-05-12T00:00:00Z'),
  patientContext: {ageRange: '30-39', currentGlasses: false},
  environment: {screenBrightness: 1.0, distanceConfidence: 0.95},
  acuityResults: [fixtureAcuityResult],
  reliabilityScore: 0.88,
};

// session with refraction result only
export const fixtureSessionRefractionOnly = {
  ...createEmptyTestSession(
    'fixture-session-refraction',
    '2026-05-12T00:00:00Z',
  ),
  patientContext: {currentGlasses: true, previousPrescription: true},
  environment: {screenBrightness: 1.0, distanceConfidence: 0.9},
  refractionResult: fixtureRefractionResult,
  reliabilityScore: 0.72,
};

// complete session with both acuity and refraction results
export const fixtureSessionComplete = {
  ...createEmptyTestSession('fixture-session-complete', '2026-05-12T00:00:00Z'),
  completedAt: '2026-05-12T00:08:42Z',
  patientContext: {
    ageRange: '40-49',
    currentGlasses: true,
    previousPrescription: true,
  },
  environment: {
    ambientLightLux: 320,
    screenBrightness: 1.0,
    distanceConfidence: 0.97,
    tiltConfidence: 0.98,
  },
  acuityResults: [fixtureAcuityResult],
  refractionResult: fixtureRefractionResult,
  reliabilityScore: 0.91,
  warnings: [],
};
