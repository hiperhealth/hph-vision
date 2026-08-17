import type {AcuityTrial, OptotypeOrientation, OptotypeStimulus} from './types';

export const getRotationDegrees = (
  orientation: OptotypeOrientation,
): number => {
  switch (orientation) {
    case 'up':
      return 0;
    case 'right':
      return 90;
    case 'down':
      return 180;
    case 'left':
      return 270;
  }
};

export const createOptotypeStimulus = (
  trial: AcuityTrial,
): OptotypeStimulus => {
  return {
    optotype: trial.optotype,
    orientation: trial.orientation,
    sizeLogMar: trial.sizeLogMar,
    rendering: {
      gridSize: 5,
      strokeWidthRatio: 0.2,
      gapSizeRatio: 0.2,
      rotationDegrees: getRotationDegrees(trial.orientation),
    },
  };
};
