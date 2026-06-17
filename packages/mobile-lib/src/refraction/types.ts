import type {
  Eye,
  InputMethod,
  ISODateString,
  ResultRecommendation,
} from '../types';

export type BetterWorseSame = 'better' | 'worse' | 'same' | 'unknown';
export type OneTwoChoice = 'one' | 'two' | 'same' | 'unknown';

export type RefractionStimulus = {
  id: string;
  sphereDelta?: number;
  cylinderDelta?: number;
  axisDelta?: number;
  labelKey: string;
};

export type RefractionTrial = {
  id: string;
  eye: Eye;
  kind: 'sphericalComparison' | 'cylinderComparison' | 'axisComparison';
  promptKey: string;
  optionA?: RefractionStimulus;
  optionB?: RefractionStimulus;
};

export type RefractionResponse = {
  trialId: string;
  answer: BetterWorseSame | OneTwoChoice;
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

export type EyeRefractionEstimate = {
  sphere?: number;
  cylinder?: number;
  axis?: number;
  sphericalEquivalent?: number;
  confidenceInterval?: {
    sphere?: [number, number];
    cylinder?: [number, number];
    axis?: [number, number];
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
