import { describe, expect, it } from '@jest/globals';

import {
  createAcuitySession,
  nextAcuityTrial,
  recordAcuityResponse,
  scoreAcuitySession,
} from '..';

describe('acuity protocol', () => {
  it('records responses and scores a completed session', () => {
    let session = createAcuitySession({
      id: 'test-acuity',
      eye: 'right',
      practiceTrials: 0,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    for (const trial of session.trials) {
      session = recordAcuityResponse(session, {
        trialId: trial.id,
        answer: trial.orientation,
        inputMethod: 'touch',
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    expect(nextAcuityTrial(session)).toBeUndefined();
    expect(scoreAcuitySession(session)).toMatchObject({
      completed: true,
      confidence: 1,
      logMarEstimate: 0.3,
    });
  });

  // All Incorrect Responses
  it('return warnings when all responses are incorrect', () => {
    let session = createAcuitySession({
      id: 'all-incorrect',
      eye: 'right',
      practiceTrials: 0,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    for (const trial of session.trials) {
      session = recordAcuityResponse(session, {
        trialId: trial.id,
        answer: trial.orientation === 'up' ? 'down' : 'up',
        inputMethod: 'touch',
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreAcuitySession(session);

    expect(result).toMatchObject({
      completed: true,
      confidence: 0.4,
      logMarEstimate: undefined,
      snellenEquivalent: undefined,
    });

    expect(result.reliabilityWarnings).toContain('no_correct_acuity_trials');
  });

  // Incomplete Session
  it('returns incomplete warning when session is not completed', () => {
    let session = createAcuitySession({
      id: 'incomplete-session',
      eye: 'right',
      practiceTrials: 0,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    const firstTrial = session.trials[0];

    session = recordAcuityResponse(session, {
      trialId: firstTrial.id,
      answer: firstTrial.orientation,
      inputMethod: 'touch',
      createdAt: '2026-05-12T00:00:00Z',
    });

    const result = scoreAcuitySession(session);

    expect(result.completed).toBe(false);

    expect(result.reliabilityWarnings).toContain('acuity_session_incomplete');

    expect(result.confidence).toBeLessThan(1);
  });

  // No Responses At All
  it('returns no response warnings when no responses are recorded', () => {
    const session = createAcuitySession({
      id: 'no-responses',
      eye: 'right',
      practiceTrials: 0,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    const result = scoreAcuitySession(session);

    expect(result).toMatchObject({
      completed: false,
      confidence: 0,
      logMarEstimate: undefined,
      snellenEquivalent: undefined,
    });

    expect(result.reliabilityWarnings).toContain('acuity_session_incomplete');

    expect(result.reliabilityWarnings).toContain('no_correct_acuity_trials');
  });

  // Low Voice Confidence
  it('returns low voice confidence warning', () => {
    let session = createAcuitySession({
      id: 'low-voice-confidence',
      eye: 'right',
      practiceTrials: 0,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    for (const trial of session.trials) {
      session = recordAcuityResponse(session, {
        trialId: trial.id,
        answer: trial.orientation,
        inputMethod: 'voice',
        confidence: 0.5,
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreAcuitySession(session);

    expect(result).toMatchObject({
      completed: true,
      confidence: 1,
      logMarEstimate: 0.3,
    });

    expect(result.reliabilityWarnings).toContain('low_voice_confidence');
  });

  // Mixed Correct and Incorrect Responses
  it('scores session with mixed correct and incorrect responses', () => {
    let session = createAcuitySession({
      id: 'mixed-responses',
      eye: 'right',
      practiceTrials: 0,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    session = recordAcuityResponse(session, {
      trialId: session.trials[0].id,
      answer: session.trials[0].orientation,
      inputMethod: 'touch',
      createdAt: '2026-05-12T00:00:00Z',
    });

    session = recordAcuityResponse(session, {
      trialId: session.trials[1].id,
      answer: session.trials[1].orientation === 'up' ? 'down' : 'up',
      inputMethod: 'touch',
      createdAt: '2026-05-12T00:00:00Z',
    });

    const result = scoreAcuitySession(session);

    expect(result).toMatchObject({
      completed: true,
      confidence: 0.7,
      logMarEstimate: session.trials[0].sizeLogMar,
    });

    expect(result.reliabilityWarnings).toHaveLength(0);
  });

  // Practice Trials Ignored
  it('ignores practice trials when scoring', () => {
    let session = createAcuitySession({
      id: 'practice-trials',
      eye: 'right',
      practiceTrials: 2,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    for (const trial of session.trials) {
      session = recordAcuityResponse(session, {
        trialId: trial.id,
        answer: trial.isPractice
          ? trial.orientation === 'up'
            ? 'down'
            : 'up'
          : trial.orientation,
        inputMethod: 'touch',
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreAcuitySession(session);

    expect(result).toMatchObject({
      completed: true,
      confidence: 1,
      logMarEstimate: 0.3,
    });

    expect(session.trials.some(trial => trial.isPractice)).toBe(true);

    expect(result.reliabilityWarnings).toHaveLength(0);
  });

  // Boundary Test for Voice Confidence
  // Test 1: Confidence = 0.64 (Warning Expected)
  it('returns warning when voice confidence is below threshold', () => {
    let session = createAcuitySession({
      id: 'voice-confidence-064',
      eye: 'right',
      practiceTrials: 0,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    for (const trial of session.trials) {
      session = recordAcuityResponse(session, {
        trialId: trial.id,
        answer: trial.orientation,
        inputMethod: 'voice',
        confidence: 0.64,
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreAcuitySession(session);

    expect(result.reliabilityWarnings).toContain('low_voice_confidence');
  });

  //Test 2: Confidence = 0.65 (No Warning Expected)
  it('does not return warning when voice confidence is exactly at threshold', () => {
    let session = createAcuitySession({
      id: 'voice-confidence-065',
      eye: 'right',
      practiceTrials: 0,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    for (const trial of session.trials) {
      session = recordAcuityResponse(session, {
        trialId: trial.id,
        answer: trial.orientation,
        inputMethod: 'voice',
        confidence: 0.65,
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreAcuitySession(session);

    expect(result.reliabilityWarnings).not.toContain('low_voice_confidence');
  });
});
