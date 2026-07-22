export const CYLINDER_STEP = 0.25;
export const AXIS_WRAP_DEGREES = 180;

export const DEFAULT_AXIS_RANGE: [number, number] = [1, 180];
export const DEFAULT_CYLINDER_RANGE: [number, number] = [-4.0, 0.0];

export const NARROW_AXIS_TOLERANCE_DIAL = 15;
export const NARROW_AXIS_TOLERANCE_JCC = 5;
export const JCC_AXIS_SHIFT = 45;
export const CONTRADICTION_THRESHOLD_AXIS = 20;

export type AstigmatismPattern =
  | 'clockDial'
  | 'fanChart'
  | 'lineOrientation'
  | 'jcc';

/**
 * Introduced because existing RefractionResponse cannot encode explicit
 * axis degrees chosen by the user during the primitive tests.
 */
export type AstigmatismAnswer = {
  pattern: AstigmatismPattern;
  selectedAxis?: number;
  jccPreference?: 'A' | 'B' | 'equal';
  jccAxisA?: number;
  jccAxisB?: number;
};

export const normalizeCylinder = (cylinder: number): number =>
  Math.min(0, Math.round(cylinder / CYLINDER_STEP) * CYLINDER_STEP);

export const normalizeAxis = (axis: number): number => {
  const normalized = Math.round(axis) % AXIS_WRAP_DEGREES;
  return normalized <= 0 ? normalized + AXIS_WRAP_DEGREES : normalized;
};

export const normalizeAnswer = (
  answer: AstigmatismAnswer,
): AstigmatismAnswer => ({
  ...answer,
  selectedAxis:
    answer.selectedAxis !== undefined
      ? normalizeAxis(answer.selectedAxis)
      : undefined,
  jccAxisA:
    answer.jccAxisA !== undefined ? normalizeAxis(answer.jccAxisA) : undefined,
  jccAxisB:
    answer.jccAxisB !== undefined ? normalizeAxis(answer.jccAxisB) : undefined,
});

export const generateClockDialPrompt = (): number[] => [
  30, 60, 90, 120, 150, 180,
];

export const generateFanChartPrompt = (): number[] =>
  Array.from({length: 18}, (_, i) => (i + 1) * 10);

export const generateLineOrientationPrompt = (
  currentAxisRange: [number, number],
): number[] => {
  const mid = Math.round((currentAxisRange[0] + currentAxisRange[1]) / 2);
  return [normalizeAxis(mid - 10), normalizeAxis(mid), normalizeAxis(mid + 10)];
};

export const generateJccPrompt = (
  currentAxisRange: [number, number],
): [number, number] => {
  const mid = Math.round((currentAxisRange[0] + currentAxisRange[1]) / 2);
  return [
    normalizeAxis(mid - JCC_AXIS_SHIFT),
    normalizeAxis(mid + JCC_AXIS_SHIFT),
  ];
};

export const isContradictoryAnswer = (
  answer: AstigmatismAnswer,
  currentAxisRange: [number, number],
): boolean => {
  const [min, max] = currentAxisRange;

  if (answer.selectedAxis !== undefined) {
    if (answer.selectedAxis < min || answer.selectedAxis > max) {
      const distMin = Math.abs(answer.selectedAxis - min);
      const distMax = Math.abs(answer.selectedAxis - max);
      if (
        distMin > CONTRADICTION_THRESHOLD_AXIS &&
        distMax > CONTRADICTION_THRESHOLD_AXIS
      ) {
        return true;
      }
    }
  }

  if (answer.jccPreference === 'A' && answer.jccAxisA !== undefined) {
    if (
      answer.jccAxisA < min - CONTRADICTION_THRESHOLD_AXIS ||
      answer.jccAxisA > max + CONTRADICTION_THRESHOLD_AXIS
    )
      return true;
  }

  if (answer.jccPreference === 'B' && answer.jccAxisB !== undefined) {
    if (
      answer.jccAxisB < min - CONTRADICTION_THRESHOLD_AXIS ||
      answer.jccAxisB > max + CONTRADICTION_THRESHOLD_AXIS
    )
      return true;
  }

  return false;
};

export const calculateAstigmatismConfidence = (
  currentConfidence: number,
  isContradictory: boolean,
): number => {
  if (isContradictory) {
    return Number(Math.max(0.1, currentConfidence - 0.3).toFixed(2));
  }
  return Number(Math.min(1.0, currentConfidence + 0.1).toFixed(2));
};

export const estimateAxisRange = (
  answer: AstigmatismAnswer,
  currentRange: [number, number],
): [number, number] => {
  let targetAxis: number | undefined;
  let tolerance = 0;

  if (
    answer.pattern === 'clockDial' ||
    answer.pattern === 'fanChart' ||
    answer.pattern === 'lineOrientation'
  ) {
    targetAxis = answer.selectedAxis;
    tolerance = NARROW_AXIS_TOLERANCE_DIAL;
  } else if (answer.pattern === 'jcc') {
    if (answer.jccPreference === 'A') targetAxis = answer.jccAxisA;
    if (answer.jccPreference === 'B') targetAxis = answer.jccAxisB;
    tolerance = NARROW_AXIS_TOLERANCE_JCC;
  }

  if (targetAxis === undefined) {
    return currentRange;
  }

  const newMin = Math.max(1, targetAxis - tolerance);
  const newMax = Math.min(180, targetAxis + tolerance);

  const nextMin = Math.max(currentRange[0], newMin);
  const nextMax = Math.min(currentRange[1], newMax);

  return nextMin <= nextMax ? [nextMin, nextMax] : [newMin, newMax];
};

export const estimateCylinderRange = (
  answer: AstigmatismAnswer,
  currentRange: [number, number],
): [number, number] => {
  if (
    answer.pattern === 'clockDial' ||
    answer.pattern === 'fanChart' ||
    answer.pattern === 'lineOrientation'
  ) {
    if (answer.selectedAxis !== undefined) {
      const cylMin = normalizeCylinder(Math.max(currentRange[0], -2.0));
      return cylMin <= currentRange[1]
        ? [cylMin, currentRange[1]]
        : [cylMin, cylMin];
    }
  } else if (answer.pattern === 'jcc') {
    if (answer.jccPreference === 'A' || answer.jccPreference === 'B') {
      const cylMax = normalizeCylinder(Math.min(currentRange[1], -0.25));
      return currentRange[0] <= cylMax
        ? [currentRange[0], cylMax]
        : [cylMax, cylMax];
    } else if (answer.jccPreference === 'equal') {
      const mid = normalizeCylinder((currentRange[0] + currentRange[1]) / 2);
      return currentRange[0] <= mid ? [currentRange[0], mid] : [mid, mid];
    }
  }
  return currentRange;
};

export const buildReliabilityWarnings = (
  confidence: number,
  answerCount: number,
): string[] => {
  const warnings: string[] = [];
  if (confidence < 0.5) {
    warnings.push('Low confidence due to contradictory answers.');
  }
  if (answerCount < 2) {
    warnings.push('Insufficient data for reliable estimation.');
  }
  return warnings;
};
