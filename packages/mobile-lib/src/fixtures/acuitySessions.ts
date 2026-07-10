import {
  createAcuitySession,
  recordAcuityResponse,
  scoreAcuitySession,
} from '../acuity';

const baseSession = createAcuitySession({
  id: 'fixture-acuity-right',
  eye: 'right',
  randomSeed: 'fixture-acuity',
  sizeLogMarSequence: [0.4, 0.3, 0.2],
  practiceTrials: 0,
});

export const fixtureAcuitySession = baseSession.trials.reduce(
  (session, trial) =>
    recordAcuityResponse(session, {
      trialId: trial.id,
      answer: trial.orientation,
      inputMethod: 'touch',
      createdAt: '2026-05-12T00:00:00Z',
    }),
  baseSession,
);

export const fixtureAcuityResult = scoreAcuitySession(fixtureAcuitySession);
