import {
  combineValidationResults,
  invalid,
  valid,
  validationIssue,
  type ValidationResult,
} from '../validation';
import type {EyeRefractionEstimate, RefractionResult} from '../refraction';
import type {TestSession} from './types';

// validates that a reliability score is a finite number in [0, 1]
export const validateReliabilityScore = (
  score: unknown,
): ValidationResult<number> => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return invalid([
      validationIssue(
        'invalid_reliability_score',
        'reliabilityScore must be a finite number.',
        'reliabilityScore',
      ),
    ]);
  }
  if (score < 0 || score > 1) {
    return invalid([
      validationIssue(
        'reliability_score_out_of_range',
        'reliabilityScore must be between 0 and 1.',
        'reliabilityScore',
      ),
    ]);
  }
  return valid(score);
};

// validates a [min, max] refraction range tuple
const validateRefractionRange = (
  range: unknown,
  field: string,
): ValidationResult<[number, number]> => {
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    typeof range[0] !== 'number' ||
    typeof range[1] !== 'number'
  ) {
    return invalid([
      validationIssue(
        'invalid_refraction_range',
        field + ' must be a [min, max] tuple of two numbers.',
        field,
      ),
    ]);
  }

  const [min, max] = range as [number, number];
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return invalid([
      validationIssue(
        'invalid_refraction_range',
        field + ' values must be finite numbers.',
        field,
      ),
    ]);
  }

  if (min > max) {
    return invalid([
      validationIssue(
        'invalid_refraction_range_order',
        field + ' min (' + min + ') must not exceed max (' + max + ').',
        field,
      ),
    ]);
  }
  return valid([min, max]);
};

// validates refraction ranges inside a single eye estimate
export const validateEyeRefractionEstimate = (
  estimate: EyeRefractionEstimate,
  eyeLabel: string,
): ValidationResult<EyeRefractionEstimate> => {
  const checks: ValidationResult<unknown>[] = [];

  // top-level direct range fields
  if (estimate.sphereRange !== undefined) {
    checks.push(
      validateRefractionRange(estimate.sphereRange, eyeLabel + '.sphereRange'),
    );
  }
  if (estimate.cylinderRange !== undefined) {
    checks.push(
      validateRefractionRange(
        estimate.cylinderRange,
        eyeLabel + '.cylinderRange',
      ),
    );
  }
  if (estimate.axisRange !== undefined) {
    checks.push(
      validateRefractionRange(estimate.axisRange, eyeLabel + '.axisRange'),
    );
  }

  // nested confidence interval fields
  if (estimate.confidenceInterval?.sphere !== undefined) {
    checks.push(
      validateRefractionRange(
        estimate.confidenceInterval.sphere,
        eyeLabel + '.confidenceInterval.sphere',
      ),
    );
  }
  if (estimate.confidenceInterval?.cylinder !== undefined) {
    checks.push(
      validateRefractionRange(
        estimate.confidenceInterval.cylinder,
        eyeLabel + '.confidenceInterval.cylinder',
      ),
    );
  }
  if (estimate.confidenceInterval?.axis !== undefined) {
    checks.push(
      validateRefractionRange(
        estimate.confidenceInterval.axis,
        eyeLabel + '.confidenceInterval.axis',
      ),
    );
  }

  const combined = combineValidationResults(...checks);
  return combined.ok ? valid(estimate, combined.warnings) : combined;
};

// validates all eye estimates in a refraction result
export const validateRefractionResult = (
  result: RefractionResult,
): ValidationResult<RefractionResult> => {
  const checks: ValidationResult<unknown>[] = [];

  if (result.rightEye) {
    checks.push(validateEyeRefractionEstimate(result.rightEye, 'rightEye'));
  }
  if (result.leftEye) {
    checks.push(validateEyeRefractionEstimate(result.leftEye, 'leftEye'));
  }
  if (result.binocular) {
    checks.push(validateEyeRefractionEstimate(result.binocular, 'binocular'));
  }

  // check finite before range — NaN and Infinity pass a simple > / < guard
  if (
    typeof result.confidence !== 'number' ||
    !Number.isFinite(result.confidence)
  ) {
    checks.push(
      invalid([
        validationIssue(
          'invalid_refraction_confidence',
          'refractionResult.confidence must be a finite number.',
          'refractionResult.confidence',
        ),
      ]),
    );
  } else if (result.confidence < 0 || result.confidence > 1) {
    checks.push(
      invalid([
        validationIssue(
          'invalid_refraction_confidence',
          'refractionResult.confidence must be between 0 and 1.',
          'refractionResult.confidence',
        ),
      ]),
    );
  }

  const combined = combineValidationResults(...checks);
  return combined.ok ? valid(result, combined.warnings) : combined;
};

// validates all required fields and numeric constraints of a TestSession
export const validateTestSession = (
  session: TestSession,
): ValidationResult<TestSession> => {
  const checks: ValidationResult<unknown>[] = [];

  if (!session.id || typeof session.id !== 'string') {
    checks.push(
      invalid([
        validationIssue('missing_session_id', 'session id is required.', 'id'),
      ]),
    );
  }

  if (!session.createdAt || typeof session.createdAt !== 'string') {
    checks.push(
      invalid([
        validationIssue(
          'missing_created_at',
          'session createdAt is required.',
          'createdAt',
        ),
      ]),
    );
  }

  checks.push(validateReliabilityScore(session.reliabilityScore));

  if (session.refractionResult) {
    checks.push(validateRefractionResult(session.refractionResult));
  }

  const combined = combineValidationResults(...checks);
  return combined.ok ? valid(session, combined.warnings) : combined;
};
