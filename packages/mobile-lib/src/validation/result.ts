export type ValidationIssueSeverity = 'error' | 'warning';

export type ValidationIssue = {
  code: string;
  message: string;
  field?: string;
  severity: ValidationIssueSeverity;
};

export type ValidationResult<T> =
  | {
      ok: true;
      value: T;
      warnings: ValidationIssue[];
    }
  | {
      ok: false;
      errors: ValidationIssue[];
      warnings: ValidationIssue[];
    };

export const validationIssue = (
  code: string,
  message: string,
  field?: string,
  severity: ValidationIssueSeverity = 'error',
): ValidationIssue => ({code, message, field, severity});

export const valid = <T>(
  value: T,
  warnings: ValidationIssue[] = [],
): ValidationResult<T> => ({ok: true, value, warnings});

export const invalid = <T = never>(
  errors: ValidationIssue[],
  warnings: ValidationIssue[] = [],
): ValidationResult<T> => ({ok: false, errors, warnings});

export const combineValidationResults = (
  ...results: ValidationResult<unknown>[]
): ValidationResult<undefined> => {
  const errors = results.flatMap(result => (result.ok ? [] : result.errors));
  const warnings = results.flatMap(result => result.warnings);

  return errors.length > 0
    ? invalid(errors, warnings)
    : valid(undefined, warnings);
};
