import type {Eye, InputMethod, ISODateString} from '../types';

export type OptotypeKind = 'tumblingE' | 'landoltC';
export type OptotypeOrientation = 'up' | 'down' | 'left' | 'right';

export type AcuityLevel = number;

export type AcuityTrial = {
  id: string;
  eye: Eye;
  optotype: OptotypeKind;
  orientation: OptotypeOrientation;
  sizeLogMar: AcuityLevel;
  isPractice: boolean;
  startedAt?: ISODateString;
};

export type AcuityResponse = {
  trialId: string;
  answer: OptotypeOrientation | 'unknown' | 'skipped';
  responseTimeMs?: number;
  inputMethod: InputMethod;
  confidence?: number;
  createdAt: ISODateString;
};

export type AcuityTrialResponse = AcuityResponse;

export type OptotypeRenderingMetadata = {
  gridSize: number;
  strokeWidthRatio: number;
  gapSizeRatio: number;
  rotationDegrees: number;
};

export type OptotypeStimulus = {
  optotype: OptotypeKind;
  orientation: OptotypeOrientation;
  sizeLogMar: AcuityLevel;
  rendering: OptotypeRenderingMetadata;
};

export type AcuitySessionOptions = {
  id?: string;
  eye: Eye;
  optotype?: OptotypeKind;
  randomSeed?: string;
  practiceTrials?: number;
  sizeLogMarSequence?: number[];
};

export type AcuitySession = {
  id: string;
  protocolVersion: 'acuity-v0.1';
  eye: Eye;
  optotype: OptotypeKind;
  trials: AcuityTrial[];
  responses: AcuityResponse[];
  completed: boolean;
};

export type AcuityResult = {
  eye: Eye;
  logMarEstimate?: number;
  snellenEquivalent?: string;
  completed: boolean;
  confidence: number;
  reliabilityWarnings: string[];
  trials: AcuityTrial[];
  responses: AcuityResponse[];
};

// --- Flow State Machine Types ---

export type FlowState =
  | 'intro'
  | 'practice'
  | 'select_eye'
  | 'prepare_eye_occlusion'
  | 'show_stimulus'
  | 'collect_response'
  | 'confirm_response'
  | 'score_trial'
  | 'advance_level'
  | 'switch_eye'
  | 'complete'
  | 'aborted';

export type FlowMetrics = {
  startTime?: ISODateString;
  endTime?: ISODateString;
  durationMs?: number;
  totalTrials: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedTrials: number;
  repeatedAnswersCount: number;
  wrongAnswersCount: number;
};

export type FlowContext = {
  eyes: Eye[];
  currentEyeIndex: number;
  sessions: Partial<Record<Eye, AcuitySession>>;
  results: Partial<Record<Eye, AcuityResult>>;
  pendingResponse?: AcuityResponse;
  options: Omit<AcuitySessionOptions, 'eye'>;
  metrics: FlowMetrics;
  currentTrialStartTime?: number;
  trialAttemptsCount: number;
};

export type AcuityFlow = {
  state: FlowState;
  context: FlowContext;
};

export type FlowEvent =
  | {
      type: 'START';
      eyes?: Eye[];
      options?: Omit<AcuitySessionOptions, 'eye'>;
      timestamp?: number;
      createdAt?: ISODateString;
    }
  | {
      type: 'ACK_INTRO';
    }
  | {
      type: 'ACK_PRACTICE';
    }
  | {
      type: 'SELECT_EYE';
      eye?: Eye;
    }
  | {
      type: 'ACK_OCCLUSION';
      timestamp?: number;
      createdAt?: ISODateString;
    }
  | {
      type: 'STIMULUS_DISPLAYED';
      timestamp?: number;
      createdAt?: ISODateString;
    }
  | {
      type: 'RECORD_ANSWER';
      answer: OptotypeOrientation | 'unknown' | 'skipped';
      inputMethod: InputMethod;
      confidence?: number;
      responseTimeMs?: number;
      createdAt?: ISODateString;
      timestamp?: number;
    }
  | {
      type: 'CONFIRM_ANSWER';
    }
  | {
      type: 'REJECT_ANSWER';
    }
  | {
      type: 'SCORE_TRIAL';
    }
  | {
      type: 'ADVANCE_LEVEL';
      timestamp?: number;
      createdAt?: ISODateString;
    }
  | {
      type: 'ACK_SWITCH_EYE';
    }
  | {
      type: 'ABORT';
      timestamp?: number;
      createdAt?: ISODateString;
    }
  | {
      type: 'RESET';
    };
