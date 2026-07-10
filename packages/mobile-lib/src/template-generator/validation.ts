import type {PhoneGeometry} from '../device-profile';
import {
  combineValidationResults,
  invalid,
  valid,
  validateNumberRange,
  validationIssue,
  type ValidationResult,
} from '../validation';
import type {TemplateOptions} from './types';

export const validateTemplateOptions = (
  options: TemplateOptions,
): ValidationResult<TemplateOptions> => {
  const combined = combineValidationResults(
    validateNumberRange(
      options.cardboardThicknessMm,
      'cardboardThicknessMm',
      0.5,
      8,
    ),
    validateNumberRange(
      options.eyeToScreenDistanceMm,
      'eyeToScreenDistanceMm',
      80,
      600,
    ),
  );

  const errors = combined.ok ? [] : [...combined.errors];
  if (options.pageSize !== 'A4' && options.pageSize !== 'LETTER') {
    errors.push(
      validationIssue(
        'invalid_page_size',
        'Page size must be A4 or LETTER.',
        'pageSize',
      ),
    );
  }

  return errors.length > 0
    ? invalid(errors, combined.warnings)
    : valid(options, combined.warnings);
};

export const validatePhoneGeometry = (
  phone: PhoneGeometry,
): ValidationResult<PhoneGeometry> => {
  const combined = combineValidationResults(
    validateNumberRange(phone.bodyWidthMm, 'bodyWidthMm', 40, 120),
    validateNumberRange(phone.bodyHeightMm, 'bodyHeightMm', 80, 230),
    validateNumberRange(phone.thicknessMm, 'thicknessMm', 3, 25),
  );

  const errors = combined.ok ? [] : [...combined.errors];
  if (!phone.modelName.trim()) {
    errors.push(
      validationIssue(
        'missing_model_name',
        'Model name is required.',
        'modelName',
      ),
    );
  }

  return errors.length > 0
    ? invalid(errors, combined.warnings)
    : valid(phone, combined.warnings);
};
