import type {RefractionAnswerToken} from './types';

const SYNONYM_MAP: Record<string, RefractionAnswerToken> = {
  // Better
  better: 'better',
  clearer: 'better',
  improved: 'better',
  sharper: 'better',
  good: 'better',

  // Worse
  worse: 'worse',
  blurrier: 'worse',
  harder: 'worse',

  // Same
  same: 'same',
  equal: 'same',
  'no difference': 'same',
  'no change': 'same',
  neither: 'same',
  both: 'same',

  // One
  one: 'one',
  '1': 'one',
  'option 1': 'one',
  'option one': 'one',
  first: 'one',
  'first option': 'one',
  a: 'one',
  'option a': 'one',

  // Two
  two: 'two',
  '2': 'two',
  'option 2': 'two',
  'option two': 'two',
  second: 'two',
  'second option': 'two',
  b: 'two',
  'option b': 'two',

  // Unknown
  unknown: 'unknown',
  "i don't know": 'unknown',
  "don't know": 'unknown',
  'dont know': 'unknown',
  idk: 'unknown',
  'not sure': 'unknown',
  skip: 'unknown',
  skipped: 'unknown',
  pass: 'unknown',
  uncertain: 'unknown',
};

/**
 * Normalizes a raw user input string (from voice recognition, touch, or text)
 * into a canonical RefractionAnswerToken.
 */
export const normalizeRefractionAnswer = (
  rawInput: string,
): RefractionAnswerToken => {
  if (!rawInput || typeof rawInput !== 'string') {
    return 'unknown';
  }

  const cleaned = rawInput
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');

  if (SYNONYM_MAP[cleaned]) {
    return SYNONYM_MAP[cleaned];
  }

  // Substring or keyword search for compound voice strings (e.g. "I think option one is better")
  if (cleaned.includes('better') || cleaned.includes('clearer')) {
    return 'better';
  }
  if (cleaned.includes('worse') || cleaned.includes('blurrier')) {
    return 'worse';
  }
  if (
    cleaned.includes('same') ||
    cleaned.includes('equal') ||
    cleaned.includes('no diff')
  ) {
    return 'same';
  }
  if (
    cleaned.includes('option one') ||
    cleaned.includes('option 1') ||
    cleaned.includes('first option')
  ) {
    return 'one';
  }
  if (
    cleaned.includes('option two') ||
    cleaned.includes('option 2') ||
    cleaned.includes('second option')
  ) {
    return 'two';
  }
  if (
    cleaned.includes('dont know') ||
    cleaned.includes('not sure') ||
    cleaned.includes('idk') ||
    cleaned.includes('skip')
  ) {
    return 'unknown';
  }

  return 'unknown';
};
