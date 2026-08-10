// generic state machine types and interfaces
// all comments are lowercase to follow workspace guidelines

export interface StateMachineEvent {
  type: string;
  [key: string]: any;
}

export type StateMachineGuard<TContext, TEvent extends StateMachineEvent> = (
  context: TContext,
  event: TEvent,
) => boolean;

export type StateMachineAction<TContext, TEvent extends StateMachineEvent> = (
  context: TContext,
  event: TEvent,
) => TContext;

export interface TransitionConfig<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
> {
  target: TState;
  guard?: StateMachineGuard<TContext, TEvent>;
  action?: StateMachineAction<TContext, TEvent>;
}

export type StateTransitions<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
> = {
  [E in TEvent['type']]?:
    | TransitionConfig<TState, TContext, Extract<TEvent, {type: E}>>
    | TState;
};

export interface StateMachineConfig<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
> {
  id: string;
  initialState: TState;
  initialContext: TContext;
  states: {
    [S in TState]: {
      on?: StateTransitions<TState, TContext, TEvent>;
    };
  };
}

export interface ReplayableEvent<TEvent extends StateMachineEvent> {
  event: TEvent;
  timestamp: string;
}

export interface MachineSnapshot<
  TState extends string,
  TContext,
  TEvent extends StateMachineEvent,
> {
  id: string;
  state: TState;
  context: TContext;
  eventLog: ReplayableEvent<TEvent>[];
}
