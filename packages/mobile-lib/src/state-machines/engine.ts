// generic state machine engine and helper implementation
// all comments are lowercase to follow workspace guidelines

import type {
  StateMachineConfig,
  StateMachineEvent,
  MachineSnapshot,
  ReplayableEvent,
} from './types';

export class InvalidTransitionError extends Error {
  constructor(
    public readonly machineId: string,
    public readonly state: string,
    public readonly eventType: string,
    message: string,
  ) {
    super(message);
    this.name = 'InvalidTransitionError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// pure helper function to compute next state and context
export function transition<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
>(
  config: StateMachineConfig<TState, TContext, TEvent>,
  state: TState,
  context: TContext,
  event: TEvent,
): {state: TState; context: TContext} {
  const stateConfig = config.states[state];
  if (!stateConfig) {
    throw new InvalidTransitionError(
      config.id,
      state,
      event.type,
      `state ${state} is not defined in machine ${config.id}`,
    );
  }

  const transitionConfig = stateConfig.on?.[event.type as TEvent['type']];
  if (!transitionConfig) {
    throw new InvalidTransitionError(
      config.id,
      state,
      event.type,
      `transition from state ${state} on event ${event.type} is not allowed`,
    );
  }

  let target: TState;
  let guard: ((c: TContext, e: any) => boolean) | undefined;
  let action: ((c: TContext, e: any) => TContext) | undefined;

  if (typeof transitionConfig === 'string') {
    target = transitionConfig as TState;
  } else {
    target = transitionConfig.target as TState;
    guard = transitionConfig.guard;
    action = transitionConfig.action;
  }

  if (guard && !guard(context, event)) {
    throw new InvalidTransitionError(
      config.id,
      state,
      event.type,
      `guard condition failed for transition from state ${state} on event ${event.type}`,
    );
  }

  const nextContext = action ? action(context, event) : context;
  return {state: target, context: nextContext};
}

// replay helper to apply multiple events sequentially and generate a snapshot
export function replay<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
>(
  config: StateMachineConfig<TState, TContext, TEvent>,
  events: (TEvent | ReplayableEvent<TEvent>)[],
): MachineSnapshot<TState, TContext, TEvent> {
  let state = config.initialState;
  let context = config.initialContext;
  const eventLog: ReplayableEvent<TEvent>[] = [];

  for (const item of events) {
    const event = 'event' in item ? item.event : item;
    const timestamp =
      'timestamp' in item ? item.timestamp : new Date().toISOString();

    const result = transition(config, state, context, event);
    state = result.state;
    context = result.context;

    eventLog.push({event, timestamp});
  }

  return {
    id: config.id,
    state,
    context,
    eventLog,
  };
}

// instance class wrapper for state machine state tracking
export class StateMachineInstance<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
> {
  private _state: TState;
  private _context: TContext;
  private _eventLog: ReplayableEvent<TEvent>[] = [];

  constructor(
    private readonly config: StateMachineConfig<TState, TContext, TEvent>,
    initialState?: TState,
    initialContext?: TContext,
    eventLog?: ReplayableEvent<TEvent>[],
  ) {
    this._state = initialState ?? config.initialState;
    this._context = initialContext ?? config.initialContext;
    this._eventLog = eventLog ?? [];
  }

  get state(): TState {
    return this._state;
  }

  get context(): TContext {
    return this._context;
  }

  get eventLog(): ReplayableEvent<TEvent>[] {
    return [...this._eventLog];
  }

  send(event: TEvent, timestamp?: string): this {
    const time = timestamp ?? new Date().toISOString();
    const result = transition(this.config, this._state, this._context, event);
    this._state = result.state;
    this._context = result.context;
    this._eventLog.push({event, timestamp: time});
    return this;
  }

  serialize(): MachineSnapshot<TState, TContext, TEvent> {
    return {
      id: this.config.id,
      state: this._state,
      context: this._context,
      eventLog: [...this._eventLog],
    };
  }

  static restore<
    TState extends string,
    TContext,
    TEvent extends StateMachineEvent,
  >(
    config: StateMachineConfig<TState, TContext, TEvent>,
    snapshot: MachineSnapshot<TState, TContext, TEvent>,
  ): StateMachineInstance<TState, TContext, TEvent> {
    if (snapshot.id !== config.id) {
      throw new Error(
        `snapshot id mismatch: expected ${config.id}, got ${snapshot.id}`,
      );
    }
    return new StateMachineInstance(
      config,
      snapshot.state,
      snapshot.context,
      snapshot.eventLog,
    );
  }

  replay(events: TEvent[], timestampGen?: () => string): this {
    const gen = timestampGen ?? (() => new Date().toISOString());
    for (const event of events) {
      this.send(event, gen());
    }
    return this;
  }
}
