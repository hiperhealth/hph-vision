import type {AcuityResponse} from '../acuity';
import type {DeviceProfile} from '../device-profile';
import type {RefractionResponse} from '../refraction';
import type {ISODateString} from '../types';
import type {TriageResult} from '../triage';
import type {TemplateMetadata} from '../template-generator';

export type SessionEvent =
  | {type: 'SESSION_CREATED'; at: ISODateString}
  | {type: 'CONSENT_ACCEPTED'; at: ISODateString}
  | {type: 'TRIAGE_COMPLETED'; at: ISODateString; result: TriageResult}
  | {type: 'DEVICE_PROFILE_SELECTED'; at: ISODateString; profile: DeviceProfile}
  | {type: 'TEMPLATE_GENERATED'; at: ISODateString; metadata: TemplateMetadata}
  | {
      type: 'ACUITY_RESPONSE_RECORDED';
      at: ISODateString;
      response: AcuityResponse;
    }
  | {
      type: 'REFRACTION_RESPONSE_RECORDED';
      at: ISODateString;
      response: RefractionResponse;
    }
  | {type: 'REPORT_CREATED'; at: ISODateString; reportId: string}
  | {type: 'SESSION_CANCELLED'; at: ISODateString};
