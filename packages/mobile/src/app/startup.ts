export type StartupCheck = {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'blocked';
  detail: string;
};

export type StartupStatus = {
  canLaunchOffline: boolean;
  canResumeDraft: boolean;
  checks: StartupCheck[];
};

export const runStartupChecks = (): StartupStatus => ({
  canLaunchOffline: true,
  canResumeDraft: false,
  checks: [
    {
      id: 'offline-mode',
      label: 'Offline launch',
      status: 'pass',
      detail:
        'The initial app shell does not require network access to start a screening draft.',
    },
    {
      id: 'draft-persistence',
      label: 'Draft persistence',
      status: 'warning',
      detail:
        'Persistence is scaffolded and will use device storage after the storage dependency is added.',
    },
    {
      id: 'native-capabilities',
      label: 'Native capabilities',
      status: 'warning',
      detail:
        'Camera, sensor, audio, and speech integrations are represented by stubs in this build.',
    },
  ],
});
