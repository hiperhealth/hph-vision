import {invalid, valid, validationIssue, type ValidationResult} from './result';

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const validatePositiveNumber = (
  value: unknown,
  field: string,
): ValidationResult<number> => {
  if (!isFiniteNumber(value)) {
    return invalid([
      validationIssue(
        'not_a_number',
        `${field} must be a finite number.`,
        field,
      ),
    ]);
  }

  if (value <= 0) {
    return invalid([
      validationIssue(
        'not_positive',
        `${field} must be greater than zero.`,
        field,
      ),
    ]);
  }

  return valid(value);
};

export const validateNumberRange = (
  value: unknown,
  field: string,
  min: number,
  max: number,
): ValidationResult<number> => {
  const positive = validatePositiveNumber(value, field);
  if (!positive.ok) {
    return positive;
  }

  if (positive.value < min || positive.value > max) {
    return invalid([
      validationIssue(
        'out_of_range',
        `${field} must be between ${min} and ${max}.`,
        field,
      ),
    ]);
  }

  return positive;
};

export const roundToStep = (value: number, step: number): number =>
  Math.round(value / step) * step;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
