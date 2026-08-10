// tests for state machine primitives, engine, and flow configurations
// all comments are lowercase to follow workspace guidelines

import {describe, expect, it} from '@jest/globals';
import {
  StateMachineInstance,
  transition,
  replay,
  InvalidTransitionError,
} from '../engine';
import {
  assertTransition,
  assertInvalidTransition,
  assertSequence,
} from '../testUtils';
import {
  onboardingFlowConfig,
  templateFlowConfig,
  acuityFlowConfig,
  refractionFlowConfig,
  reportFlowConfig,
} from '../domains';

describe('state machine engine', () => {
  it('should initialize with config default values', () => {
    const machine = new StateMachineInstance(onboardingFlowConfig);
    expect(machine.state).toBe('idle');
    expect(machine.context).toEqual({
      disclaimerAccepted: false,
      canContinue: false,
    });
    expect(machine.eventLog).toEqual([]);
  });

  it('should transition correctly on valid events', () => {
    const machine = new StateMachineInstance(onboardingFlowConfig);
    machine.send({type: 'START'});
    expect(machine.state).toBe('disclaimer');
    expect(machine.eventLog.length).toBe(1);
    expect(machine.eventLog[0].event).toEqual({type: 'START'});
  });

  it('should throw error on invalid transition', () => {
    const machine = new StateMachineInstance(onboardingFlowConfig);
    expect(() => {
      machine.send({type: 'ACCEPT_DISCLAIMER'});
    }).toThrow(InvalidTransitionError);
  });

  it('should apply action to update context', () => {
    const machine = new StateMachineInstance(onboardingFlowConfig);
    machine.send({type: 'START'});
    machine.send({type: 'ACCEPT_DISCLAIMER'});
    expect(machine.state).toBe('triage');
    expect(machine.context.disclaimerAccepted).toBe(true);
  });

  it('should serialize and restore state machine snapshot', () => {
    const machine = new StateMachineInstance(onboardingFlowConfig);
    machine.send({type: 'START'});
    machine.send({type: 'ACCEPT_DISCLAIMER'});

    const snapshot = machine.serialize();
    expect(snapshot.id).toBe('onboardingFlow');
    expect(snapshot.state).toBe('triage');
    expect(snapshot.context.disclaimerAccepted).toBe(true);
    expect(snapshot.eventLog.length).toBe(2);

    const restored = StateMachineInstance.restore(
      onboardingFlowConfig,
      snapshot,
    );
    expect(restored.state).toBe('triage');
    expect(restored.context).toEqual({
      disclaimerAccepted: true,
      canContinue: false,
    });
    expect(restored.eventLog.length).toBe(2);
  });

  it('should replay event log correctly', () => {
    const events = [
      {type: 'START' as const},
      {type: 'ACCEPT_DISCLAIMER' as const},
      {type: 'TRIAGE_COMPLETE' as const, canContinue: true},
    ];

    const snapshot = replay(onboardingFlowConfig, events);
    expect(snapshot.state).toBe('complete');
    expect(snapshot.context).toEqual({
      disclaimerAccepted: true,
      canContinue: true,
    });
    expect(snapshot.eventLog.length).toBe(3);
  });
});

describe('state machine domains verification', () => {
  it('should verify onboardingFlow sequence', () => {
    assertSequence(onboardingFlowConfig, [
      {event: {type: 'START'}, expectedState: 'disclaimer'},
      {event: {type: 'ACCEPT_DISCLAIMER'}, expectedState: 'triage'},
      {
        event: {type: 'TRIAGE_COMPLETE', canContinue: true},
        expectedState: 'complete',
      },
    ]);
  });

  it('should verify templateFlow sequence and scale updates', () => {
    assertSequence(templateFlowConfig, [
      {event: {type: 'START_CALIBRATION'}, expectedState: 'calibrating'},
      {
        event: {type: 'CALIBRATE', scale: 1.15},
        expectedState: 'generating',
        assertContext: ctx => {
          expect(ctx.calibrationScale).toBe(1.15);
        },
      },
      {event: {type: 'TEMPLATE_READY'}, expectedState: 'ready'},
    ]);
  });

  it('should verify acuityFlow sequence', () => {
    assertSequence(acuityFlowConfig, [
      {event: {type: 'START'}, expectedState: 'testing_right'},
      {
        event: {type: 'RECORD_RIGHT', score: 0.15},
        expectedState: 'testing_left',
        assertContext: ctx => {
          expect(ctx.rightEyeScore).toBe(0.15);
        },
      },
      {
        event: {type: 'RECORD_LEFT', score: 0.2},
        expectedState: 'complete',
        assertContext: ctx => {
          expect(ctx.leftEyeScore).toBe(0.2);
        },
      },
    ]);
  });

  it('should verify refractionFlow sequence', () => {
    assertSequence(refractionFlowConfig, [
      {event: {type: 'START'}, expectedState: 'testing'},
      {
        event: {type: 'RECORD_ESTIMATES', sphere: -1.25, cylinder: -0.5},
        expectedState: 'complete',
        assertContext: ctx => {
          expect(ctx.sphereEstimate).toBe(-1.25);
          expect(ctx.cylinderEstimate).toBe(-0.5);
        },
      },
    ]);
  });

  it('should verify reportFlow sequence', () => {
    assertSequence(reportFlowConfig, [
      {
        event: {type: 'GENERATE', reportId: 'rep-123'},
        expectedState: 'generating',
        assertContext: ctx => {
          expect(ctx.reportId).toBe('rep-123');
        },
      },
      {
        event: {type: 'SHARE', recipient: 'doctor@example.com'},
        expectedState: 'shared',
        assertContext: ctx => {
          expect(ctx.recipients).toContain('doctor@example.com');
        },
      },
    ]);
  });

  it('should assert transition helper correctly', () => {
    assertTransition(
      onboardingFlowConfig,
      'idle',
      {disclaimerAccepted: false, canContinue: false},
      {type: 'START'},
      'disclaimer',
    );
  });

  it('should assert invalid transition helper correctly', () => {
    assertInvalidTransition(
      onboardingFlowConfig,
      'idle',
      {disclaimerAccepted: false, canContinue: false},
      {type: 'ACCEPT_DISCLAIMER'},
      'not allowed',
    );
  });
});
