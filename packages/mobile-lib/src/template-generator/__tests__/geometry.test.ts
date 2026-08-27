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

  it('returns error when phone is too large for A4 page', () => {
    const result = generateTemplateDocument(
      {...fixtureTemplateInput.phone, bodyWidthMm: 190},
      fixtureTemplateInput.options,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some(e => e.code === 'phone_too_large_for_page')).toBe(
      true,
    );
  });

  it('always includes a calibration mark in valid output', () => {
    const result = generateTemplateDocument(
      fixtureTemplateInput.phone,
      fixtureTemplateInput.options,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.calibrationMarks).toHaveLength(1);
    expect(result.value.calibrationMarks[0].kind).toBe('square');
    expect(result.value.calibrationMarks[0].expectedSizeMm).toBe(50);
  });

  it('always has at least one cut element in valid output', () => {
    const result = generateTemplateDocument(
      fixtureTemplateInput.phone,
      fixtureTemplateInput.options,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const elements = result.value.pages[0].elements;
    expect(elements.some(e => e.role === 'cut')).toBe(true);
  });

  it('always has at least one fold element in valid output', () => {
    const result = generateTemplateDocument(
      fixtureTemplateInput.phone,
      fixtureTemplateInput.options,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const elements = result.value.pages[0].elements;
    expect(elements.some(e => e.role === 'fold')).toBe(true);
  });

  it('returns instructions when includeAssemblyInstructions is true', () => {
    const result = generateTemplateDocument(fixtureTemplateInput.phone, {
      ...fixtureTemplateInput.options,
      includeAssemblyInstructions: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.instructions.length).toBeGreaterThan(0);
  });

  it('returns empty instructions when includeAssemblyInstructions is false', () => {
    const result = generateTemplateDocument(fixtureTemplateInput.phone, {
      ...fixtureTemplateInput.options,
      includeAssemblyInstructions: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.instructions).toHaveLength(0);
  });
});
