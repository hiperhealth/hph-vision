import {REFRACTION_PROTOCOL_VERSION} from './protocol';
import type {
  RefractionResponse,
  RefractionSession,
  RefractionSessionOptions,
  RefractionTrial,
} from './types';

const createTrial = (
  id: string,
  eye: RefractionSessionOptions['eye'],
  index: number,
): RefractionTrial => {
  if (index < 4) {
    const delta = index % 2 === 0 ? 0.25 : -0.25;
    return {
      id: `${id}-spherical-${index + 1}`,
      eye,
      kind: 'sphericalComparison',
      promptKey: 'refraction.prompt.betterWorseSame',
      optionA: {
        id: 'sphere-a',
        sphereDelta: delta,
        labelKey: 'refraction.option.one',
      },
      optionB: {
        id: 'sphere-b',
        sphereDelta: -delta,
        labelKey: 'refraction.option.two',
      },
    };
  }

  if (index < 6) {
    const delta = index === 4 ? -0.25 : -0.5;
    return {
      id: `${id}-cylinder-${index - 3}`,
      eye,
      kind: 'cylinderComparison',
      promptKey: 'refraction.prompt.oneOrTwo',
      optionA: {
        id: 'cylinder-a',
        cylinderDelta: delta,
        labelKey: 'refraction.option.one',
      },
      optionB: {
        id: 'cylinder-b',
        cylinderDelta: 0,
        labelKey: 'refraction.option.two',
      },
    };
  }

  const axisDelta = index % 2 === 0 ? 15 : -15;
  return {
    id: `${id}-axis-${index - 5}`,
    eye,
    kind: 'axisComparison',
    promptKey: 'refraction.prompt.oneOrTwo',
    optionA: {id: 'axis-a', axisDelta, labelKey: 'refraction.option.one'},
    optionB: {
      id: 'axis-b',
      axisDelta: -axisDelta,
      labelKey: 'refraction.option.two',
    },
  };
};

export const createRefractionSession = (
  options: RefractionSessionOptions,
): RefractionSession => {
  const id = options.id ?? `refraction-${options.eye}`;
  const maxTrials = options.maxTrials ?? 8;

  return {
    id,
    protocolVersion: REFRACTION_PROTOCOL_VERSION,
    eye: options.eye,
    initialSphere: options.initialSphere ?? 0,
    trials: Array.from({length: maxTrials}, (_, index) =>
      createTrial(id, options.eye, index),
    ),
    responses: [],
    completed: false,
  };
};

export const nextRefractionTrial = (
  session: RefractionSession,
): RefractionTrial | undefined => {
  const answered = new Set(session.responses.map(response => response.trialId));
  return session.trials.find(trial => !answered.has(trial.id));
};

export const recordRefractionResponse = (
  session: RefractionSession,
  response: RefractionResponse,
): RefractionSession => {
  const responses = [
    ...session.responses.filter(
      existing => existing.trialId !== response.trialId,
    ),
    response,
  ];
  const answered = new Set(responses.map(item => item.trialId));

  return {
    ...session,
    responses,
    completed: session.trials.every(trial => answered.has(trial.id)),
  };
};
