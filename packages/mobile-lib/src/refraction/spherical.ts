import {roundToStep} from '../validation';

export const normalizeSphere = (sphere: number): number =>
  roundToStep(sphere, 0.25);

export const calculateSphericalEquivalent = (
  sphere: number,
  cylinder: number,
): number => roundToStep(sphere + cylinder / 2, 0.25);
