import {
  combineValidationResults,
  invalid,
  valid,
  validateNumberRange,
  validationIssue,
  type ValidationResult,
} from '../validation';
import type {DeviceProfile} from './types';

export const validateDeviceProfile = (
  profile: DeviceProfile,
): ValidationResult<DeviceProfile> => {
  const results = [
    validateNumberRange(profile.bodyWidthMm, 'bodyWidthMm', 40, 120),
    validateNumberRange(profile.bodyHeightMm, 'bodyHeightMm', 80, 230),
    validateNumberRange(profile.thicknessMm, 'thicknessMm', 3, 25),
    validateNumberRange(profile.screenWidthPx, 'screenWidthPx', 100, 10000),
    validateNumberRange(profile.screenHeightPx, 'screenHeightPx', 100, 10000),
    validateNumberRange(profile.pixelDensity, 'pixelDensity', 0.5, 10),
  ];

  const combined = combineValidationResults(...results);
  const errors = combined.ok ? [] : [...combined.errors];

  if (!profile.id.trim()) {
    errors.push(
      validationIssue('missing_id', 'Device profile id is required.', 'id'),
    );
  }
  if (!profile.manufacturer.trim()) {
    errors.push(
      validationIssue(
        'missing_manufacturer',
        'Manufacturer is required.',
        'manufacturer',
      ),
    );
  }
  if (!profile.modelName.trim()) {
    errors.push(
      validationIssue('missing_model', 'Model name is required.', 'modelName'),
    );
  }
  if (!profile.templateFamily.trim()) {
    errors.push(
      validationIssue(
        'missing_template_family',
        'Template family is required.',
        'templateFamily',
      ),
    );
  }

  return errors.length > 0
    ? invalid(errors, combined.warnings)
    : valid(profile, combined.warnings);
};
