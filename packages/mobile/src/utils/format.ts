export const formatMillimeters = (value: number): string =>
  `${value.toFixed(1)} mm`;

export const formatPercent = (value: number): string =>
  `${Math.round(value * 100)}%`;

export const formatDiopter = (value?: number): string => {
  if (typeof value !== 'number') {
    return 'n/a';
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(2)} D`;
};
