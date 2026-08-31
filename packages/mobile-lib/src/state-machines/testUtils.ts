// test utilities for asserting state machine flows
// all comments are lowercase to follow workspace guidelines

import {expect} from '@jest/globals';
import {transition, InvalidTransitionError} from './engine';
import type {StateMachineConfig, StateMachineEvent} from './types';

// asserts that a single event leads to a specific target state and context condition
export function assertTransition<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
>(
  config: StateMachineConfig<TState, TContext, TEvent>,
  fromState: TState,
  fromContext: TContext,
  event: TEvent,
  toState: TState,
  assertContext?: (context: TContext) => void,
): void {
  const result = transition(config, fromState, fromContext, event);
  expect(result.state).toBe(toState);
  if (assertContext) {
    assertContext(result.context);
  }
}

// asserts that a transition throws an invalid transition error
export function assertInvalidTransition<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
>(
  config: StateMachineConfig<TState, TContext, TEvent>,
  fromState: TState,
  fromContext: TContext,
  event: TEvent,
  expectedErrorPart?: string,
): void {
  let threw = false;
  try {
    transition(config, fromState, fromContext, event);
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      threw = true;
      if (expectedErrorPart) {
        expect(error.message.toLowerCase()).toContain(
          expectedErrorPart.toLowerCase(),
        );
      }
    } else {
      throw error;
    }
  }
  expect(threw).toBe(true);
}

// asserts a sequential path of transitions and targets
export function assertSequence<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
>(
  config: StateMachineConfig<TState, TContext, TEvent>,
  sequence: {
    event: TEvent;
    expectedState: TState;
    assertContext?: (context: TContext) => void;
  }[],
): void {
  let state = config.initialState;
  let context = config.initialContext;

  for (const step of sequence) {
    const result = transition(config, state, context, step.event);
    state = result.state;
    context = result.context;

    expect(state).toBe(step.expectedState);
    if (step.assertContext) {
      step.assertContext(context);
    }
  }
}
