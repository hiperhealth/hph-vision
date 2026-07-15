import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type {
  AcuityResult,
  AcuitySession,
  DeviceProfile,
  PhoneGeometry,
  RefractionResult,
  RefractionSession,
  ReliabilityResult,
  ScreeningReport,
  TemplateDocument,
  TriageAnswer,
  TriageResult,
} from '@hiperhealth/hphvision-lib';
import type {AppRoute} from '../app/routes';

export type OnboardingAnswers = {
  ageRange?: string;
  currentGlasses?: boolean;
  contactLensUse?: boolean;
  hasPreviousPrescription?: boolean;
  testingReason?: string;
  preferredLanguage: string;
  voiceEnabled: boolean;
  wantsClinicianReview: boolean;
};

export type HphVisionAppState = {
  sessionId: string;
  createdAt: string;
  route: AppRoute;
  routeHistory: AppRoute[];
  consentAccepted: boolean;
  onboarding?: OnboardingAnswers;
  triageAnswers: TriageAnswer[];
  triageResult?: TriageResult;
  deviceProfile?: DeviceProfile;
  phoneGeometry?: PhoneGeometry;
  templateDocument?: TemplateDocument;
  acuitySession?: AcuitySession;
  acuityResult?: AcuityResult;
  refractionSession?: RefractionSession;
  refractionResult?: RefractionResult;
  reliability?: ReliabilityResult;
  report?: ScreeningReport;
};

export type HphVisionAppActions = {
  navigate: (route: AppRoute) => void;
  back: () => void;
  resetSession: () => void;
  acceptConsent: () => void;
  saveOnboarding: (answers: OnboardingAnswers) => void;
  saveTriage: (answers: TriageAnswer[], result: TriageResult) => void;
  saveDeviceCalibration: (
    profile: DeviceProfile,
    phoneGeometry: PhoneGeometry,
  ) => void;
  saveTemplateDocument: (document: TemplateDocument) => void;
  saveAcuitySession: (session: AcuitySession) => void;
  saveAcuityResult: (result: AcuityResult) => void;
  saveRefractionSession: (session: RefractionSession) => void;
  saveRefractionResult: (result: RefractionResult) => void;
  saveResults: (
    reliability: ReliabilityResult,
    report: ScreeningReport,
  ) => void;
};

type HphVisionAppContextValue = {
  state: HphVisionAppState;
  actions: HphVisionAppActions;
};

const createSessionId = (): string => `mobile-session-${Date.now()}`;

export const createInitialAppState = (): HphVisionAppState => ({
  sessionId: createSessionId(),
  createdAt: new Date().toISOString(),
  route: 'disclaimer',
  routeHistory: [],
  consentAccepted: false,
  triageAnswers: [],
});

const HphVisionAppContext = createContext<HphVisionAppContextValue | undefined>(
  undefined,
);

export const HphVisionAppProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<HphVisionAppState>(() =>
    createInitialAppState(),
  );

  const navigate = useCallback((route: AppRoute) => {
    setState(previous => {
      if (previous.route === route) {
        return previous;
      }

      return {
        ...previous,
        route,
        routeHistory: [...previous.routeHistory, previous.route],
      };
    });
  }, []);

  const back = useCallback(() => {
    setState(previous => {
      if (previous.routeHistory.length === 0) {
        return previous;
      }

      const routeHistory = previous.routeHistory.slice(0, -1);
      const route =
        previous.routeHistory[previous.routeHistory.length - 1] ??
        previous.route;
      return {...previous, route, routeHistory};
    });
  }, []);

  const resetSession = useCallback(() => {
    setState(createInitialAppState());
  }, []);

  const acceptConsent = useCallback(() => {
    setState(previous => ({...previous, consentAccepted: true}));
  }, []);

  const saveOnboarding = useCallback((answers: OnboardingAnswers) => {
    setState(previous => ({...previous, onboarding: answers}));
  }, []);

  const saveTriage = useCallback(
    (answers: TriageAnswer[], result: TriageResult) => {
      setState(previous => ({
        ...previous,
        triageAnswers: answers,
        triageResult: result,
      }));
    },
    [],
  );

  const saveDeviceCalibration = useCallback(
    (profile: DeviceProfile, phoneGeometry: PhoneGeometry) => {
      setState(previous => ({
        ...previous,
        deviceProfile: profile,
        phoneGeometry,
      }));
    },
    [],
  );

  const saveTemplateDocument = useCallback((document: TemplateDocument) => {
    setState(previous => ({...previous, templateDocument: document}));
  }, []);

  const saveAcuitySession = useCallback((session: AcuitySession) => {
    setState(previous => ({...previous, acuitySession: session}));
  }, []);

  const saveAcuityResult = useCallback((result: AcuityResult) => {
    setState(previous => ({...previous, acuityResult: result}));
  }, []);

  const saveRefractionSession = useCallback((session: RefractionSession) => {
    setState(previous => ({...previous, refractionSession: session}));
  }, []);

  const saveRefractionResult = useCallback((result: RefractionResult) => {
    setState(previous => ({...previous, refractionResult: result}));
  }, []);

  const saveResults = useCallback(
    (reliability: ReliabilityResult, report: ScreeningReport) => {
      setState(previous => ({...previous, reliability, report}));
    },
    [],
  );

  const actions = useMemo<HphVisionAppActions>(
    () => ({
      navigate,
      back,
      resetSession,
      acceptConsent,
      saveOnboarding,
      saveTriage,
      saveDeviceCalibration,
      saveTemplateDocument,
      saveAcuitySession,
      saveAcuityResult,
      saveRefractionSession,
      saveRefractionResult,
      saveResults,
    }),
    [
      acceptConsent,
      back,
      navigate,
      resetSession,
      saveAcuityResult,
      saveAcuitySession,
      saveDeviceCalibration,
      saveOnboarding,
      saveRefractionResult,
      saveRefractionSession,
      saveResults,
      saveTemplateDocument,
      saveTriage,
    ],
  );

  const value = useMemo(() => ({state, actions}), [actions, state]);

  return (
    <HphVisionAppContext.Provider value={value}>
      {children}
    </HphVisionAppContext.Provider>
  );
};

export const useHphVisionApp = (): HphVisionAppContextValue => {
  const context = useContext(HphVisionAppContext);
  if (!context) {
    throw new Error('useHphVisionApp must be used within HphVisionAppProvider');
  }

  return context;
};
