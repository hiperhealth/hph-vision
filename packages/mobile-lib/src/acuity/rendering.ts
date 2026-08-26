import type {
  AcuityTrial,
  OptotypeKind,
  OptotypeOrientation,
  OptotypeStimulus,
} from './types';

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

const SNELLEN_GEOMETRY = {
  gridSize: 5,
  strokeWidthRatio: 0.2,
  gapSizeRatio: 0.2,
} as const;

const getGeometryForOptotype = (optotype: OptotypeKind) => {
  switch (optotype) {
    case 'tumblingE':
    case 'landoltC':
      return SNELLEN_GEOMETRY;
  }
};

export const createOptotypeStimulus = (
  trial: AcuityTrial,
): OptotypeStimulus => {
  const geometry = getGeometryForOptotype(trial.optotype);
  return {
    optotype: trial.optotype,
    orientation: trial.orientation,
    sizeLogMar: trial.sizeLogMar,
    rendering: {
      ...geometry,
      rotationDegrees: getRotationDegrees(trial.orientation),
    },
  };
};
