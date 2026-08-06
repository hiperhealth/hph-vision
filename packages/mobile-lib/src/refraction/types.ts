import type {
  Eye,
  InputMethod,
  ISODateString,
  ResultRecommendation,
} from '../types';

export type CanonicalRefractionVocab =
  | 'better'
  | 'worse'
  | 'same'
  | 'one'
  | 'two'
  | 'unknown';

export type RefractionAnswerToken = CanonicalRefractionVocab;

export type BetterWorseSame = 'better' | 'worse' | 'same' | 'unknown';
export type OneTwoChoice = 'one' | 'two' | 'same' | 'unknown';

export type RefractionChoice = {
  id: string;
  labelKey: string;
  value: RefractionAnswerToken;
};

export type RefractionPrompt = {
  key: string;
  textKey: string;
  choices: RefractionChoice[];
};

export type RefractionStimulus = {
  id: string;
  sphereDelta?: number;
  cylinderDelta?: number;
  axisDelta?: number;
  labelKey: string;
};

export type RefractionTrialKind =
  | 'sphericalComparison'
  | 'cylinderComparison'
  | 'axisComparison';

export type RefractionTrial = {
  id: string;
  eye: Eye;
  kind: RefractionTrialKind;
  promptKey: string;
  optionA?: RefractionStimulus;
  optionB?: RefractionStimulus;
};

export type RefractionStep = RefractionTrial;

export type RefractionResponse = {
  trialId: string;
  answer: RefractionAnswerToken;
  rawInput?: string;
  responseTimeMs?: number;
  inputMethod: InputMethod;
  confidence?: number;
  createdAt: ISODateString;
};

export type RefractionSessionOptions = {
  id?: string;
  eye: Eye;
  initialSphere?: number;
  maxTrials?: number;
};

export type RefractionSession = {
  id: string;
  protocolVersion: 'refraction-v0.1';
  eye: Eye;
  initialSphere: number;
  trials: RefractionTrial[];
  responses: RefractionResponse[];
  completed: boolean;
};

export type RefractionRange = [number, number];

export type EyeRefractionEstimate = {
  sphere?: number;
  cylinder?: number;
  axis?: number;
  sphericalEquivalent?: number;
  sphereRange?: RefractionRange;
  cylinderRange?: RefractionRange;
  axisRange?: RefractionRange;
  confidenceInterval?: {
    sphere?: RefractionRange;
    cylinder?: RefractionRange;
    axis?: RefractionRange;
  };
};

// result of a guided subjective refraction screening session
// the estimates here are for screening only - they don't replace a clinical prescription
// and should always be reviewed by a qualified clinician
export type RefractionResult = {
  rightEye?: EyeRefractionEstimate;
  leftEye?: EyeRefractionEstimate;
  binocular?: EyeRefractionEstimate;
  confidence: number;
  recommendation: ResultRecommendation;
  reliabilityWarnings: string[];
};

// possible states the guided refraction flow can be in
export type RefractionFlowState =
  | 'intro'
  | 'select_eye'
  | 'baseline_check'
  | 'show_option_one'
  | 'show_option_two'
  | 'ask_better_worse_same'
  | 'collect_response'
  | 'update_estimate'
  | 'check_convergence'
  | 'switch_eye'
  | 'complete'
  | 'aborted';

export type RefractionFlowEvent =
  | {type: 'START'}
  | {
      type: 'SELECT_EYE';
      payload: {eye: Eye; targetMode?: 'single' | 'both'};
    }
  | {type: 'PROCEED'}
  | {type: 'PRESENT_OPTION_ONE'}
  | {type: 'PRESENT_OPTION_TWO'}
  | {type: 'ASK_QUESTION'}
  | {
      type: 'SUBMIT_RESPONSE';
      payload: {
        answer: RefractionAnswerToken;
        rawInput?: string;
        inputMethod: InputMethod;
        confidence?: number;
        responseTimeMs?: number;
      };
    }
  | {type: 'CHECK_CONVERGENCE'}
  | {type: 'SWITCH_EYE'}
  | {type: 'ABORT'}
  | {type: 'RESTORE'; payload: {context: RefractionFlowContext}};

export type RefractionFlowContext = {
  state: RefractionFlowState;
  selectedEyeMode: 'right' | 'left' | 'both';
  activeEye: Eye;
  initialSphere: number;
  maxTrials: number;
  // optional clock for deterministic timestamps in tests
  now?: () => string;
  rightEyeSession?: RefractionSession;
  leftEyeSession?: RefractionSession;
  binocularSession?: RefractionSession;
  currentTrialIndex: number;
  currentTrial?: RefractionTrial;
  lastResponse?: RefractionResponse;
  contradictionCount: number;
  consecutiveSameCount: number;
  convergenceReached: boolean;
  result?: RefractionResult;
  warnings: string[];
};

export type SerializedRefractionFlowState = {
  version: 'refraction-flow-v1';
  context: RefractionFlowContext;
  serializedAt: ISODateString;
};
