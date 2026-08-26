import {
  DEFAULT_LOGMAR_SEQUENCE,
  DEFAULT_PRACTICE_TRIALS,
  ACUITY_PROTOCOL_VERSION,
} from './protocol';
import { OPTOTYPE_ORIENTATIONS, isCorrectOptotypeAnswer } from './optotypes';
import type { ISODateString } from '../types';
import type {
  AcuityResponse,
  AcuitySession,
  AcuitySessionOptions,
  AcuityTrial,
  FlowEvent,
  AcuityFlow,
} from './types';
import { scoreAcuitySession } from './scoring';

// Helper to extract deterministic ISO date and millisecond timestamp from event
const getEventTime = (event: any): { iso: ISODateString; ms: number } => {
  if (event.createdAt) {
    return {
      iso: event.createdAt,
      ms: new Date(event.createdAt).getTime(),
    };
  }
  if (event.timestamp !== undefined) {
    return {
      iso: new Date(event.timestamp).toISOString(),
      ms: event.timestamp,
    };
  }

  const now = new Date();

  return {
    iso: now.toISOString(),
    ms: now.getTime(),
  };
};

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
    { length: practiceTrials },
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

  return { ...session, responses, completed };
};

// --- State Machine Functions ---

export const createInitialAcuityFlow = (): AcuityFlow => ({
  state: 'intro',
  context: {
    eyes: ['right', 'left'],
    currentEyeIndex: 0,
    sessions: {},
    results: {},
    options: {},
    metrics: {
      totalTrials: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      skippedTrials: 0,
      repeatedAnswersCount: 0,
      wrongAnswersCount: 0,
    },
    trialAttemptsCount: 0,
  },
});

export const transitionAcuityFlow = (
  flow: AcuityFlow,
  event: FlowEvent,
): AcuityFlow => {
  const { state, context } = flow;

  // ABORT transitions to aborted from ANY state
  if (event.type === 'ABORT') {
    const { iso: endTime } = getEventTime(event);
    return {
      ...flow,
      state: 'aborted',
      context: {
        ...context,
        metrics: {
          ...context.metrics,
          endTime,
        },
      },
    };
  }

  if (event.type === 'RESET') {
    return createInitialAcuityFlow();
  }

  switch (state) {
    case 'intro': {
      if (event.type === 'START') {
        const eyes = event.eyes ?? ['right', 'left'];
        const options = event.options ?? {};
        const { iso: startTime } = getEventTime(event);
        return {
          state: 'intro',
          context: {
            ...context,
            eyes,
            currentEyeIndex: 0,
            options,
            sessions: {},
            results: {},
            metrics: {
              startTime,
              totalTrials: 0,
              correctAnswers: 0,
              incorrectAnswers: 0,
              skippedTrials: 0,
              repeatedAnswersCount: 0,
              wrongAnswersCount: 0,
            },
            trialAttemptsCount: 0,
          },
        };
      }
      if (event.type === 'ACK_INTRO') {
        return {
          ...flow,
          state: 'practice',
        };
      }
      return flow;
    }

    case 'practice': {
      if (event.type === 'ACK_PRACTICE') {
        return {
          ...flow,
          state: 'select_eye',
        };
      }
      return flow;
    }

    case 'select_eye': {
      if (event.type === 'SELECT_EYE') {
        const currentEye = event.eye ?? context.eyes[context.currentEyeIndex];
        const updatedEyeIndex = context.eyes.indexOf(currentEye);

        // Validation: do not transition or create session if the selected eye is invalid/not configured
        if (updatedEyeIndex === -1) {
          return flow;
        }

        const session = createAcuitySession({
          ...context.options,
          eye: currentEye,
        });

        return {
          state: 'prepare_eye_occlusion',
          context: {
            ...context,
            currentEyeIndex: updatedEyeIndex,
            sessions: {
              ...context.sessions,
              [currentEye]: session,
            },
          },
        };
      }
      return flow;
    }

    case 'prepare_eye_occlusion': {
      if (event.type === 'ACK_OCCLUSION') {
        const { ms: currentTrialStartTime } = getEventTime(event);
        return {
          state: 'show_stimulus',
          context: {
            ...context,
            currentTrialStartTime,
            trialAttemptsCount: 0,
          },
        };
      }
      return flow;
    }

    case 'show_stimulus': {
      if (event.type === 'STIMULUS_DISPLAYED') {
        const { ms: currentTrialStartTime } = getEventTime(event);
        return {
          state: 'collect_response',
          context: {
            ...context,
            currentTrialStartTime,
          },
        };
      }
      return flow;
    }

    case 'collect_response': {
      if (event.type === 'RECORD_ANSWER') {
        const currentEye = context.eyes[context.currentEyeIndex];
        const session = context.sessions[currentEye];
        if (!session) {
          return flow;
        }
        const trial = nextAcuityTrial(session);
        if (!trial) {
          return flow;
        }

        const { iso: createdAt, ms: recordTime } = getEventTime(event);
        const calculatedResponseTime = context.currentTrialStartTime
          ? recordTime - context.currentTrialStartTime
          : undefined;

        const response: AcuityResponse = {
          trialId: trial.id,
          answer: event.answer,
          inputMethod: event.inputMethod,
          confidence: event.confidence,
          responseTimeMs: event.responseTimeMs ?? calculatedResponseTime,
          createdAt,
        };

        const trialAttemptsCount = context.trialAttemptsCount + 1;
        const repeatedAnswersCount =
          trialAttemptsCount > 1
            ? context.metrics.repeatedAnswersCount + 1
            : context.metrics.repeatedAnswersCount;

        return {
          state: 'confirm_response',
          context: {
            ...context,
            pendingResponse: response,
            trialAttemptsCount,
            metrics: {
              ...context.metrics,
              repeatedAnswersCount,
            },
          },
        };
      }
      return flow;
    }

    case 'confirm_response': {
      if (event.type === 'CONFIRM_ANSWER') {
        return {
          ...flow,
          state: 'score_trial',
        };
      }
      if (event.type === 'REJECT_ANSWER') {
        return {
          state: 'collect_response',
          context: {
            ...context,
            pendingResponse: undefined,
          },
        };
      }
      return flow;
    }

    case 'score_trial': {
      if (event.type === 'SCORE_TRIAL') {
        const pendingResponse = context.pendingResponse;
        if (!pendingResponse) {
          return flow;
        }
        const currentEye = context.eyes[context.currentEyeIndex];
        const session = context.sessions[currentEye];
        if (!session) {
          return flow;
        }
        const trial = session.trials.find(
          t => t.id === pendingResponse.trialId,
        );
        if (!trial) {
          return flow;
        }

        const updatedSession = recordAcuityResponse(session, pendingResponse);
        const updatedSessions = {
          ...context.sessions,
          [currentEye]: updatedSession,
        };

        const isPractice = trial.isPractice;
        const isCorrect = isCorrectOptotypeAnswer(
          trial.orientation,
          pendingResponse.answer,
        );
        const isSkipped = pendingResponse.answer === 'skipped';

        const metrics = { ...context.metrics };
        if (!isPractice) {
          metrics.totalTrials += 1;
          if (isSkipped) {
            metrics.skippedTrials += 1;
          } else if (isCorrect) {
            metrics.correctAnswers += 1;
          } else {
            metrics.incorrectAnswers += 1;
            metrics.wrongAnswersCount += 1;
          }
        }

        return {
          state: 'advance_level',
          context: {
            ...context,
            sessions: updatedSessions,
            pendingResponse: undefined,
            metrics,
          },
        };
      }
      return flow;
    }

    case 'advance_level': {
      if (event.type === 'ADVANCE_LEVEL') {
        const currentEye = context.eyes[context.currentEyeIndex];
        const session = context.sessions[currentEye];
        if (!session) {
          return flow;
        }

        const nextTrial = nextAcuityTrial(session);
        if (nextTrial) {
          const { ms: currentTrialStartTime } = getEventTime(event);
          return {
            state: 'show_stimulus',
            context: {
              ...context,
              currentTrialStartTime,
              trialAttemptsCount: 0,
            },
          };
        }

        // Current eye complete, check next
        const nextEyeIndex = context.currentEyeIndex + 1;
        if (nextEyeIndex < context.eyes.length) {
          return {
            state: 'switch_eye',
            context: {
              ...context,
              currentEyeIndex: nextEyeIndex,
            },
          };
        }

        // All eyes finished
        const { iso: endTime, ms: endMs } = getEventTime(event);
        let durationMs: number | undefined;
        if (context.metrics.startTime) {
          const startMs = new Date(context.metrics.startTime).getTime();
          durationMs = endMs - startMs;
        }

        // Produce AcuityResult when complete for all tested eyes
        const results = { ...context.results };
        for (const eye of context.eyes) {
          const eyeSession = context.sessions[eye];
          if (eyeSession) {
            results[eye] = scoreAcuitySession(eyeSession);
          }
        }

        return {
          state: 'complete',
          context: {
            ...context,
            results,
            metrics: {
              ...context.metrics,
              endTime,
              durationMs,
            },
          },
        };
      }
      return flow;
    }

    case 'switch_eye': {
      if (event.type === 'ACK_SWITCH_EYE') {
        const currentEye = context.eyes[context.currentEyeIndex];
        const session = createAcuitySession({
          ...context.options,
          eye: currentEye,
        });

        return {
          state: 'prepare_eye_occlusion',
          context: {
            ...context,
            sessions: {
              ...context.sessions,
              [currentEye]: session,
            },
          },
        };
      }
      return flow;
    }

    default:
      return flow;
  }
};

export const serializeAcuityFlow = (flow: AcuityFlow): string => {
  return JSON.stringify(flow);
};

export const deserializeAcuityFlow = (serialized: string): AcuityFlow => {
  return JSON.parse(serialized) as AcuityFlow;
};
