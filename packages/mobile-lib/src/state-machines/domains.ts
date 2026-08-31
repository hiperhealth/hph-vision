// implementation of required machine domains: onboarding, template, acuity, refraction, report
// all comments are lowercase to follow workspace guidelines

import type {StateMachineConfig} from './types';

// --- onboardingFlow ---

export type OnboardingState = 'idle' | 'disclaimer' | 'triage' | 'complete';

export interface OnboardingContext {
  disclaimerAccepted: boolean;
  canContinue: boolean;
}

export type OnboardingEvent =
  | {type: 'START'}
  | {type: 'ACCEPT_DISCLAIMER'}
  | {type: 'TRIAGE_COMPLETE'; canContinue: boolean}
  | {type: 'RESET'};

export const onboardingFlowConfig: StateMachineConfig<
  OnboardingState,
  OnboardingContext,
  OnboardingEvent
> = {
  id: 'onboardingFlow',
  initialState: 'idle',
  initialContext: {disclaimerAccepted: false, canContinue: false},
  states: {
    idle: {
      on: {
        START: 'disclaimer',
      },
    },
    disclaimer: {
      on: {
        ACCEPT_DISCLAIMER: {
          target: 'triage',
          action: ctx => ({...ctx, disclaimerAccepted: true}),
        },
        RESET: 'idle',
      },
    },
    triage: {
      on: {
        TRIAGE_COMPLETE: {
          target: 'complete',
          guard: (_ctx, evt) => evt.canContinue,
          action: (ctx, evt) => ({...ctx, canContinue: evt.canContinue}),
        },
        RESET: 'idle',
      },
    },
    complete: {
      on: {
        RESET: 'idle',
      },
    },
  },
};

// --- templateFlow ---

export type TemplateState =
  | 'idle'
  | 'calibrating'
  | 'generating'
  | 'ready'
  | 'error';

export interface TemplateContext {
  calibrationScale: number;
  error?: string;
}

export type TemplateEvent =
  | {type: 'START_CALIBRATION'}
  | {type: 'CALIBRATE'; scale: number}
  | {type: 'GENERATE_TEMPLATE'}
  | {type: 'TEMPLATE_READY'}
  | {type: 'FAIL'; error: string}
  | {type: 'RESET'};

export const templateFlowConfig: StateMachineConfig<
  TemplateState,
  TemplateContext,
  TemplateEvent
> = {
  id: 'templateFlow',
  initialState: 'idle',
  initialContext: {calibrationScale: 1.0},
  states: {
    idle: {
      on: {
        START_CALIBRATION: 'calibrating',
      },
    },
    calibrating: {
      on: {
        CALIBRATE: {
          target: 'generating',
          action: (ctx, evt) => ({...ctx, calibrationScale: evt.scale}),
        },
        RESET: 'idle',
      },
    },
    generating: {
      on: {
        TEMPLATE_READY: 'ready',
        FAIL: {
          target: 'error',
          action: (ctx, evt) => ({...ctx, error: evt.error}),
        },
        RESET: 'idle',
      },
    },
    ready: {
      on: {
        RESET: 'idle',
      },
    },
    error: {
      on: {
        RESET: 'idle',
      },
    },
  },
};

// --- acuityFlow ---

export type AcuityState =
  | 'idle'
  | 'testing_right'
  | 'testing_left'
  | 'complete';

export interface AcuityContext {
  rightEyeScore: number;
  leftEyeScore: number;
}

export type AcuityEvent =
  | {type: 'START'}
  | {type: 'RECORD_RIGHT'; score: number}
  | {type: 'RECORD_LEFT'; score: number}
  | {type: 'FINISH'}
  | {type: 'RESET'};

export const acuityFlowConfig: StateMachineConfig<
  AcuityState,
  AcuityContext,
  AcuityEvent
> = {
  id: 'acuityFlow',
  initialState: 'idle',
  initialContext: {rightEyeScore: 0.0, leftEyeScore: 0.0},
  states: {
    idle: {
      on: {
        START: 'testing_right',
      },
    },
    testing_right: {
      on: {
        RECORD_RIGHT: {
          target: 'testing_left',
          action: (ctx, evt) => ({...ctx, rightEyeScore: evt.score}),
        },
        RESET: 'idle',
      },
    },
    testing_left: {
      on: {
        RECORD_LEFT: {
          target: 'complete',
          action: (ctx, evt) => ({...ctx, leftEyeScore: evt.score}),
        },
        RESET: 'idle',
      },
    },
    complete: {
      on: {
        RESET: 'idle',
      },
    },
  },
};

// --- refractionFlow ---

export type RefractionState = 'idle' | 'testing' | 'complete';

export interface RefractionContext {
  sphereEstimate: number;
  cylinderEstimate: number;
}

export type RefractionEvent =
  | {type: 'START'}
  | {type: 'RECORD_ESTIMATES'; sphere: number; cylinder: number}
  | {type: 'RESET'};

export const refractionFlowConfig: StateMachineConfig<
  RefractionState,
  RefractionContext,
  RefractionEvent
> = {
  id: 'refractionFlow',
  initialState: 'idle',
  initialContext: {sphereEstimate: 0.0, cylinderEstimate: 0.0},
  states: {
    idle: {
      on: {
        START: 'testing',
      },
    },
    testing: {
      on: {
        RECORD_ESTIMATES: {
          target: 'complete',
          action: (ctx, evt) => ({
            ...ctx,
            sphereEstimate: evt.sphere,
            cylinderEstimate: evt.cylinder,
          }),
        },
        RESET: 'idle',
      },
    },
    complete: {
      on: {
        RESET: 'idle',
      },
    },
  },
};

// --- reportFlow ---

export type ReportState = 'idle' | 'generating' | 'ready' | 'shared';

export interface ReportContext {
  reportId?: string;
  recipients: string[];
}

export type ReportEvent =
  | {type: 'GENERATE'; reportId: string}
  | {type: 'SHARE'; recipient: string}
  | {type: 'RESET'};

export const reportFlowConfig: StateMachineConfig<
  ReportState,
  ReportContext,
  ReportEvent
> = {
  id: 'reportFlow',
  initialState: 'idle',
  initialContext: {recipients: []},
  states: {
    idle: {
      on: {
        GENERATE: {
          target: 'generating',
          action: (ctx, evt) => ({...ctx, reportId: evt.reportId}),
        },
      },
    },
    generating: {
      on: {
        RESET: 'idle',
        SHARE: {
          target: 'shared',
          action: (ctx, evt) => ({
            ...ctx,
            recipients: [...ctx.recipients, evt.recipient],
          }),
        },
      },
    },
    ready: {
      on: {
        SHARE: {
          target: 'shared',
          action: (ctx, evt) => ({
            ...ctx,
            recipients: [...ctx.recipients, evt.recipient],
          }),
        },
        RESET: 'idle',
      },
    },
    shared: {
      on: {
        RESET: 'idle',
      },
    },
  },
};
