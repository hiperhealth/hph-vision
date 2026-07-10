export type CameraReadiness = {
  available: boolean;
  message: string;
};

export const getCameraReadiness = (): CameraReadiness => ({
  available: false,
  message:
    'Camera calibration is planned after the manual device flow is validated.',
});
