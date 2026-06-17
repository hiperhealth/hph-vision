import {clamp} from '../validation';
import type {ReliabilitySignals} from './types';

const bounded = (value: number | undefined, fallback = 1): number =>
  clamp(value ?? fallback, 0, 1);

export const normalizeReliabilitySignals = (
  signals: ReliabilitySignals,
): Required<Omit<ReliabilitySignals, 'medianResponseTimeMs'>> & {
  medianResponseTimeMs: number;
} => ({
  repeatedAnswerConsistency: bounded(signals.repeatedAnswerConsistency),
  medianResponseTimeMs: signals.medianResponseTimeMs ?? 0,
  voiceConfidence: bounded(signals.voiceConfidence),
  distanceConfidence: bounded(signals.distanceConfidence),
  tiltConfidence: bounded(signals.tiltConfidence),
  ambientLightScore: bounded(signals.ambientLightScore),
  completionRate: bounded(signals.completionRate),
  contradictionScore: bounded(signals.contradictionScore, 0),
});
