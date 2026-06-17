import {describe, expect, it} from '@jest/globals';

import {
  getDeviceProfiles,
  matchDeviceProfile,
  toPhoneGeometry,
  validateDeviceProfile,
} from '..';

describe('device profile helpers', () => {
  it('validates fixture profiles', () => {
    for (const profile of getDeviceProfiles()) {
      expect(validateDeviceProfile(profile).ok).toBe(true);
    }
  });

  it('returns manual fallback for unknown devices', () => {
    const match = matchDeviceProfile({
      manufacturer: 'Unknown',
      modelName: 'Mystery',
    });

    expect(match.requiresManualConfirmation).toBe(true);
    expect(match.profile).toBeUndefined();
  });

  it('converts a profile to phone geometry', () => {
    const profile = getDeviceProfiles()[0];

    expect(toPhoneGeometry(profile)).toMatchObject({
      modelName: profile.modelName,
      bodyWidthMm: profile.bodyWidthMm,
    });
  });
});
