import {clamp} from '../validation';
import {isCorrectOptotypeAnswer} from './optotypes';
import type {AcuityResult, AcuitySession} from './types';

const toSnellenEquivalent = (logMar: number): string => {
  const denominator = Math.round((20 * 10 ** logMar) / 5) * 5;
  return `20/${Math.max(5, denominator)}`;
};

export const scoreAcuitySession = (session: AcuitySession): AcuityResult => {
  const responseByTrial = new Map(
    session.responses.map(response => [response.trialId, response]),
  );
  const testTrials = session.trials.filter(trial => !trial.isPractice);
  const answeredTestTrials = testTrials.filter(trial =>
    responseByTrial.has(trial.id),
  );
  const correctTrials = answeredTestTrials.filter(trial => {
    const response = responseByTrial.get(trial.id);
    return response
      ? isCorrectOptotypeAnswer(trial.orientation, response.answer)
      : false;
  });
  const lowVoiceConfidenceCount = session.responses.filter(
    response =>
      response.inputMethod === 'voice' && (response.confidence ?? 1) < 0.65,
  ).length;
  const completionRate =
    testTrials.length > 0 ? answeredTestTrials.length / testTrials.length : 0;
  const correctRate =
    answeredTestTrials.length > 0
      ? correctTrials.length / answeredTestTrials.length
      : 0;
  const confidence = clamp(completionRate * (0.4 + correctRate * 0.6), 0, 1);
  const logMarEstimate =
    correctTrials.length > 0
      ? Math.min(...correctTrials.map(trial => trial.sizeLogMar))
      : undefined;

  const reliabilityWarnings = [
    ...(completionRate < 1 ? ['acuity_session_incomplete'] : []),
    ...(correctTrials.length === 0 ? ['no_correct_acuity_trials'] : []),
    ...(lowVoiceConfidenceCount > 0 ? ['low_voice_confidence'] : []),
  ];

  return {
    eye: session.eye,
    logMarEstimate,
    snellenEquivalent:
      typeof logMarEstimate === 'number'
        ? toSnellenEquivalent(logMarEstimate)
        : undefined,
    completed: session.completed,
    confidence,
    reliabilityWarnings,
    trials: session.trials,
    responses: session.responses,
  };
};
