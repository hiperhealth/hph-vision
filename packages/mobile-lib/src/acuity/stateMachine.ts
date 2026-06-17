import {
  DEFAULT_LOGMAR_SEQUENCE,
  DEFAULT_PRACTICE_TRIALS,
  ACUITY_PROTOCOL_VERSION,
} from './protocol';
import {OPTOTYPE_ORIENTATIONS} from './optotypes';
import type {
  AcuityResponse,
  AcuitySession,
  AcuitySessionOptions,
  AcuityTrial,
} from './types';

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const orientationFor = (seed: string, index: number) =>
  OPTOTYPE_ORIENTATIONS[
    hashString(`${seed}:${index}`) % OPTOTYPE_ORIENTATIONS.length
  ];

export const createAcuitySession = (
  options: AcuitySessionOptions,
): AcuitySession => {
  const optotype = options.optotype ?? 'tumblingE';
  const practiceTrials = options.practiceTrials ?? DEFAULT_PRACTICE_TRIALS;
  const sequence = options.sizeLogMarSequence ?? DEFAULT_LOGMAR_SEQUENCE;
  const seed = options.randomSeed ?? options.id ?? `${options.eye}:${optotype}`;
  const id = options.id ?? `acuity-${options.eye}-${hashString(seed)}`;

  const practice: AcuityTrial[] = Array.from(
    {length: practiceTrials},
    (_, index) => ({
      id: `${id}-practice-${index + 1}`,
      eye: options.eye,
      optotype,
      orientation: orientationFor(seed, index),
      sizeLogMar: 0.8,
      isPractice: true,
    }),
  );

  const trials: AcuityTrial[] = sequence.map((sizeLogMar, index) => ({
    id: `${id}-trial-${index + 1}`,
    eye: options.eye,
    optotype,
    orientation: orientationFor(seed, practiceTrials + index),
    sizeLogMar,
    isPractice: false,
  }));

  return {
    id,
    protocolVersion: ACUITY_PROTOCOL_VERSION,
    eye: options.eye,
    optotype,
    trials: [...practice, ...trials],
    responses: [],
    completed: false,
  };
};

export const nextAcuityTrial = (
  session: AcuitySession,
): AcuityTrial | undefined => {
  const answered = new Set(session.responses.map(response => response.trialId));
  return session.trials.find(trial => !answered.has(trial.id));
};

export const recordAcuityResponse = (
  session: AcuitySession,
  response: AcuityResponse,
): AcuitySession => {
  const responses = [
    ...session.responses.filter(
      existing => existing.trialId !== response.trialId,
    ),
    response,
  ];
  const answered = new Set(responses.map(item => item.trialId));
  const completed = session.trials.every(trial => answered.has(trial.id));

  return {...session, responses, completed};
};
