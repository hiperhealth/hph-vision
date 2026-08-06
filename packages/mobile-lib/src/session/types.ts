import type {AcuityResult} from '../acuity';
import type {DeviceProfile} from '../device-profile';
import type {RefractionResult} from '../refraction';
import type {ReliabilityResult} from '../reliability';
import type {DomainWarning, ISODateString} from '../types';
import type {TriageResult} from '../triage';
import type {TemplateMetadata} from '../template-generator';

// named alias used when attaching session-level warnings to a report or export
export type SessionWarning = DomainWarning;

// a 0–1 scalar representing the overall reliability of the session
export type ReliabilityScore = number;

export type ProtocolVersions = {
  acuity?: string;
  refraction?: string;
  template?: string;
  report?: string;
};

export type PatientContext = {
  ageRange?: string;
  currentGlasses?: boolean;
  previousPrescription?: boolean;
};

export type EnvironmentContext = {
  ambientLightLux?: number;
  screenBrightness?: number;
  distanceConfidence?: number;
  tiltConfidence?: number;
};

export type TestSession = {
  id: string;
  createdAt: ISODateString;
  // set when the session is finalized (all active tests completed or aborted)
  completedAt?: ISODateString;
  appVersion?: string;
  libraryVersion?: string;
  protocolVersions?: ProtocolVersions;
  deviceProfile?: DeviceProfile;
  templateMetadata?: TemplateMetadata;
  patientContext: PatientContext;
  environment: EnvironmentContext;
  triageResult?: TriageResult;
  acuityResults: AcuityResult[];
  refractionResult?: RefractionResult;
  reliability?: ReliabilityResult;
  // overall session reliability as a 0–1 scalar — see ReliabilityScore
  reliabilityScore: ReliabilityScore;
  warnings: SessionWarning[];
};
