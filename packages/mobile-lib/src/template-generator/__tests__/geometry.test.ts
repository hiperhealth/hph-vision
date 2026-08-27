import {describe, expect, it} from '@jest/globals';

import {
  fixtureTemplateInput,
  fixtureSmallTemplateInput,
  fixtureLargeTemplateInput,
  fixtureLargeUSLetterTemplateInput,
} from '../../fixtures';
import {generateTemplateDocument} from '..';

describe('generateTemplateDocument', () => {
  const testCases = [
    {name: 'small phone', input: fixtureSmallTemplateInput},
    {name: 'medium phone', input: fixtureTemplateInput},
    {name: 'large phone', input: fixtureLargeTemplateInput},
    {name: 'large phone US Letter', input: fixtureLargeUSLetterTemplateInput},
  ];

  testCases.forEach(({name, input}) => {
    it(`creates a valid template document for ${name}`, () => {
      const result = generateTemplateDocument(input.phone, input.options);

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      const doc = result.value;
      expect(doc.pages[0].pageSize).toBe(input.options.pageSize);
      expect(doc.calibrationMarks[0]).toMatchObject({
        kind: 'square',
        expectedSizeMm: 50,
      });

      const page = doc.pages[0];

      page.elements.forEach(element => {
        let maxY = 0;
        let minY = 0;
        let maxX = 0;
        let minX = 0;

        if (element.kind === 'rect' || element.kind === 'rounded-rect') {
          minY = element.origin.yMm;
          maxY = element.origin.yMm + element.heightMm;
          minX = element.origin.xMm;
          maxX = element.origin.xMm + element.widthMm;
        } else if (element.kind === 'line') {
          minY = Math.min(element.from.yMm, element.to.yMm);
          maxY = Math.max(element.from.yMm, element.to.yMm);
          minX = Math.min(element.from.xMm, element.to.xMm);
          maxX = Math.max(element.from.xMm, element.to.xMm);
        } else if (element.kind === 'text') {
          minY = element.origin.yMm - element.sizeMm;
          maxY = element.origin.yMm + element.sizeMm;
          minX = element.origin.xMm;
          maxX = element.origin.xMm + 150;
        } else if (element.kind === 'general') {
          minY = Math.min(...element.points.map(p => p.yMm));
          maxY = Math.max(...element.points.map(p => p.yMm));
          minX = Math.min(...element.points.map(p => p.xMm));
          maxX = Math.max(...element.points.map(p => p.xMm));
        }

        expect(minY).toBeGreaterThanOrEqual(-5);
        expect(maxY).toBeLessThanOrEqual(page.heightMm + 5);
        expect(minX).toBeGreaterThanOrEqual(-5);
        expect(maxX).toBeLessThanOrEqual(page.widthMm + 5);
      });

      expect(doc).toMatchSnapshot();
    });
  });
});
