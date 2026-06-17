import {describe, expect, it} from '@jest/globals';

import {mapTranscriptToCommand} from '..';

describe('mapTranscriptToCommand', () => {
  it('maps constrained command synonyms', () => {
    expect(
      mapTranscriptToCommand({transcript: 'Option one', locale: 'en-US'}),
    ).toBe('one');
    expect(
      mapTranscriptToCommand({transcript: "I don't know", locale: 'en-US'}),
    ).toBe('unknown');
  });
});
