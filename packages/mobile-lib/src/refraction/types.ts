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

/** Alias for RefractionTrial representing a discrete step in the refraction protocol */
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

export type RefractionResult = {
  rightEye?: EyeRefractionEstimate;
  leftEye?: EyeRefractionEstimate;
  binocular?: EyeRefractionEstimate;
  confidence: number;
  recommendation: ResultRecommendation;
  reliabilityWarnings: string[];
};
