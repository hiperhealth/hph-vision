import {describe, expect, it} from '@jest/globals';
import {normalizeRefractionAnswer} from '../normalization';

describe('normalizeRefractionAnswer', () => {
  it('normalizes exact canonical tokens', () => {
    expect(normalizeRefractionAnswer('better')).toBe('better');
    expect(normalizeRefractionAnswer('worse')).toBe('worse');
    expect(normalizeRefractionAnswer('same')).toBe('same');
    expect(normalizeRefractionAnswer('one')).toBe('one');
    expect(normalizeRefractionAnswer('two')).toBe('two');
    expect(normalizeRefractionAnswer('unknown')).toBe('unknown');
  });

  it('normalizes synonyms for better / worse / same', () => {
    expect(normalizeRefractionAnswer('clearer')).toBe('better');
    expect(normalizeRefractionAnswer('improved')).toBe('better');
    expect(normalizeRefractionAnswer('sharper')).toBe('better');
    expect(normalizeRefractionAnswer('blurrier')).toBe('worse');
    expect(normalizeRefractionAnswer('harder')).toBe('worse');
    expect(normalizeRefractionAnswer('equal')).toBe('same');
    expect(normalizeRefractionAnswer('no difference')).toBe('same');
    expect(normalizeRefractionAnswer('no change')).toBe('same');
  });

  it('normalizes synonyms for choices one and two', () => {
    expect(normalizeRefractionAnswer('1')).toBe('one');
    expect(normalizeRefractionAnswer('option 1')).toBe('one');
    expect(normalizeRefractionAnswer('option one')).toBe('one');
    expect(normalizeRefractionAnswer('first')).toBe('one');

    expect(normalizeRefractionAnswer('2')).toBe('two');
    expect(normalizeRefractionAnswer('option 2')).toBe('two');
    expect(normalizeRefractionAnswer('option two')).toBe('two');
    expect(normalizeRefractionAnswer('second')).toBe('two');
  });

  it('normalizes unknown and uncertain inputs', () => {
    expect(normalizeRefractionAnswer("i don't know")).toBe('unknown');
    expect(normalizeRefractionAnswer("don't know")).toBe('unknown');
    expect(normalizeRefractionAnswer('idk')).toBe('unknown');
    expect(normalizeRefractionAnswer('not sure')).toBe('unknown');
    expect(normalizeRefractionAnswer('skip')).toBe('unknown');
    expect(normalizeRefractionAnswer('pass')).toBe('unknown');
  });

  it('handles casing, leading/trailing whitespace, and punctuation', () => {
    expect(normalizeRefractionAnswer(' BETTER! ')).toBe('better');
    expect(normalizeRefractionAnswer('  Option 1. ')).toBe('one');
    expect(normalizeRefractionAnswer("I don't know...")).toBe('unknown');
  });

  it('handles compound voice phrases', () => {
    expect(normalizeRefractionAnswer('I think option one is better')).toBe(
      'better',
    );
    expect(normalizeRefractionAnswer('it looks blurrier')).toBe('worse');
    expect(normalizeRefractionAnswer('there is no diff')).toBe('same');
  });

  it('defaults invalid or empty inputs to unknown', () => {
    expect(normalizeRefractionAnswer('')).toBe('unknown');
    expect(normalizeRefractionAnswer('gibberish xyz')).toBe('unknown');
  });
});
