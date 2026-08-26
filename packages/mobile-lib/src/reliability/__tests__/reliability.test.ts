import {describe, expect, it} from '@jest/globals';

import {calculateReliability} from '..';

describe('calculateReliability', () => {
  it('marks a perfect session as highly reliable', () => {
    const result = calculateReliability({
      completionRate: 1,
      repeatedAnswerConsistency: 1,
      voiceConfidence: 1,
      distanceConfidence: 1,
      tiltConfidence: 1,
      ambientLightScore: 1,
      contradictionScore: 0,
    });

    expect(result.level).toBe('high');
    expect(result.score).toBe(1);
    expect(result.warnings).toHaveLength(0);
  });

  it('marks a low quality session as low', () => {
    const result = calculateReliability({
      completionRate: 1,
      repeatedAnswerConsistency: 0.2,
      voiceConfidence: 0.2,
      distanceConfidence: 0.2,
      tiltConfidence: 0.2,
      ambientLightScore: 0.2,
      contradictionScore: 0,
    });

    expect(result.level).toBe('low');
    expect(result.score).toBeCloseTo(0.48);
  });

  it('handles missing optional sensor data using defaults', () => {
    const result = calculateReliability({});

    expect(result.level).toBe('high');
    expect(result.score).toBe(1);
    expect(result.warnings).toHaveLength(0);
  });

  it('reduces score and warns when contradiction score is high', () => {
    const result = calculateReliability({
      completionRate: 1,
      contradictionScore: 0.8,
    });

    expect(result.score).toBeCloseTo(0.8);
    expect(
      result.warnings.some(w => w.code === 'reliability.contradictory_answers'),
    ).toBe(true);
  });

  it('warns when session completion rate is low', () => {
    const result = calculateReliability({
      completionRate: 0.5,
    });

    const lowCompletionWarning = result.warnings.find(
      w => w.code === 'reliability.low_completion',
    );
    expect(lowCompletionWarning).toBeDefined();
    expect(lowCompletionWarning?.severity).toBe('warning');
  });

  it('marks very low quality sessions invalid', () => {
    const result = calculateReliability({
      completionRate: 0,
      contradictionScore: 1,
      repeatedAnswerConsistency: 0,
      voiceConfidence: 0,
      distanceConfidence: 0,
      tiltConfidence: 0,
      ambientLightScore: 0,
    });

    expect(result.level).toBe('invalid');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns and reduces score when many trials are skipped', () => {
    const result = calculateReliability({
      skippedTrialsRate: 0.8,
    });

    expect(result.score).toBeLessThan(1);
    expect(
      result.warnings.some(w => w.code === 'reliability.skipped_trials'),
    ).toBe(true);
  });

  it('warns and reduces score when session is aborted', () => {
    const result = calculateReliability({
      abortedFlow: true,
    });

    expect(result.score).toBeLessThan(1);
    expect(
      result.warnings.some(w => w.code === 'reliability.aborted_flow'),
    ).toBe(true);
  });

  it('scores ideal response time higher than extreme values', () => {
    const ideal = calculateReliability({medianResponseTimeMs: 1500});
    const tooFast = calculateReliability({medianResponseTimeMs: 50});
    const tooSlow = calculateReliability({medianResponseTimeMs: 12000});

    expect(ideal.score).toBeGreaterThan(tooFast.score);
    expect(ideal.score).toBeGreaterThan(tooSlow.score);
  });
});
