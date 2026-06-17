import {SCREENING_DISCLAIMER} from '../types';
import {calculateReliability} from '../reliability';
import type {TestSession} from '../session';
import {determineRecommendation} from './recommendations';
import {dedupeWarnings} from './warnings';
import type {ScreeningReport} from './types';

export const createScreeningReport = (
  session: TestSession,
  options?: {id?: string; createdAt?: string},
): ScreeningReport => {
  const fallbackReliability = calculateReliability({
    completionRate:
      session.acuityResults.length > 0 || session.refractionResult ? 1 : 0,
  });
  const reliability = session.reliability ?? fallbackReliability;
  const warnings = dedupeWarnings([
    ...session.warnings,
    ...reliability.warnings,
    ...(session.triageResult?.warnings ?? []),
  ]);
  const recommendation = determineRecommendation({
    hasRedFlags: (session.triageResult?.redFlags.length ?? 0) > 0,
    reliabilityScore: reliability.score,
    refractionConfidence: session.refractionResult?.confidence,
    completed:
      session.acuityResults.length > 0 || Boolean(session.refractionResult),
  });

  return {
    id: options?.id ?? `report-${session.id}`,
    sessionId: session.id,
    createdAt: options?.createdAt ?? session.createdAt,
    appVersion: session.appVersion,
    libraryVersion: session.libraryVersion,
    deviceProfile: session.deviceProfile,
    templateMetadata: session.templateMetadata,
    acuityResults: session.acuityResults,
    refractionResult: session.refractionResult,
    reliability,
    warnings,
    recommendation,
    disclaimer: SCREENING_DISCLAIMER,
  };
};
