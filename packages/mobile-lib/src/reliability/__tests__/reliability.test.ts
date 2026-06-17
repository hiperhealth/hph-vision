import {describe, expect, it} from '@jest/globals';

import {calculateReliability} from '..';

describe('calculateReliability', () => {
  it('marks very low quality sessions invalid', () => {
    const result = calculateReliability({
      completionRate: 0,
      contradictionScore: 1,
    });

    expect(result.level).toBe('invalid');
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
