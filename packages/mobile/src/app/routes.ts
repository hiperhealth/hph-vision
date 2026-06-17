export type AppRoute =
  | 'disclaimer'
  | 'onboarding'
  | 'triage'
  | 'deviceCalibration'
  | 'templateGeneration'
  | 'visorAssembly'
  | 'acuityTest'
  | 'refractionTest'
  | 'results'
  | 'reporting'
  | 'clinicianReview'
  | 'settings';

export type RouteDescriptor = {
  id: AppRoute;
  title: string;
  stepLabel: string;
};

export const ROUTES: RouteDescriptor[] = [
  {id: 'disclaimer', title: 'Clinical disclaimer', stepLabel: 'Consent'},
  {id: 'onboarding', title: 'Onboarding', stepLabel: 'Basics'},
  {id: 'triage', title: 'Safety triage', stepLabel: 'Safety'},
  {id: 'deviceCalibration', title: 'Device calibration', stepLabel: 'Device'},
  {id: 'templateGeneration', title: 'Template preview', stepLabel: 'Template'},
  {id: 'visorAssembly', title: 'Visor assembly', stepLabel: 'Assembly'},
  {id: 'acuityTest', title: 'Acuity prototype', stepLabel: 'Acuity'},
  {
    id: 'refractionTest',
    title: 'Refraction prototype',
    stepLabel: 'Refraction',
  },
  {id: 'results', title: 'Result summary', stepLabel: 'Results'},
  {id: 'reporting', title: 'Report export', stepLabel: 'Report'},
  {id: 'clinicianReview', title: 'Clinician review', stepLabel: 'Handoff'},
  {id: 'settings', title: 'Settings', stepLabel: 'Settings'},
];

export const getRouteDescriptor = (route: AppRoute): RouteDescriptor => {
  const descriptor = ROUTES.find(item => item.id === route);
  return descriptor ?? ROUTES[0]!;
};
