import {
  createRefractionSession,
  nextRefractionTrial,
  recordRefractionResponse,
} from './stateMachine';
import {scoreRefractionSession, combineRefractionResults} from './scoring';
import type {Eye} from '../types';
import type {
  RefractionFlowContext,
  RefractionFlowEvent,
  RefractionResponse,
  RefractionResult,
  RefractionSession,
  SerializedRefractionFlowState,
} from './types';

export const createRefractionFlow = (options?: {
  eyeMode?: 'right' | 'left' | 'both';
  initialSphere?: number;
  maxTrials?: number;
  now?: () => string;
}): RefractionFlowContext => {
  return {
    state: 'intro',
    selectedEyeMode: options?.eyeMode ?? 'both',
    activeEye: options?.eyeMode === 'left' ? 'left' : 'right',
    initialSphere: options?.initialSphere ?? 0,
    maxTrials: options?.maxTrials ?? 8,
    now: options?.now,
    currentTrialIndex: 0,
    contradictionCount: 0,
    consecutiveSameCount: 0,
    convergenceReached: false,
    warnings: [],
  };
};

// checks if the current answer contradicts the previous one
const isContradictoryAnswer = (
  prev?: RefractionResponse,
  curr?: RefractionResponse,
): boolean => {
  if (!prev || !curr) {
    return false;
  }
  const isPrevOne = prev.answer === 'better' || prev.answer === 'one';
  const isPrevTwo = prev.answer === 'worse' || prev.answer === 'two';
  const isCurrOne = curr.answer === 'better' || curr.answer === 'one';
  const isCurrTwo = curr.answer === 'worse' || curr.answer === 'two';

  return (isPrevOne && isCurrTwo) || (isPrevTwo && isCurrOne);
};

const getActiveSession = (
  context: RefractionFlowContext,
): RefractionSession | undefined => {
  if (context.activeEye === 'right') {
    return context.rightEyeSession;
  }
  if (context.activeEye === 'left') {
    return context.leftEyeSession;
  }
  return context.binocularSession;
};

const updateActiveSession = (
  context: RefractionFlowContext,
  session: RefractionSession,
): RefractionFlowContext => {
  if (context.activeEye === 'right') {
    return {...context, rightEyeSession: session};
  }
  if (context.activeEye === 'left') {
    return {...context, leftEyeSession: session};
  }
  return {...context, binocularSession: session};
};

// scores all completed sessions and merges them into one result
const computeFlowResults = (
  context: RefractionFlowContext,
): RefractionResult => {
  const sessions: RefractionSession[] = [];
  if (context.rightEyeSession) {
    sessions.push(context.rightEyeSession);
  }
  if (context.leftEyeSession) {
    sessions.push(context.leftEyeSession);
  }
  if (context.binocularSession) {
    sessions.push(context.binocularSession);
  }

  const individualResults = sessions.map(scoreRefractionSession);
  const combined = combineRefractionResults(individualResults);

  const additionalWarnings: string[] = [];
  if (context.contradictionCount >= 2) {
    additionalWarnings.push('contradictory_answers');
  }
  if (context.consecutiveSameCount >= 2) {
    additionalWarnings.push('many_same_answers');
  }
  if (context.state === 'aborted') {
    additionalWarnings.push('aborted_session');
  }
  // warn if we expected both eyes but only finished one
  if (
    context.selectedEyeMode === 'both' &&
    (!context.rightEyeSession || !context.leftEyeSession)
  ) {
    additionalWarnings.push('one_eye_only_completed');
  }

  const allWarnings = Array.from(
    new Set([
      ...combined.reliabilityWarnings,
      ...additionalWarnings,
      ...context.warnings,
    ]),
  );

  return {
    ...combined,
    reliabilityWarnings: allWarnings,
  };
};

// pure state transition function - takes the current context + an event and returns the next context
// submit_response is accepted from show_option_one, show_option_two, and ask_better_worse_same
// so the ui can skip presentation steps if it wants to collect a quick answer
export const transitionRefractionFlow = (
  context: RefractionFlowContext,
  event: RefractionFlowEvent,
): RefractionFlowContext => {
  if (
    event.type === 'ABORT' &&
    context.state !== 'complete' &&
    context.state !== 'aborted'
  ) {
    const abortedContext: RefractionFlowContext = {
      ...context,
      state: 'aborted',
    };
    return {
      ...abortedContext,
      result: computeFlowResults(abortedContext),
    };
  }

  if (event.type === 'RESTORE') {
    return event.payload.context;
  }

  switch (context.state) {
    case 'intro': {
      if (event.type === 'START' || event.type === 'PROCEED') {
        return {...context, state: 'select_eye'};
      }
      break;
    }

    case 'select_eye': {
      if (event.type === 'SELECT_EYE') {
        const eye = event.payload.eye;
        const targetMode =
          event.payload.targetMode ??
          (eye === 'binocular' || context.selectedEyeMode !== 'both'
            ? 'single'
            : 'both');
        const session = createRefractionSession({
          eye,
          initialSphere: context.initialSphere,
          maxTrials: context.maxTrials,
        });
        const firstTrial = nextRefractionTrial(session);

        const updated: RefractionFlowContext = {
          ...context,
          state: 'baseline_check',
          selectedEyeMode:
            targetMode === 'single'
              ? eye === 'left'
                ? 'left'
                : 'right'
              : 'both',
          activeEye: eye,
          currentTrialIndex: 0,
          currentTrial: firstTrial,
          contradictionCount: 0,
          consecutiveSameCount: 0,
          convergenceReached: false,
        };
        return updateActiveSession(updated, session);
      }
      break;
    }

    case 'baseline_check': {
      if (event.type === 'PROCEED' || event.type === 'PRESENT_OPTION_ONE') {
        const session = getActiveSession(context);
        const trial = session ? nextRefractionTrial(session) : undefined;
        return {
          ...context,
          state: 'show_option_one',
          currentTrial: trial,
        };
      }
      break;
    }

    case 'show_option_one': {
      if (event.type === 'PRESENT_OPTION_TWO' || event.type === 'PROCEED') {
        return {...context, state: 'show_option_two'};
      }
      if (event.type === 'SUBMIT_RESPONSE') {
        return transitionRefractionFlow(
          {...context, state: 'collect_response'},
          event,
        );
      }
      break;
    }

    case 'show_option_two': {
      if (event.type === 'ASK_QUESTION' || event.type === 'PROCEED') {
        return {...context, state: 'ask_better_worse_same'};
      }
      if (event.type === 'SUBMIT_RESPONSE') {
        return transitionRefractionFlow(
          {...context, state: 'collect_response'},
          event,
        );
      }
      break;
    }

    case 'ask_better_worse_same': {
      if (event.type === 'PROCEED') {
        return {...context, state: 'collect_response'};
      }
      if (event.type === 'SUBMIT_RESPONSE') {
        return transitionRefractionFlow(
          {...context, state: 'collect_response'},
          event,
        );
      }
      break;
    }

    case 'collect_response': {
      if (event.type === 'SUBMIT_RESPONSE') {
        const {answer, rawInput, inputMethod, confidence, responseTimeMs} =
          event.payload;
        const activeSession = getActiveSession(context);
        if (!activeSession || !context.currentTrial) {
          return context;
        }

        const newResponse: RefractionResponse = {
          trialId: context.currentTrial.id,
          answer,
          rawInput,
          inputMethod,
          confidence,
          responseTimeMs,
          createdAt: context.now ? context.now() : new Date().toISOString(),
        };

        const updatedSession = recordRefractionResponse(
          activeSession,
          newResponse,
        );
        const isContradictory = isContradictoryAnswer(
          context.lastResponse,
          newResponse,
        );
        const newContradictionCount = isContradictory
          ? context.contradictionCount + 1
          : context.contradictionCount;

        const isSame = answer === 'same';
        const newConsecutiveSameCount = isSame
          ? context.consecutiveSameCount + 1
          : 0;

        const updatedContext: RefractionFlowContext = {
          ...updateActiveSession(context, updatedSession),
          state: 'update_estimate',
          lastResponse: newResponse,
          contradictionCount: newContradictionCount,
          consecutiveSameCount: newConsecutiveSameCount,
        };

        return updatedContext;
      }
      break;
    }

    case 'update_estimate': {
      if (event.type === 'PROCEED' || event.type === 'CHECK_CONVERGENCE') {
        return transitionRefractionFlow(
          {...context, state: 'check_convergence'},
          {type: 'CHECK_CONVERGENCE'},
        );
      }
      break;
    }

    case 'check_convergence': {
      if (event.type === 'CHECK_CONVERGENCE' || event.type === 'PROCEED') {
        const activeSession = getActiveSession(context);
        const nextTrial = activeSession
          ? nextRefractionTrial(activeSession)
          : undefined;

        const allTrialsDone = !nextTrial;
        const isConverged =
          allTrialsDone ||
          context.consecutiveSameCount >= 2 ||
          context.contradictionCount >= 3;

        if (isConverged) {
          const needsOtherEye =
            context.selectedEyeMode === 'both' &&
            context.activeEye === 'right' &&
            !context.leftEyeSession;

          if (needsOtherEye) {
            return {
              ...context,
              state: 'switch_eye',
              convergenceReached: true,
            };
          }

          // wrapping it up
          const finalContext: RefractionFlowContext = {
            ...context,
            state: 'complete',
            convergenceReached: true,
            currentTrial: undefined,
          };
          return {
            ...finalContext,
            result: computeFlowResults(finalContext),
          };
        }
        // move to next one
        return {
          ...context,
          state: 'show_option_one',
          currentTrialIndex: context.currentTrialIndex + 1,
          currentTrial: nextTrial,
        };
      }
      break;
    }

    case 'switch_eye': {
      if (event.type === 'SWITCH_EYE' || event.type === 'PROCEED') {
        const nextEye: Eye = context.activeEye === 'right' ? 'left' : 'right';
        const session = createRefractionSession({
          eye: nextEye,
          initialSphere: context.initialSphere,
          maxTrials: context.maxTrials,
        });
        const firstTrial = nextRefractionTrial(session);

        const updated: RefractionFlowContext = {
          ...context,
          state: 'baseline_check',
          activeEye: nextEye,
          currentTrialIndex: 0,
          currentTrial: firstTrial,
          consecutiveSameCount: 0,
          convergenceReached: false,
        };
        return updateActiveSession(updated, session);
      }
      break;
    }

    case 'complete':
    case 'aborted':
      return context;
  }

  return context;
};

// serializes the flow context to a json string for persistence
export const serializeRefractionFlowState = (
  context: RefractionFlowContext,
): string => {
  const payload: SerializedRefractionFlowState = {
    version: 'refraction-flow-v1',
    context,
    serializedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload);
};

// restores a flow context from a previously serialized json string
// throws if the payload is malformed or from an incompatible version
export const restoreRefractionFlowState = (
  serializedString: string,
): RefractionFlowContext => {
  const parsed = JSON.parse(serializedString) as SerializedRefractionFlowState;
  if (!parsed || parsed.version !== 'refraction-flow-v1' || !parsed.context) {
    throw new Error('invalid or incompatible refraction flow state payload');
  }
  if (!parsed.context.state) {
    throw new Error('malformed context — missing required state field');
  }
  return parsed.context;
};
