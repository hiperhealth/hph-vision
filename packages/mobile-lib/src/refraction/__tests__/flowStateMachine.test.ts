import {describe, expect, it} from '@jest/globals';
import {
  createRefractionFlow,
  transitionRefractionFlow,
  serializeRefractionFlowState,
  restoreRefractionFlowState,
  normalizeRefractionAnswer,
  scoreRefractionSession,
  combineRefractionResults,
  createRefractionSession,
  recordRefractionResponse,
} from '..';

// helper to run through the trial loop for one eye
// answers every trial with the given answer token until hitting switch_eye or complete
const runEyeTrials = (
  startContext: ReturnType<typeof createRefractionFlow>,
  answer: string,
  inputMethod: 'touch' | 'voice' = 'touch',
  confidence?: number,
) => {
  let context = startContext;
  let safetyCounter = 0;

  while (
    context.state !== 'switch_eye' &&
    context.state !== 'complete' &&
    safetyCounter < 100
  ) {
    safetyCounter += 1;
    if (context.state === 'show_option_one') {
      context = transitionRefractionFlow(context, {
        type: 'PRESENT_OPTION_TWO',
      });
    } else if (context.state === 'show_option_two') {
      context = transitionRefractionFlow(context, {type: 'ASK_QUESTION'});
    } else if (context.state === 'ask_better_worse_same') {
      context = transitionRefractionFlow(context, {
        type: 'SUBMIT_RESPONSE',
        payload: {
          answer: normalizeRefractionAnswer(answer),
          rawInput: answer,
          inputMethod,
          confidence,
        },
      });
    } else if (context.state === 'update_estimate') {
      context = transitionRefractionFlow(context, {
        type: 'CHECK_CONVERGENCE',
      });
    } else {
      break;
    }
  }
  return context;
};

describe('refraction flow state machine', () => {
  it('runs complete flow for both eyes through normal convergence', () => {
    let context = createRefractionFlow({eyeMode: 'both'});
    expect(context.state).toBe('intro');

    // intro -> select eye
    context = transitionRefractionFlow(context, {type: 'START'});
    expect(context.state).toBe('select_eye');

    // select right eye first
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'both'},
    });
    expect(context.state).toBe('baseline_check');
    expect(context.activeEye).toBe('right');

    // baseline -> show option one
    context = transitionRefractionFlow(context, {type: 'PROCEED'});
    expect(context.state).toBe('show_option_one');
    expect(context.currentTrial).toBeDefined();

    // answer all right eye trials
    context = runEyeTrials(context, 'better');
    expect(context.state).toBe('switch_eye');

    // switch to left eye
    context = transitionRefractionFlow(context, {type: 'SWITCH_EYE'});
    expect(context.state).toBe('baseline_check');
    expect(context.activeEye).toBe('left');

    // baseline -> show option one for left eye
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    // answer all left eye trials
    context = runEyeTrials(context, 'option 1', 'voice', 0.9);

    expect(context.state).toBe('complete');
    expect(context.result).toBeDefined();
    expect(context.result?.rightEye).toBeDefined();
    expect(context.result?.leftEye).toBeDefined();
    expect(context.result?.confidence).toBeGreaterThan(0.7);
  });

  it('triggers early convergence when the patient keeps saying same', () => {
    let context = createRefractionFlow({eyeMode: 'left'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'left', targetMode: 'single'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    // two consecutive "same" answers should trigger convergence
    for (let i = 0; i < 2; i += 1) {
      context = transitionRefractionFlow(context, {
        type: 'SUBMIT_RESPONSE',
        payload: {
          answer: normalizeRefractionAnswer('same'),
          rawInput: 'no difference',
          inputMethod: 'voice',
          confidence: 0.85,
        },
      });
      context = transitionRefractionFlow(context, {type: 'CHECK_CONVERGENCE'});
    }

    expect(context.state).toBe('complete');
    expect(context.convergenceReached).toBe(true);
    expect(context.result?.reliabilityWarnings).toContain('many_same_answers');
  });

  it('tracks contradictory responses and sets the warning', () => {
    let context = createRefractionFlow({eyeMode: 'right'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'single'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    // alternating contradictory answers: better, worse, better, worse
    const answers = ['better', 'worse', 'better', 'worse'];
    for (const ans of answers) {
      if (context.state === 'complete') {
        break;
      }
      context = transitionRefractionFlow(context, {
        type: 'SUBMIT_RESPONSE',
        payload: {
          answer: normalizeRefractionAnswer(ans),
          inputMethod: 'touch',
        },
      });
      context = transitionRefractionFlow(context, {type: 'CHECK_CONVERGENCE'});
    }

    expect(context.contradictionCount).toBeGreaterThanOrEqual(2);
    expect(context.result?.reliabilityWarnings).toContain(
      'contradictory_answers',
    );
  });

  it('handles unknown/skipped responses correctly', () => {
    let context = createRefractionFlow({eyeMode: 'right'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'single'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    context = transitionRefractionFlow(context, {
      type: 'SUBMIT_RESPONSE',
      payload: {
        answer: normalizeRefractionAnswer("I don't know"),
        inputMethod: 'voice',
        confidence: 0.4,
      },
    });
    context = transitionRefractionFlow(context, {type: 'CHECK_CONVERGENCE'});

    expect(context.lastResponse?.answer).toBe('unknown');
  });

  it('handles abort and produces the right warning', () => {
    let context = createRefractionFlow({eyeMode: 'both'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right'},
    });

    context = transitionRefractionFlow(context, {type: 'ABORT'});
    expect(context.state).toBe('aborted');
    expect(context.result?.reliabilityWarnings).toContain('aborted_session');
  });

  it('serializes and restores flow context round-trip', () => {
    let context = createRefractionFlow({eyeMode: 'both'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'left', targetMode: 'both'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'});
    context = transitionRefractionFlow(context, {
      type: 'SUBMIT_RESPONSE',
      payload: {
        answer: normalizeRefractionAnswer('option 1'),
        inputMethod: 'touch',
      },
    });

    const serialized = serializeRefractionFlowState(context);
    expect(typeof serialized).toBe('string');

    const restored = restoreRefractionFlowState(serialized);
    expect(restored.state).toBe(context.state);
    expect(restored.activeEye).toBe('left');
    expect(restored.lastResponse?.answer).toBe('one');
  });

  it('warns about one_eye_only_completed when both-eye flow finishes just one eye', () => {
    let context = createRefractionFlow({eyeMode: 'both'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'both'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    // complete right eye trials
    context = runEyeTrials(context, 'better');
    expect(context.state).toBe('switch_eye');

    // instead of switching, abort the flow
    context = transitionRefractionFlow(context, {type: 'ABORT'});

    expect(context.state).toBe('aborted');
    expect(context.result?.reliabilityWarnings).toContain(
      'one_eye_only_completed',
    );
    expect(context.result?.reliabilityWarnings).toContain('aborted_session');
    // should have right eye but not left
    expect(context.result?.rightEye).toBeDefined();
    expect(context.result?.leftEye).toBeUndefined();
  });

  // --- initialSphere and maxTrials forwarding ---

  it('passes initialSphere and maxTrials to the underlying sessions', () => {
    let context = createRefractionFlow({
      eyeMode: 'right',
      initialSphere: -2.5,
      maxTrials: 4,
    });
    expect(context.initialSphere).toBe(-2.5);
    expect(context.maxTrials).toBe(4);

    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'single'},
    });

    expect(context.rightEyeSession).toBeDefined();
    expect(context.rightEyeSession?.initialSphere).toBe(-2.5);
    expect(context.rightEyeSession?.trials.length).toBe(4);
  });

  it('carries initialSphere and maxTrials over to the second eye session', () => {
    let context = createRefractionFlow({
      eyeMode: 'both',
      initialSphere: 1.0,
      maxTrials: 3,
    });
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'both'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    // run through right eye
    context = runEyeTrials(context, 'better');
    expect(context.state).toBe('switch_eye');

    // switch to left eye
    context = transitionRefractionFlow(context, {type: 'SWITCH_EYE'});
    expect(context.leftEyeSession).toBeDefined();
    expect(context.leftEyeSession?.initialSphere).toBe(1.0);
    expect(context.leftEyeSession?.trials.length).toBe(3);
  });

  it('accepts PRESENT_OPTION_ONE from baseline_check', () => {
    let context = createRefractionFlow({eyeMode: 'right'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'single'},
    });
    expect(context.state).toBe('baseline_check');

    context = transitionRefractionFlow(context, {
      type: 'PRESENT_OPTION_ONE',
    });
    expect(context.state).toBe('show_option_one');
  });

  // --- restoring error cases ---

  it('throws on invalid json when restoring', () => {
    expect(() => restoreRefractionFlowState('not valid json')).toThrow();
  });

  it('throws on unsupported version when restoring', () => {
    const bad = JSON.stringify({
      version: 'refraction-flow-v99',
      context: {state: 'intro'},
      serializedAt: new Date().toISOString(),
    });
    expect(() => restoreRefractionFlowState(bad)).toThrow(
      /invalid or incompatible/i,
    );
  });

  it('throws on malformed context when restoring', () => {
    const noContext = JSON.stringify({
      version: 'refraction-flow-v1',
      serializedAt: new Date().toISOString(),
    });
    expect(() => restoreRefractionFlowState(noContext)).toThrow();

    const emptyContext = JSON.stringify({
      version: 'refraction-flow-v1',
      context: {},
      serializedAt: new Date().toISOString(),
    });
    expect(() => restoreRefractionFlowState(emptyContext)).toThrow(
      /malformed context/i,
    );
  });

  it('marks active session as not completed on abort', () => {
    let context = createRefractionFlow({eyeMode: 'right'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'single'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    // answer one trial then abort
    context = transitionRefractionFlow(context, {
      type: 'SUBMIT_RESPONSE',
      payload: {
        answer: normalizeRefractionAnswer('better'),
        inputMethod: 'touch',
      },
    });
    context = transitionRefractionFlow(context, {type: 'ABORT'});

    expect(context.state).toBe('aborted');
    expect(context.rightEyeSession?.completed).toBe(false);
  });

  it('uses the optional clock for deterministic timestamps', () => {
    const fixedTime = '2026-01-15T12:00:00Z';
    let context = createRefractionFlow({
      eyeMode: 'right',
      now: () => fixedTime,
    });
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'single'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    context = transitionRefractionFlow(context, {
      type: 'SUBMIT_RESPONSE',
      payload: {
        answer: normalizeRefractionAnswer('better'),
        inputMethod: 'touch',
      },
    });

    expect(context.lastResponse?.createdAt).toBe(fixedTime);
  });
});

// --- normalization tests ---

describe('normalizeRefractionAnswer', () => {
  it('maps synonym words to their canonical tokens', () => {
    expect(normalizeRefractionAnswer('clearer')).toBe('better');
    expect(normalizeRefractionAnswer('improved')).toBe('better');
    expect(normalizeRefractionAnswer('sharper')).toBe('better');
    expect(normalizeRefractionAnswer('blurrier')).toBe('worse');
    expect(normalizeRefractionAnswer('harder')).toBe('worse');
    expect(normalizeRefractionAnswer('equal')).toBe('same');
    expect(normalizeRefractionAnswer('neither')).toBe('same');
    expect(normalizeRefractionAnswer('both')).toBe('same');
    expect(normalizeRefractionAnswer('first')).toBe('one');
    expect(normalizeRefractionAnswer('second')).toBe('two');
    expect(normalizeRefractionAnswer('option a')).toBe('one');
    expect(normalizeRefractionAnswer('option b')).toBe('two');
  });

  it('strips punctuation before matching', () => {
    expect(normalizeRefractionAnswer('better!')).toBe('better');
    expect(normalizeRefractionAnswer('option 1.')).toBe('one');
    expect(normalizeRefractionAnswer('worse...')).toBe('worse');
    expect(normalizeRefractionAnswer('(same)')).toBe('same');
    expect(normalizeRefractionAnswer('  better  ')).toBe('better');
  });

  it('handles compound voice input by extracting the key word', () => {
    expect(normalizeRefractionAnswer('I think option one is better')).toBe(
      'better',
    );
    expect(normalizeRefractionAnswer('the second one looks worse')).toBe(
      'worse',
    );
    expect(normalizeRefractionAnswer('they look the same to me')).toBe('same');
    expect(normalizeRefractionAnswer('I would say option 2 is clearer')).toBe(
      'better',
    );
    expect(normalizeRefractionAnswer('no difference at all')).toBe('same');
  });

  it('returns unknown for ambiguous or empty input', () => {
    expect(normalizeRefractionAnswer('')).toBe('unknown');
    expect(normalizeRefractionAnswer('   ')).toBe('unknown');
    expect(normalizeRefractionAnswer('hmm')).toBe('unknown');
    expect(normalizeRefractionAnswer('I am not really seeing anything')).toBe(
      'unknown',
    );
  });

  it('handles direct unknown synonyms', () => {
    expect(normalizeRefractionAnswer('idk')).toBe('unknown');
    expect(normalizeRefractionAnswer('not sure')).toBe('unknown');
    expect(normalizeRefractionAnswer('skip')).toBe('unknown');
    expect(normalizeRefractionAnswer('pass')).toBe('unknown');
    expect(normalizeRefractionAnswer('uncertain')).toBe('unknown');
    expect(normalizeRefractionAnswer("don't know")).toBe('unknown');
  });

  it('is case insensitive', () => {
    expect(normalizeRefractionAnswer('BETTER')).toBe('better');
    expect(normalizeRefractionAnswer('Worse')).toBe('worse');
    expect(normalizeRefractionAnswer('OPTION ONE')).toBe('one');
  });
});

// --- scoring and combineRefractionResults tests ---

describe('scoring and combineRefractionResults', () => {
  it('computes sphere, cylinder, and axis ranges', () => {
    let session = createRefractionSession({
      id: 'range-test',
      eye: 'right',
      maxTrials: 2,
    });

    for (const trial of session.trials) {
      session = recordRefractionResponse(session, {
        trialId: trial.id,
        answer: 'better',
        inputMethod: 'touch',
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreRefractionSession(session);
    const estimate = result.rightEye;

    expect(estimate).toBeDefined();
    expect(estimate?.sphereRange).toBeDefined();
    expect(estimate?.cylinderRange).toBeDefined();
    expect(estimate?.axisRange).toBeDefined();

    if (estimate?.sphere !== undefined && estimate.sphereRange) {
      expect(estimate.sphereRange[0]).toBeLessThan(estimate.sphere);
      expect(estimate.sphereRange[1]).toBeGreaterThan(estimate.sphere);
    }
  });

  it('penalizes confidence for low-confidence voice responses', () => {
    let session = createRefractionSession({
      id: 'voice-low',
      eye: 'left',
      maxTrials: 4,
    });

    // low-confidence voice
    for (const trial of session.trials) {
      session = recordRefractionResponse(session, {
        trialId: trial.id,
        answer: 'better',
        inputMethod: 'voice',
        confidence: 0.3,
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    const result = scoreRefractionSession(session);
    expect(result.reliabilityWarnings).toContain('low_voice_confidence');
    let cleanSession = createRefractionSession({
      id: 'voice-high',
      eye: 'left',
      maxTrials: 4,
    });
    for (const trial of cleanSession.trials) {
      cleanSession = recordRefractionResponse(cleanSession, {
        trialId: trial.id,
        answer: 'better',
        inputMethod: 'voice',
        confidence: 0.95,
        createdAt: '2026-05-12T00:00:00Z',
      });
    }
    const cleanResult = scoreRefractionSession(cleanSession);
    expect(result.confidence).toBeLessThan(cleanResult.confidence);
  });

  it('returns zero confidence when combining an empty results array', () => {
    const combined = combineRefractionResults([]);
    expect(combined.confidence).toBe(0);
    expect(combined.rightEye).toBeUndefined();
    expect(combined.leftEye).toBeUndefined();
    expect(combined.reliabilityWarnings).toEqual([]);
  });

  it('deduplicates warnings when combining results', () => {
    const resultA = {
      rightEye: {sphere: -1.0},
      confidence: 0.8,
      recommendation: 'clinician_review_recommended' as const,
      reliabilityWarnings: [
        'low_voice_confidence',
        'unknown_refraction_answers',
      ],
    };
    const resultB = {
      leftEye: {sphere: -0.5},
      confidence: 0.7,
      recommendation: 'clinician_review_recommended' as const,
      reliabilityWarnings: ['low_voice_confidence', 'many_same_answers'],
    };

    const combined = combineRefractionResults([resultA, resultB]);
    const lowVoiceCount = combined.reliabilityWarnings.filter(
      w => w === 'low_voice_confidence',
    ).length;
    expect(lowVoiceCount).toBe(1);
    expect(combined.reliabilityWarnings).toContain(
      'unknown_refraction_answers',
    );
    expect(combined.reliabilityWarnings).toContain('many_same_answers');
    expect(combined.reliabilityWarnings).toContain('low_voice_confidence');
  });

  it('averages confidence across combined results', () => {
    const results = [
      {
        rightEye: {sphere: 0},
        confidence: 0.9,
        recommendation: 'clinician_review_recommended' as const,
        reliabilityWarnings: [],
      },
      {
        leftEye: {sphere: 0},
        confidence: 0.5,
        recommendation: 'clinician_review_recommended' as const,
        reliabilityWarnings: [],
      },
    ];

    const combined = combineRefractionResults(results);
    expect(combined.confidence).toBeCloseTo(0.7, 1);
  });

  it('recommends repeat_test when confidence is very low', () => {
    const results = [
      {
        rightEye: {sphere: 0},
        confidence: 0.2,
        recommendation: 'repeat_test' as const,
        reliabilityWarnings: [],
      },
    ];

    const combined = combineRefractionResults(results);
    expect(combined.recommendation).toBe('repeat_test');
  });
});
