export const MM_PER_INCH = 25.4;
export const PDF_POINTS_PER_INCH = 72;

export const mmToInches = (millimeters: number): number =>
  millimeters / MM_PER_INCH;

export const inchesToMm = (inches: number): number => inches * MM_PER_INCH;

export const mmToPdfPoints = (millimeters: number): number =>
  mmToInches(millimeters) * PDF_POINTS_PER_INCH;
