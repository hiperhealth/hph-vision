import {clamp} from '../validation';
import type {ReliabilitySignals} from './types';

const bounded = (value: number | undefined, fallback = 1): number =>
  clamp(value ?? fallback, 0, 1);

const normalizeResponseTime = (ms: number | undefined): number => {
  if (ms === undefined) return 1;
  const ideal = 1500;
  const tolerance = 3000;
  return clamp(1 - Math.abs(ms - ideal) / tolerance, 0, 1);
};

export const normalizeReliabilitySignals = (
  signals: ReliabilitySignals,
): Required<
  Omit<
    ReliabilitySignals,
    'medianResponseTimeMs' | 'abortedFlow' | 'skippedTrialsRate'
  >
> & {
  medianResponseTimeMs: number;
  responseTimeScore: number;
  skippedTrialsPenalty: number;
  abortedFlowPenalty: number;
} => ({
  repeatedAnswerConsistency: bounded(signals.repeatedAnswerConsistency),
  medianResponseTimeMs: signals.medianResponseTimeMs ?? 0,
  voiceConfidence: bounded(signals.voiceConfidence),
  distanceConfidence: bounded(signals.distanceConfidence),
  tiltConfidence: bounded(signals.tiltConfidence),
  ambientLightScore: bounded(signals.ambientLightScore),
  completionRate: bounded(signals.completionRate),
  contradictionScore: bounded(signals.contradictionScore, 0),
  responseTimeScore: normalizeResponseTime(signals.medianResponseTimeMs),
  skippedTrialsPenalty: bounded(signals.skippedTrialsRate, 0),
  abortedFlowPenalty: signals.abortedFlow ? 1 : 0,
});
