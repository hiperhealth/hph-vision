import {describe, expect, it} from '@jest/globals';

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
});
