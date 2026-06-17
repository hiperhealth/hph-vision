import type {ResultRecommendation} from '../types';
import type {RecommendationInput} from './types';

export const determineRecommendation = (
  input: RecommendationInput,
): ResultRecommendation => {
  if (input.hasRedFlags) {
    return 'professional_exam_recommended';
  }
  if (input.completed === false) {
    return 'repeat_test';
  }
  if ((input.reliabilityScore ?? 0) < 0.35) {
    return 'invalid_result';
  }
  if (
    (input.reliabilityScore ?? 0) < 0.6 ||
    (input.refractionConfidence ?? 0) < 0.6
  ) {
    return 'clinician_review_recommended';
  }
  return 'clinician_review_recommended';
};
