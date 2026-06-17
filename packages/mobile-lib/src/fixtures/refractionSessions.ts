import {
  createRefractionSession,
  recordRefractionResponse,
  scoreRefractionSession,
} from '../refraction';

const baseSession = createRefractionSession({
  id: 'fixture-refraction-right',
  eye: 'right',
});

export const fixtureRefractionSession = baseSession.trials.reduce(
  (session, trial) =>
    recordRefractionResponse(session, {
      trialId: trial.id,
      answer: trial.kind === 'sphericalComparison' ? 'better' : 'one',
      inputMethod: 'touch',
      createdAt: '2026-05-12T00:00:00Z',
    }),
  baseSession,
);

export const fixtureRefractionResult = scoreRefractionSession(
  fixtureRefractionSession,
);
