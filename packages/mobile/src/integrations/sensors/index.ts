export type SensorReadiness = {
  available: boolean;
  message: string;
};

export const getSensorReadiness = (): SensorReadiness => ({
  available: false,
  message:
    'Tilt and ambient-light checks are represented as manual checklist items for now.',
});
