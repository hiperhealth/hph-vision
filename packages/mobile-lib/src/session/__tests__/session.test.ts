import {describe, expect, it} from '@jest/globals';
import {
  createEmptyTestSession,
  validateReliabilityScore,
  validateEyeRefractionEstimate,
  validateRefractionResult,
  validateTestSession,
} from '..';
import {
  fixtureSessionOnboardingOnly,
  fixtureSessionAcuityOnly,
  fixtureSessionRefractionOnly,
  fixtureSessionComplete,
} from '../../fixtures';

// --- serialization ---

describe('TestSession serialization', () => {
  it('serializes an onboarding-only session and recovers it via json round-trip', () => {
    const serialized = JSON.stringify(fixtureSessionOnboardingOnly);
    const restored = JSON.parse(serialized);
    expect(restored.id).toBe(fixtureSessionOnboardingOnly.id);
    expect(restored.createdAt).toBe(fixtureSessionOnboardingOnly.createdAt);
    expect(restored.acuityResults).toEqual([]);
    expect(restored.refractionResult).toBeUndefined();
  });

  it('serializes a complete session without losing nested fields', () => {
    const serialized = JSON.stringify(fixtureSessionComplete);
    const restored = JSON.parse(serialized);
    expect(restored.id).toBe(fixtureSessionComplete.id);
    expect(restored.completedAt).toBe(fixtureSessionComplete.completedAt);
    expect(restored.patientContext.ageRange).toBe('40-49');
    expect(restored.environment.ambientLightLux).toBe(320);
    expect(restored.acuityResults.length).toBe(1);
    expect(restored.refractionResult).toBeDefined();
    expect(restored.reliabilityScore).toBe(0.91);
  });

  it('stable json key order across repeated serializations', () => {
    const first = JSON.stringify(fixtureSessionComplete);
    const second = JSON.stringify(JSON.parse(first));
    expect(first).toBe(second);
  });

  // partial sessions

  it('a session with acuity only is a valid partial session', () => {
    expect(fixtureSessionAcuityOnly.acuityResults.length).toBeGreaterThan(0);
    expect(fixtureSessionAcuityOnly.refractionResult).toBeUndefined();
  });

  it('a session with refraction only is a valid partial session', () => {
    expect(fixtureSessionRefractionOnly.refractionResult).toBeDefined();
    expect(fixtureSessionRefractionOnly.acuityResults).toEqual([]);
  });
});

// --- validateReliabilityScore ---

describe('validateReliabilityScore', () => {
  it('accepts 0 and 1 as valid boundary scores', () => {
    expect(validateReliabilityScore(0).ok).toBe(true);
    expect(validateReliabilityScore(1).ok).toBe(true);
  });

  it('accepts a typical mid-range score', () => {
    const result = validateReliabilityScore(0.75);
    expect(result.ok).toBe(true);
  });

  it('rejects a score above 1', () => {
    const result = validateReliabilityScore(1.01);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe('reliability_score_out_of_range');
    }
  });

  it('rejects a negative score', () => {
    const result = validateReliabilityScore(-0.1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe('reliability_score_out_of_range');
    }
  });

  it('rejects non-numeric and NaN values', () => {
    expect(validateReliabilityScore('high').ok).toBe(false);
    expect(validateReliabilityScore(null).ok).toBe(false);
    expect(validateReliabilityScore(NaN).ok).toBe(false);
    expect(validateReliabilityScore(Infinity).ok).toBe(false);
  });
});

// --- validateEyeRefractionEstimate ---

describe('validateEyeRefractionEstimate', () => {
  it('accepts an estimate with no confidence intervals', () => {
    const result = validateEyeRefractionEstimate({sphere: -1.5}, 'rightEye');
    expect(result.ok).toBe(true);
  });

  it('accepts valid confidence interval tuples', () => {
    const result = validateEyeRefractionEstimate(
      {
        sphere: -1.0,
        confidenceInterval: {
          sphere: [-1.5, -0.5],
          cylinder: [-0.25, 0.25],
          axis: [75, 105],
        },
      },
      'rightEye',
    );
    expect(result.ok).toBe(true);
  });

  it('rejects a range where min > max', () => {
    const result = validateEyeRefractionEstimate(
      {confidenceInterval: {sphere: [1.0, -1.0]}},
      'rightEye',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe('invalid_refraction_range_order');
    }
  });

  it('rejects a range that is not a two-element array', () => {
    const result = validateEyeRefractionEstimate(
      {confidenceInterval: {sphere: [-1.0] as unknown as [number, number]}},
      'rightEye',
    );
    expect(result.ok).toBe(false);
  });

  it('rejects a range with non-finite values', () => {
    const result = validateEyeRefractionEstimate(
      {confidenceInterval: {cylinder: [-Infinity, 0]}},
      'leftEye',
    );
    expect(result.ok).toBe(false);
  });
});

// --- validateRefractionResult ---

describe('validateRefractionResult', () => {
  it('accepts a valid refraction result with no ranges', () => {
    const result = validateRefractionResult({
      rightEye: {sphere: -1.0},
      confidence: 0.9,
      recommendation: 'clinician_review_recommended',
      reliabilityWarnings: [],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a confidence value outside [0, 1]', () => {
    const result = validateRefractionResult({
      confidence: 1.5,
      recommendation: 'clinician_review_recommended',
      reliabilityWarnings: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe('invalid_refraction_confidence');
    }
  });

  it('rejects invalid ranges in the right eye estimate', () => {
    const result = validateRefractionResult({
      rightEye: {confidenceInterval: {sphere: [1.0, -1.0]}},
      confidence: 0.8,
      recommendation: 'clinician_review_recommended',
      reliabilityWarnings: [],
    });
    expect(result.ok).toBe(false);
  });
});

// --- validateTestSession ---

describe('validateTestSession', () => {
  it('accepts an onboarding-only session with reliability score 0', () => {
    const result = validateTestSession(fixtureSessionOnboardingOnly);
    expect(result.ok).toBe(true);
  });

  it('accepts a complete session', () => {
    const result = validateTestSession(fixtureSessionComplete);
    expect(result.ok).toBe(true);
  });

  it('rejects a session with a missing id', () => {
    const bad = {...fixtureSessionOnboardingOnly, id: ''};
    const result = validateTestSession(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe('missing_session_id');
    }
  });

  it('rejects a session with an invalid reliability score', () => {
    const bad = {...fixtureSessionOnboardingOnly, reliabilityScore: 1.5};
    const result = validateTestSession(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some(e => e.code === 'reliability_score_out_of_range'),
      ).toBe(true);
    }
  });

  it('rejects a session with bad refraction ranges', () => {
    const bad = {
      ...fixtureSessionOnboardingOnly,
      refractionResult: {
        rightEye: {
          confidenceInterval: {sphere: [1.0, -1.0] as [number, number]},
        },
        confidence: 0.8,
        recommendation: 'clinician_review_recommended' as const,
        reliabilityWarnings: [],
      },
    };
    const result = validateTestSession(bad);
    expect(result.ok).toBe(false);
  });

  // acceptance criteria from issue #9

  it('a session can exist with only onboarding and triage data', () => {
    const session = {
      ...createEmptyTestSession('onboarding-only', new Date().toISOString()),
      triageResult: {
        canContinueSelfTest: true,
        redFlags: [],
        recommendation: 'continue' as const,
        warnings: [],
        unansweredQuestionIds: [],
      },
    };
    const result = validateTestSession(session);
    expect(result.ok).toBe(true);
    expect(session.acuityResults).toEqual([]);
    expect(session.refractionResult).toBeUndefined();
  });

  it('a session can include acuity result only', () => {
    const result = validateTestSession(fixtureSessionAcuityOnly);
    expect(result.ok).toBe(true);
    expect(fixtureSessionAcuityOnly.acuityResults.length).toBeGreaterThan(0);
    expect(fixtureSessionAcuityOnly.refractionResult).toBeUndefined();
  });

  it('a session can include refraction result only', () => {
    const result = validateTestSession(fixtureSessionRefractionOnly);
    expect(result.ok).toBe(true);
    expect(fixtureSessionRefractionOnly.refractionResult).toBeDefined();
    expect(fixtureSessionRefractionOnly.acuityResults).toEqual([]);
  });

  it('a session can include both acuity and refraction results', () => {
    const result = validateTestSession(fixtureSessionComplete);
    expect(result.ok).toBe(true);
    expect(fixtureSessionComplete.acuityResults.length).toBeGreaterThan(0);
    expect(fixtureSessionComplete.refractionResult).toBeDefined();
  });
});
