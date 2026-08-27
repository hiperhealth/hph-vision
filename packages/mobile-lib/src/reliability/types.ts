import type {DomainWarning} from '../types';

export type ReliabilitySignals = {
  repeatedAnswerConsistency?: number;
  medianResponseTimeMs?: number;
  voiceConfidence?: number;
  distanceConfidence?: number;
  tiltConfidence?: number;
  ambientLightScore?: number;
  completionRate?: number;
  contradictionScore?: number;
  skippedTrialsRate?: number;
  abortedFlow?: boolean;
};

export type ReliabilityLevel = 'high' | 'medium' | 'low' | 'invalid';

export type ReliabilityResult = {
  score: number;
  level: ReliabilityLevel;
  warnings: DomainWarning[];
};
