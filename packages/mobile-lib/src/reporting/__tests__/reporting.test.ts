import {describe, expect, it} from '@jest/globals';

import {fixtureAcuityResult} from '../../fixtures';
import {calculateReliability} from '../../reliability';
import {createEmptyTestSession} from '../../session';
import {SCREENING_DISCLAIMER} from '../../types';
import {createScreeningReport} from '..';

describe('createScreeningReport', () => {
  it('always includes the screening disclaimer', () => {
    const session = {
      ...createEmptyTestSession('session-1', '2026-05-12T00:00:00Z'),
      acuityResults: [fixtureAcuityResult],
      reliability: calculateReliability({completionRate: 1}),
    };

    expect(createScreeningReport(session).disclaimer).toBe(
      SCREENING_DISCLAIMER,
    );
  });
});
