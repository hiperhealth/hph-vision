import {clamp} from '../validation';
import {normalizeReliabilitySignals} from './signals';
import type {ReliabilityResult, ReliabilitySignals} from './types';

/**
 * Calculates a reliability score for a test session based on sensor signals.
 *
 * Score range: 0 (completely unreliable) to 1 (fully reliable).
 * Levels: 'high' (>=0.8), 'medium' (>=0.6), 'low' (>=0.35), 'invalid' (<0.35).
 *
 * @note Missing optional signals default to their ideal values,
 * so `calculateReliability({})` intentionally returns score=1 / level='high'.
 * This treats an unknown environment as trustworthy (opt-in degradation).
 */
export const calculateReliability = (
  signals: ReliabilitySignals,
): ReliabilityResult => {
  const normalized = normalizeReliabilitySignals(signals);
  const positiveScore =
    normalized.repeatedAnswerConsistency * 0.2 +
    normalized.voiceConfidence * 0.12 +
    normalized.distanceConfidence * 0.12 +
    normalized.tiltConfidence * 0.12 +
    normalized.ambientLightScore * 0.09 +
    normalized.completionRate * 0.25 +
    normalized.responseTimeScore * 0.1;
  const score = clamp(
    positiveScore -
      normalized.contradictionScore * 0.25 -
      normalized.skippedTrialsPenalty * 0.15 -
      normalized.abortedFlowPenalty * 0.1,
    0,
    1,
  );
  const level =
    score >= 0.8
      ? 'high'
      : score >= 0.6
      ? 'medium'
      : score >= 0.35
      ? 'low'
      : 'invalid';

  return {
    score,
    level,
    warnings: [
      ...(normalized.completionRate < 0.8
        ? [
            {
              code: 'reliability.low_completion',
              message: 'The test session was not completed.',
              severity: 'warning' as const,
              source: 'reliability',
            },
          ]
        : []),
      ...(normalized.contradictionScore > 0.4
        ? [
            {
              code: 'reliability.contradictory_answers',
              message: 'Answers were inconsistent across repeated prompts.',
              severity: 'warning' as const,
              source: 'reliability',
            },
          ]
        : []),
      ...(normalized.skippedTrialsPenalty > 0.3
        ? [
            {
              code: 'reliability.skipped_trials',
              message: 'A significant number of trials were skipped.',
              severity: 'warning' as const,
              source: 'reliability',
            },
          ]
        : []),
      ...(normalized.abortedFlowPenalty === 1
        ? [
            {
              code: 'reliability.aborted_flow',
              message: 'The test session was aborted before completion.',
              severity: 'warning' as const,
              source: 'reliability',
            },
          ]
        : []),
      ...(score < 0.35
        ? [
            {
              code: 'reliability.invalid_score',
              message:
                'The session reliability is too low to interpret confidently.',
              severity: 'critical' as const,
              source: 'reliability',
            },
          ]
        : []),
    ],
  };
};
