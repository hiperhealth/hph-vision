import {clamp, roundToStep} from '../validation';
import type {
  EyeRefractionEstimate,
  RefractionRange,
  RefractionResult,
  RefractionSession,
} from './types';

const normalizeAxis = (axis: number): number => {
  const normalized = Math.round(axis) % 180;
  return normalized <= 0 ? normalized + 180 : normalized;
};

export const scoreRefractionSession = (
  session: RefractionSession,
): RefractionResult => {
  const responseByTrial = new Map(
    session.responses.map(response => [response.trialId, response]),
  );
  let sphere = session.initialSphere;
  let cylinder = 0;
  let axis = 90;
  let unknownCount = 0;
  let lowVoiceConfidenceCount = 0;
  let sameCount = 0;

  for (const trial of session.trials) {
    const response = responseByTrial.get(trial.id);
    if (!response) {
      continue;
    }
    if (response.inputMethod === 'voice' && (response.confidence ?? 1) < 0.65) {
      lowVoiceConfidenceCount += 1;
    }
    if (response.answer === 'unknown') {
      unknownCount += 1;
      continue;
    }
    if (response.answer === 'same') {
      sameCount += 1;
      continue;
    }

    const selected =
      response.answer === 'better' || response.answer === 'one'
        ? trial.optionA
        : trial.optionB;
    sphere += selected?.sphereDelta ?? 0;
    cylinder += selected?.cylinderDelta ?? 0;
    axis += selected?.axisDelta ?? 0;
  }

  const roundedSphere = roundToStep(sphere, 0.25);
  const roundedCylinder = roundToStep(cylinder, 0.25);
  const normalizedAxis = normalizeAxis(axis);
  const sphericalEquivalent = roundToStep(
    roundedSphere + roundedCylinder / 2,
    0.25,
  );

  const sphereRange: RefractionRange = [
    roundToStep(roundedSphere - 0.5, 0.25),
    roundToStep(roundedSphere + 0.5, 0.25),
  ];
  const cylinderRange: RefractionRange = [
    roundToStep(roundedCylinder - 0.5, 0.25),
    roundToStep(roundedCylinder + 0.5, 0.25),
  ];
  const axisRange: RefractionRange = [
    normalizeAxis(normalizedAxis - 15),
    normalizeAxis(normalizedAxis + 15),
  ];

  const completionRate =
    session.trials.length > 0
      ? session.responses.length / session.trials.length
      : 0;
  const uncertaintyPenalty =
    (unknownCount + sameCount * 0.5 + lowVoiceConfidenceCount) * 0.08;
  const confidence = clamp(completionRate - uncertaintyPenalty, 0, 1);

  const estimate: EyeRefractionEstimate = {
    sphere: roundedSphere,
    cylinder: roundedCylinder,
    axis: normalizedAxis,
    sphericalEquivalent,
    sphereRange,
    cylinderRange,
    axisRange,
    confidenceInterval: {
      sphere: sphereRange,
      cylinder: cylinderRange,
      axis: axisRange,
    },
  };

  const reliabilityWarnings = [
    ...(session.completed ? [] : ['refraction_session_incomplete']),
    ...(unknownCount > 0 ? ['unknown_refraction_answers'] : []),
    ...(sameCount > session.trials.length / 2 ? ['many_same_answers'] : []),
    ...(lowVoiceConfidenceCount > 0 ? ['low_voice_confidence'] : []),
  ];

  const recommendation =
    confidence < 0.4 ? 'repeat_test' : 'clinician_review_recommended';

  return {
    rightEye: session.eye === 'right' ? estimate : undefined,
    leftEye: session.eye === 'left' ? estimate : undefined,
    binocular: session.eye === 'binocular' ? estimate : undefined,
    confidence,
    recommendation,
    reliabilityWarnings,
  };
};
