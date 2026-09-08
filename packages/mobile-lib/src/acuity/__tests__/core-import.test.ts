import {describe, expect, it} from '@jest/globals';
import * as core from '@hiperhealth/hphvision-core';

describe('@hiperhealth/hphvision-core workspace import', () => {
  it('can be imported from another workspace package', () => {
    expect(core).toBeDefined();
  });
});
