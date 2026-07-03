import {clamp} from '../validation';
import {normalizeReliabilitySignals} from './signals';
import type {ReliabilityResult, ReliabilitySignals} from './types';

export const calculateReliability = (
  signals: ReliabilitySignals,
): ReliabilityResult => {
  const normalized = normalizeReliabilitySignals(signals);
  const positiveScore =
    normalized.repeatedAnswerConsistency * 0.2 +
    normalized.voiceConfidence * 0.15 +
    normalized.distanceConfidence * 0.15 +
    normalized.tiltConfidence * 0.15 +
    normalized.ambientLightScore * 0.1 +
    normalized.completionRate * 0.25;
  const score = clamp(
    positiveScore - normalized.contradictionScore * 0.25,
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
