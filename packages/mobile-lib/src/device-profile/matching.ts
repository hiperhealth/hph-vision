import {DEVICE_PROFILES} from './database';
import type {
  DeviceDetectionInput,
  DeviceProfile,
  DeviceProfileMatch,
  PhoneGeometry,
} from './types';

export const normalizeDeviceModelName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const scoreProfile = (
  input: DeviceDetectionInput,
  profile: DeviceProfile,
): number => {
  const manufacturer = normalizeDeviceModelName(input.manufacturer ?? '');
  const model = normalizeDeviceModelName(input.modelName ?? '');
  const modelNumber = normalizeDeviceModelName(input.modelNumber ?? '');
  const profileManufacturer = normalizeDeviceModelName(profile.manufacturer);
  const profileModel = normalizeDeviceModelName(profile.modelName);
  const profileModelNumber = normalizeDeviceModelName(
    profile.modelNumber ?? '',
  );

  let score = 0;
  if (manufacturer && profileManufacturer.includes(manufacturer)) {
    score += 0.25;
  }
  if (model && (profileModel.includes(model) || model.includes(profileModel))) {
    score += 0.5;
  }
  if (modelNumber && profileModelNumber && profileModelNumber === modelNumber) {
    score += 0.25;
  }
  if (
    input.screenWidthPx &&
    input.screenHeightPx &&
    input.screenWidthPx === profile.screenWidthPx &&
    input.screenHeightPx === profile.screenHeightPx
  ) {
    score += 0.15;
  }

  return Math.min(score, 1);
};

export const matchDeviceProfile = (
  input: DeviceDetectionInput,
  profiles: DeviceProfile[] = DEVICE_PROFILES,
): DeviceProfileMatch => {
  const ranked = profiles
    .map(profile => ({profile, score: scoreProfile(input, profile)}))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];

  if (!best || best.score < 0.35) {
    return {
      confidence: 0,
      reason:
        'No confident profile match was found. Manual dimensions are required.',
      alternatives: ranked.slice(0, 3).map(item => item.profile),
      requiresManualConfirmation: true,
    };
  }

  return {
    profile: best.profile,
    confidence: best.score,
    reason:
      best.score >= 0.75
        ? 'Detected device strongly matched a known profile.'
        : 'Detected device partially matched a known profile and requires confirmation.',
    alternatives: ranked.slice(1, 4).map(item => item.profile),
    requiresManualConfirmation: best.score < 0.75,
  };
};

export const toPhoneGeometry = (profile: DeviceProfile): PhoneGeometry => ({
  modelName: profile.modelName,
  bodyWidthMm: profile.bodyWidthMm,
  bodyHeightMm: profile.bodyHeightMm,
  thicknessMm: profile.thicknessMm,
  screenWidthMm: profile.screenWidthMm,
  screenHeightMm: profile.screenHeightMm,
  screenOffsetXmm: profile.activeDisplayOffsetXmm,
  screenOffsetYmm: profile.activeDisplayOffsetYmm,
});
