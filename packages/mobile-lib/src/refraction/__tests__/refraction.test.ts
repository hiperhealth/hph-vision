import {describe, expect, it} from '@jest/globals';

import {
  createRefractionSession,
  recordRefractionResponse,
  scoreRefractionSession,
} from '..';

describe('refraction protocol', () => {
  it('records comparison responses and returns an estimate', () => {
    let session = createRefractionSession({
      id: 'test-refraction',
      eye: 'left',
      maxTrials: 2,
    });

    for (const trial of session.trials) {
      session = recordRefractionResponse(session, {
        trialId: trial.id,
        answer: 'better',
        inputMethod: 'touch',
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreRefractionSession(session);

    expect(result.leftEye?.sphere).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
