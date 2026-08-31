import {describe, expect, it} from '@jest/globals';

import {
  createRefractionSession,
  normalizeRefractionAnswer,
  recordRefractionResponse,
  scoreRefractionSession,
} from '..';
import {roundToStep} from '../../validation';
import type {TestSession} from '../../session';

describe('refraction protocol and scoring', () => {
  it('records comparison responses and produces structured estimates with ranges', () => {
    let session = createRefractionSession({
      id: 'test-refraction-left',
      eye: 'left',
      initialSphere: -1.0,
      maxTrials: 8,
    });

    expect(session.trials.length).toBe(8);

    // Answer first 4 spherical trials with 'better' (Option A: +0.25, -0.25, +0.25, -0.25)
    for (let index = 0; index < 4; index += 1) {
      const trial = session.trials[index];
      session = recordRefractionResponse(session, {
        trialId: trial.id,
        answer: normalizeRefractionAnswer('better'),
        inputMethod: 'touch',
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    // Answer next 2 cylinder trials with 'one' (Option A: -0.25, -0.5)
    for (let index = 4; index < 6; index += 1) {
      const trial = session.trials[index];
      session = recordRefractionResponse(session, {
        trialId: trial.id,
        answer: normalizeRefractionAnswer('option 1'),
        inputMethod: 'voice',
        confidence: 0.9,
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    // Answer remaining axis trials with 'two' (Option B: -15, +15)
    for (let index = 6; index < 8; index += 1) {
      const trial = session.trials[index];
      session = recordRefractionResponse(session, {
        trialId: trial.id,
        answer: normalizeRefractionAnswer('option 2'),
        inputMethod: 'touch',
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    expect(session.completed).toBe(true);

    const result = scoreRefractionSession(session);

    expect(result.leftEye).toBeDefined();
    expect(result.rightEye).toBeUndefined();
    expect(result.binocular).toBeUndefined();

    const estimate = result.leftEye!;
    expect(estimate.sphere).toBeDefined();
    expect(estimate.cylinder).toBeDefined();
    expect(estimate.axis).toBeDefined();

    // Check ranges and confidence interval structure
    expect(estimate.sphereRange).toHaveLength(2);
    expect(estimate.cylinderRange).toHaveLength(2);
    expect(estimate.axisRange).toHaveLength(2);

    expect(estimate.sphereRange![0]).toBeLessThanOrEqual(estimate.sphere!);
    expect(estimate.sphereRange![1]).toBeGreaterThanOrEqual(estimate.sphere!);

    expect(estimate.sphericalEquivalent).toBe(
      roundToStep(estimate.sphere! + estimate.cylinder! / 2, 0.25),
    );

    expect(estimate.confidenceInterval?.sphere).toEqual(estimate.sphereRange);
    expect(estimate.confidenceInterval?.cylinder).toEqual(
      estimate.cylinderRange,
    );
    expect(estimate.confidenceInterval?.axis).toEqual(estimate.axisRange);

    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.recommendation).toBe('clinician_review_recommended');
  });

  it('supports right eye sessions', () => {
    let session = createRefractionSession({
      id: 'test-refraction-right',
      eye: 'right',
      maxTrials: 4,
    });

    for (const trial of session.trials) {
      session = recordRefractionResponse(session, {
        trialId: trial.id,
        answer: normalizeRefractionAnswer('option 2'),
        inputMethod: 'touch',
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreRefractionSession(session);
    expect(result.rightEye).toBeDefined();
    expect(result.leftEye).toBeUndefined();
  });

  it('handles uncertain and skipped responses appropriately', () => {
    let session = createRefractionSession({
      id: 'test-refraction-unknown',
      eye: 'left',
      maxTrials: 4,
    });

    for (const trial of session.trials) {
      session = recordRefractionResponse(session, {
        trialId: trial.id,
        answer: normalizeRefractionAnswer("I don't know"),
        inputMethod: 'voice',
        confidence: 0.4,
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreRefractionSession(session);
    expect(result.reliabilityWarnings).toContain('unknown_refraction_answers');
    expect(result.reliabilityWarnings).toContain('low_voice_confidence');
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('embeds cleanly into a TestSession domain object', () => {
    const session = createRefractionSession({
      id: 'refraction-session-embed',
      eye: 'binocular',
      maxTrials: 2,
    });
    const result = scoreRefractionSession(session);

    const testSession: TestSession = {
      id: 'session-001',
      createdAt: '2026-05-12T00:00:00Z',
      patientContext: {ageRange: '25-34'},
      environment: {ambientLightLux: 300},
      acuityResults: [],
      refractionResult: result,
      reliabilityScore: result.confidence,
      warnings: [],
    };

    expect(testSession.refractionResult).toBeDefined();
    expect(testSession.refractionResult?.binocular).toBeDefined();
  });
});
