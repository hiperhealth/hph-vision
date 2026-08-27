import type {PhoneGeometry} from '../device-profile';
import {
  combineValidationResults,
  invalid,
  valid,
  validateNumberRange,
  ValidationIssue,
  validationIssue,
  type ValidationResult,
} from '../validation';
import type {TemplateOptions, AssemblyInstruction} from './types';
import {getPageDimensions} from './pages';

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

export const validatePageFit = (
  phone: PhoneGeometry,
  options: TemplateOptions,
): ValidationResult<undefined> => {
  const {widthMm, heightMm} = getPageDimensions(options.pageSize);
  const marginMm = 10;
  const clearanceMm = 2;
  const errors: ValidationIssue[] = [];

  if (phone.bodyWidthMm + clearanceMm + 2 * marginMm > widthMm) {
    errors.push(
      validationIssue(
        'phone_too_large_for_page',
        `phone width (${phone.bodyWidthMm}mm) is too large for ${options.pageSize} page`,
        'bodyWidthMm',
      ),
    );
  }

  if (phone.bodyHeightMm + clearanceMm + 2 * marginMm > heightMm) {
    errors.push(
      validationIssue(
        'phone_too_large_for_page',
        `phone height (${phone.bodyHeightMm}mm) is too large for ${options.pageSize} page`,
        'bodyHeightMm',
      ),
    );
  }

  return errors.length > 0 ? invalid(errors) : valid(undefined);
};

const MIN_SLOT_CLEARANCE_MM = 1.0;

export const validateSlotTolerance = (
  clearanceMm: number,
): ValidationResult<number> => {
  if (clearanceMm < MIN_SLOT_CLEARANCE_MM) {
    return invalid([
      validationIssue(
        'slot_tolerance_too_small',
        `Slot clearance (${clearanceMm}mm) is below the minimum safe tolerance of ${MIN_SLOT_CLEARANCE_MM}mm.`,
        'clearanceMm',
      ),
    ]);
  }
  return valid(clearanceMm);
};

const MIN_GLUE_TAB_WIDTH_MM = 5;
const MIN_GLUE_TAB_HEIGHT_MM = 20;

export const validateGlueTabSize = (
  widthMm: number,
  heightMm: number,
): ValidationResult<undefined> => {
  if (widthMm < MIN_GLUE_TAB_WIDTH_MM || heightMm < MIN_GLUE_TAB_HEIGHT_MM) {
    return invalid([
      validationIssue(
        'glue_tab_too_small',
        `Glue tab (${widthMm}×${heightMm}mm) is below the minimum size of ${MIN_GLUE_TAB_WIDTH_MM}×${MIN_GLUE_TAB_HEIGHT_MM}mm.`,
        'glueTab',
      ),
    ]);
  }
  return valid(undefined);
};

export const validateAssemblyInstructions = (
  instructions: AssemblyInstruction[],
  required: boolean,
): ValidationResult<undefined> => {
  if (required && instructions.length === 0) {
    return invalid([
      validationIssue(
        'required_assembly_instruction_missing',
        'Assembly instructions are required but none were generated.',
        'instructions',
      ),
    ]);
  }
  return valid(undefined);
};
