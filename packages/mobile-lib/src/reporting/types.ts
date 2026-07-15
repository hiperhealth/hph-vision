import type {AcuityResult} from '../acuity';
import type {DeviceProfile} from '../device-profile';
import type {RefractionResult} from '../refraction';
import type {ReliabilityResult} from '../reliability';
import type {
  DomainWarning,
  ISODateString,
  ResultRecommendation,
} from '../types';
import type {TemplateMetadata} from '../template-generator';

export type ReportWarning = DomainWarning;

export type ScreeningReport = {
  id: string;
  sessionId: string;
  createdAt: ISODateString;
  appVersion?: string;
  libraryVersion?: string;
  deviceProfile?: DeviceProfile;
  templateMetadata?: TemplateMetadata;
  acuityResults: AcuityResult[];
  refractionResult?: RefractionResult;
  reliability: ReliabilityResult;
  warnings: ReportWarning[];
  recommendation: ResultRecommendation;
  disclaimer: string;
};

export type RecommendationInput = {
  hasRedFlags?: boolean;
  reliabilityScore?: number;
  refractionConfidence?: number;
  completed?: boolean;
};
