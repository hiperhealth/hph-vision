import {describe, expect, it} from '@jest/globals';

import {
  createAcuitySession,
  nextAcuityTrial,
  recordAcuityResponse,
  scoreAcuitySession,
  createInitialAcuityFlow,
  transitionAcuityFlow,
  serializeAcuityFlow,
  deserializeAcuityFlow,
} from '..';

describe('acuity protocol', () => {
  it('records responses and scores a completed session', () => {
    let session = createAcuitySession({
      id: 'test-acuity',
      eye: 'right',
      practiceTrials: 0,
      sizeLogMarSequence: [0.4, 0.3],
      randomSeed: 'test',
    });

    for (const trial of session.trials) {
      session = recordAcuityResponse(session, {
        trialId: trial.id,
        answer: trial.orientation,
        inputMethod: 'touch',
        createdAt: '2026-05-12T00:00:00Z',
      });
    }

    expect(nextAcuityTrial(session)).toBeUndefined();
    expect(scoreAcuitySession(session)).toMatchObject({
      completed: true,
      confidence: 1,
      logMarEstimate: 0.3,
    });
  });
});

describe('acuity flow state machine', () => {
  it('should successfully execute a normal flow through all states', () => {
    let flow = createInitialAcuityFlow();
    expect(flow.state).toBe('intro');

    // START event with deterministic timestamp
    const startTimestamp = 1773918000000;
    flow = transitionAcuityFlow(flow, {
      type: 'START',
      eyes: ['right', 'left'],
      options: {
        practiceTrials: 0,
        sizeLogMarSequence: [0.8],
      },
      timestamp: startTimestamp,
    });
    expect(flow.state).toBe('intro');
    expect(flow.context.metrics.startTime).toBe(new Date(startTimestamp).toISOString());

    // ACK_INTRO -> practice
    flow = transitionAcuityFlow(flow, {type: 'ACK_INTRO'});
    expect(flow.state).toBe('practice');

    // ACK_PRACTICE -> select_eye
    flow = transitionAcuityFlow(flow, {type: 'ACK_PRACTICE'});
    expect(flow.state).toBe('select_eye');

    // SELECT_EYE -> prepare_eye_occlusion
    flow = transitionAcuityFlow(flow, {
      type: 'SELECT_EYE',
      eye: 'right',
    });
    expect(flow.state).toBe('prepare_eye_occlusion');
    expect(flow.context.sessions.right).toBeDefined();

    // ACK_OCCLUSION -> show_stimulus
    flow = transitionAcuityFlow(flow, {
      type: 'ACK_OCCLUSION',
      timestamp: startTimestamp + 1000,
    });
    expect(flow.state).toBe('show_stimulus');

    // STIMULUS_DISPLAYED -> collect_response
    flow = transitionAcuityFlow(flow, {
      type: 'STIMULUS_DISPLAYED',
      timestamp: startTimestamp + 2000,
    });
    expect(flow.state).toBe('collect_response');

    // RECORD_ANSWER -> confirm_response
    flow = transitionAcuityFlow(flow, {
      type: 'RECORD_ANSWER',
      answer: 'up',
      inputMethod: 'touch',
      timestamp: startTimestamp + 3500, // 1500ms response time
    });
    expect(flow.state).toBe('confirm_response');
    expect(flow.context.pendingResponse?.responseTimeMs).toBe(1500);

    // CONFIRM_ANSWER -> score_trial
    flow = transitionAcuityFlow(flow, {type: 'CONFIRM_ANSWER'});
    expect(flow.state).toBe('score_trial');

    // SCORE_TRIAL -> advance_level
    flow = transitionAcuityFlow(flow, {type: 'SCORE_TRIAL'});
    expect(flow.state).toBe('advance_level');

    // ADVANCE_LEVEL -> switch_eye
    flow = transitionAcuityFlow(flow, {
      type: 'ADVANCE_LEVEL',
      timestamp: startTimestamp + 4000,
    });
    expect(flow.state).toBe('switch_eye');
  });

  it('should support aborting from any state', () => {
    let flow = createInitialAcuityFlow();
    
    // Abort from intro
    flow = transitionAcuityFlow(flow, {
      type: 'ABORT',
      timestamp: 1773918000000,
    });
    expect(flow.state).toBe('aborted');
    expect(flow.context.metrics.endTime).toBe(new Date(1773918000000).toISOString());

    // Reset and Abort from select_eye
    flow = createInitialAcuityFlow();
    flow = transitionAcuityFlow(flow, {
      type: 'START',
      eyes: ['right'],
      timestamp: 1773918000000,
    });
    flow = transitionAcuityFlow(flow, {type: 'ACK_INTRO'});
    flow = transitionAcuityFlow(flow, {type: 'ACK_PRACTICE'});
    expect(flow.state).toBe('select_eye');

    flow = transitionAcuityFlow(flow, {
      type: 'ABORT',
      timestamp: 1773918001000,
    });
    expect(flow.state).toBe('aborted');
    expect(flow.context.metrics.endTime).toBe(new Date(1773918001000).toISOString());
  });

  it('should successfully switch eyes and run Left Eye flow', () => {
    let flow = createInitialAcuityFlow();
    const startTimestamp = 1773918000000;
    
    flow = transitionAcuityFlow(flow, {
      type: 'START',
      eyes: ['right', 'left'],
      options: {
        practiceTrials: 0,
        sizeLogMarSequence: [0.8],
      },
      timestamp: startTimestamp,
    });
    flow = transitionAcuityFlow(flow, {type: 'ACK_INTRO'});
    flow = transitionAcuityFlow(flow, {type: 'ACK_PRACTICE'});
    flow = transitionAcuityFlow(flow, {type: 'SELECT_EYE', eye: 'right'});
    flow = transitionAcuityFlow(flow, {type: 'ACK_OCCLUSION', timestamp: startTimestamp + 1000});
    flow = transitionAcuityFlow(flow, {type: 'STIMULUS_DISPLAYED', timestamp: startTimestamp + 2000});
    flow = transitionAcuityFlow(flow, {
      type: 'RECORD_ANSWER',
      answer: 'up',
      inputMethod: 'touch',
      timestamp: startTimestamp + 3000,
    });
    flow = transitionAcuityFlow(flow, {type: 'CONFIRM_ANSWER'});
    flow = transitionAcuityFlow(flow, {type: 'SCORE_TRIAL'});
    
    // ADVANCE_LEVEL -> transitions to switch_eye
    flow = transitionAcuityFlow(flow, {type: 'ADVANCE_LEVEL', timestamp: startTimestamp + 4000});
    expect(flow.state).toBe('switch_eye');
    expect(flow.context.currentEyeIndex).toBe(1);

    // ACK_SWITCH_EYE -> transitions to prepare_eye_occlusion
    flow = transitionAcuityFlow(flow, {type: 'ACK_SWITCH_EYE'});
    expect(flow.state).toBe('prepare_eye_occlusion');
    expect(flow.context.sessions.left).toBeDefined();

    // Complete Left Eye sequence
    flow = transitionAcuityFlow(flow, {type: 'ACK_OCCLUSION', timestamp: startTimestamp + 5000});
    flow = transitionAcuityFlow(flow, {type: 'STIMULUS_DISPLAYED', timestamp: startTimestamp + 6000});
    flow = transitionAcuityFlow(flow, {
      type: 'RECORD_ANSWER',
      answer: 'up',
      inputMethod: 'touch',
      timestamp: startTimestamp + 7000,
    });
    flow = transitionAcuityFlow(flow, {type: 'CONFIRM_ANSWER'});
    flow = transitionAcuityFlow(flow, {type: 'SCORE_TRIAL'});

    // ADVANCE_LEVEL -> complete (all eyes finished)
    flow = transitionAcuityFlow(flow, {type: 'ADVANCE_LEVEL', timestamp: startTimestamp + 10000});
    expect(flow.state).toBe('complete');
    expect(flow.context.results.right).toBeDefined();
    expect(flow.context.results.left).toBeDefined();
    expect(flow.context.metrics.durationMs).toBe(10000);
  });

  it('should validate invalid responses and handle repeated/wrong answers', () => {
    let flow = createInitialAcuityFlow();
    const startTimestamp = 1773918000000;

    flow = transitionAcuityFlow(flow, {
      type: 'START',
      eyes: ['right'],
      options: {
        practiceTrials: 0,
        sizeLogMarSequence: [0.8],
      },
      timestamp: startTimestamp,
    });
    flow = transitionAcuityFlow(flow, {type: 'ACK_INTRO'});
    flow = transitionAcuityFlow(flow, {type: 'ACK_PRACTICE'});
    
    // SELECT_EYE with invalid eye (not in context.eyes)
    // Should be ignored and return current flow unmodified
    const flowInvalid = transitionAcuityFlow(flow, {
      type: 'SELECT_EYE',
      eye: 'left',
    });
    expect(flowInvalid.state).toBe('select_eye');
    expect(flowInvalid.context.sessions.left).toBeUndefined();

    // SELECT_EYE with valid eye
    flow = transitionAcuityFlow(flow, {type: 'SELECT_EYE', eye: 'right'});
    expect(flow.state).toBe('prepare_eye_occlusion');

    flow = transitionAcuityFlow(flow, {type: 'ACK_OCCLUSION', timestamp: startTimestamp + 1000});
    flow = transitionAcuityFlow(flow, {type: 'STIMULUS_DISPLAYED', timestamp: startTimestamp + 2000});

    // RECORD_ANSWER (attemptsCount = 1)
    flow = transitionAcuityFlow(flow, {
      type: 'RECORD_ANSWER',
      answer: 'down',
      inputMethod: 'voice',
      timestamp: startTimestamp + 3000,
    });
    expect(flow.state).toBe('confirm_response');

    // Reject answer -> goes back to collect_response, resets pending response
    flow = transitionAcuityFlow(flow, {type: 'REJECT_ANSWER'});
    expect(flow.state).toBe('collect_response');
    expect(flow.context.pendingResponse).toBeUndefined();
    expect(flow.context.metrics.repeatedAnswersCount).toBe(0);

    // Record answer again (attemptsCount = 2, triggers repeated answer tracking)
    flow = transitionAcuityFlow(flow, {
      type: 'RECORD_ANSWER',
      answer: 'left', // wrong answer
      inputMethod: 'voice',
      timestamp: startTimestamp + 4000,
    });
    expect(flow.state).toBe('confirm_response');
    expect(flow.context.metrics.repeatedAnswersCount).toBe(1);

    // Confirm answer and score trial
    flow = transitionAcuityFlow(flow, {type: 'CONFIRM_ANSWER'});
    flow = transitionAcuityFlow(flow, {type: 'SCORE_TRIAL'});
    expect(flow.state).toBe('advance_level');
    // Wrong answer is tracked
    expect(flow.context.metrics.wrongAnswersCount).toBe(1);
    expect(flow.context.metrics.correctAnswers).toBe(0);

    // ADVANCE_LEVEL -> complete
    flow = transitionAcuityFlow(flow, {type: 'ADVANCE_LEVEL', timestamp: startTimestamp + 5000});
    expect(flow.state).toBe('complete');
  });

  it('should support serialization and restoration of flow state', () => {
    let flow = createInitialAcuityFlow();
    flow = transitionAcuityFlow(flow, {
      type: 'START',
      eyes: ['right'],
      timestamp: 1773918000000,
    });
    flow = transitionAcuityFlow(flow, {type: 'ACK_INTRO'});
    flow = transitionAcuityFlow(flow, {type: 'ACK_PRACTICE'});
    flow = transitionAcuityFlow(flow, {type: 'SELECT_EYE', eye: 'right'});

    expect(flow.state).toBe('prepare_eye_occlusion');

    // Serialize flow
    const serialized = serializeAcuityFlow(flow);
    expect(typeof serialized).toBe('string');

    // Restore flow
    const restored = deserializeAcuityFlow(serialized);
    expect(restored.state).toBe('prepare_eye_occlusion');
    expect(restored.context.eyes).toEqual(['right']);
    expect(restored.context.sessions.right).toBeDefined();
    expect(restored.context.metrics.startTime).toBe(new Date(1773918000000).toISOString());
  });
});
