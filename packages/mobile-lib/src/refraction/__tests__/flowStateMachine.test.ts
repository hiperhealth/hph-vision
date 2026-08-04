import {describe, expect, it} from '@jest/globals';
import {
  createRefractionFlow,
  transitionRefractionFlow,
  serializeRefractionFlowState,
  restoreRefractionFlowState,
  normalizeRefractionAnswer,
} from '..';

describe('refraction flow state machine', () => {
  it('runs complete flow without UI for both eyes through normal convergence', () => {
    let context = createRefractionFlow({eyeMode: 'both'});
    expect(context.state).toBe('intro');

    // 1. Intro -> Select Eye
    context = transitionRefractionFlow(context, {type: 'START'});
    expect(context.state).toBe('select_eye');

    // 2. Select Eye (Right eye first)
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'both'},
    });
    expect(context.state).toBe('baseline_check');
    expect(context.activeEye).toBe('right');

    // 3. Baseline check -> Show option 1
    context = transitionRefractionFlow(context, {type: 'PROCEED'});
    expect(context.state).toBe('show_option_one');
    expect(context.currentTrial).toBeDefined();

    // Answer trials for right eye until convergence
    while (context.state !== 'switch_eye' && context.state !== 'complete') {
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
            answer: normalizeRefractionAnswer('better'),
            rawInput: 'better',
            inputMethod: 'touch',
          },
        });
      } else if (context.state === 'update_estimate') {
        context = transitionRefractionFlow(context, {
          type: 'CHECK_CONVERGENCE',
        });
      }
    }

    // Should transition to switch_eye for the left eye
    expect(context.state).toBe('switch_eye');

    // Switch eye
    context = transitionRefractionFlow(context, {type: 'SWITCH_EYE'});
    expect(context.state).toBe('baseline_check');
    expect(context.activeEye).toBe('left');

    // Baseline check -> Show option 1 for left eye
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    // Answer trials for left eye until completion
    while (context.state !== 'complete') {
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
            answer: normalizeRefractionAnswer('option 1'),
            rawInput: 'option 1',
            inputMethod: 'voice',
            confidence: 0.9,
          },
        });
      } else if (context.state === 'update_estimate') {
        context = transitionRefractionFlow(context, {
          type: 'CHECK_CONVERGENCE',
        });
      }
    }

    expect(context.state).toBe('complete');
    expect(context.result).toBeDefined();
    expect(context.result?.rightEye).toBeDefined();
    expect(context.result?.leftEye).toBeDefined();
    expect(context.result?.confidence).toBeGreaterThan(0.7);
  });

  it('handles repeated same responses and triggers convergence early', () => {
    let context = createRefractionFlow({eyeMode: 'left'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'left', targetMode: 'single'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'}); // baseline_check -> show_option_one

    // Submit 'same' twice to trigger convergence
    for (let index = 0; index < 2; index += 1) {
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

  it('tracks contradictory responses and sets warnings', () => {
    let context = createRefractionFlow({eyeMode: 'right'});
    context = transitionRefractionFlow(context, {type: 'START'});
    context = transitionRefractionFlow(context, {
      type: 'SELECT_EYE',
      payload: {eye: 'right', targetMode: 'single'},
    });
    context = transitionRefractionFlow(context, {type: 'PROCEED'});

    // Alternating contradictory answers: better, worse, better, worse
    const answers = ['better', 'worse', 'better', 'worse'];
    for (const ans of answers) {
      if (context.state === 'complete') break;
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

  it('handles ABORT event and produces aborted state with warning', () => {
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

  it('serializes and restores flow context round-trip accurately', () => {
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
});
