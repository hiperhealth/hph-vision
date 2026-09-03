import {describe, expect, it} from '@jest/globals';

import {fixtureTemplateInput} from '../../fixtures';
import {
  validatePageFit,
  validatePhoneGeometry,
  validateSlotTolerance,
  validateGlueTabSize,
  validateAssemblyInstructions,
  validateTemplateOptions,
  validateMinimumMargins,
  validateLineIntersections,
} from '..';

describe('validateTemplateOptions', () => {
  it('returns error when pageSize is invalid', () => {
    const result = validateTemplateOptions({
      ...fixtureTemplateInput.options,
      pageSize: 'A3' as any,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('invalid_page_size');
  });

  it('returns error when eyeToScreenDistanceMm is too small', () => {
    const result = validateTemplateOptions({
      ...fixtureTemplateInput.options,
      eyeToScreenDistanceMm: 10,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('out_of_range');
  });

  it('returns error when eyeToScreenDistanceMm is too large', () => {
    const result = validateTemplateOptions({
      ...fixtureTemplateInput.options,
      eyeToScreenDistanceMm: 700,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('out_of_range');
  });

  it('returns error when cardboardThicknessMm is out of range', () => {
    const result = validateTemplateOptions({
      ...fixtureTemplateInput.options,
      cardboardThicknessMm: 0.1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('out_of_range');
  });

  it('passes with valid options', () => {
    const result = validateTemplateOptions(fixtureTemplateInput.options);
    expect(result.ok).toBe(true);
  });
});

describe('validatePhoneGeometry', () => {
  it('returns error when modelName is empty', () => {
    const result = validatePhoneGeometry({
      ...fixtureTemplateInput.phone,
      modelName: '   ',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('missing_model_name');
  });

  it('passes with valid phone geometry', () => {
    const result = validatePhoneGeometry(fixtureTemplateInput.phone);
    expect(result.ok).toBe(true);
  });
});

describe('validatePageFit', () => {
  it('returns error when phone is too wide for A4', () => {
    const result = validatePageFit(
      {...fixtureTemplateInput.phone, bodyWidthMm: 190},
      fixtureTemplateInput.options,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('phone_too_large_for_page');
    expect(result.errors[0].field).toBe('bodyWidthMm');
  });

  it('returns error when phone is too tall for A4', () => {
    const result = validatePageFit(
      {...fixtureTemplateInput.phone, bodyHeightMm: 280},
      fixtureTemplateInput.options,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('phone_too_large_for_page');
    expect(result.errors[0].field).toBe('bodyHeightMm');
  });

  it('passes when phone fits within A4', () => {
    const result = validatePageFit(
      fixtureTemplateInput.phone,
      fixtureTemplateInput.options,
    );
    expect(result.ok).toBe(true);
  });
});

describe('validateSlotTolerance', () => {
  it('returns error when clearance is below minimum', () => {
    const result = validateSlotTolerance(0.5);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('slot_tolerance_too_small');
  });

  it('passes when clearance meets minimum', () => {
    const result = validateSlotTolerance(2);
    expect(result.ok).toBe(true);
  });
});

describe('validateGlueTabSize', () => {
  it('returns error when glue tab is too small', () => {
    const result = validateGlueTabSize(3, 10);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('glue_tab_too_small');
  });

  it('passes with valid glue tab size', () => {
    const result = validateGlueTabSize(8, 52);
    expect(result.ok).toBe(true);
  });
});

describe('validateAssemblyInstructions', () => {
  it('returns error when instructions are required but empty', () => {
    const result = validateAssemblyInstructions([], true);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('required_assembly_instruction_missing');
  });

  it('passes when instructions not required and empty', () => {
    const result = validateAssemblyInstructions([], false);
    expect(result.ok).toBe(true);
  });

  it('passes when instructions are required and present', () => {
    const result = validateAssemblyInstructions(
      [{id: 'step-1', step: 1, textKey: 'key', fallbackText: 'text'}],
      true,
    );
    expect(result.ok).toBe(true);
  });
});

describe('validateMinimumMargins', () => {
  it('returns error when a rect element is too close to the left edge', () => {
    const page = {
      id: 'page-1',
      pageSize: 'A4' as const,
      widthMm: 210,
      heightMm: 297,
      elements: [
        {
          kind: 'rect' as const,
          id: 'test-rect',
          role: 'cut' as const,
          origin: {xMm: 5, yMm: 20},
          widthMm: 50,
          heightMm: 50,
        },
      ],
    };
    const result = validateMinimumMargins(page);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('margin_violation');
  });

  it('passes when all elements are within margins', () => {
    const page = {
      id: 'page-1',
      pageSize: 'A4' as const,
      widthMm: 210,
      heightMm: 297,
      elements: [
        {
          kind: 'rect' as const,
          id: 'test-rect',
          role: 'cut' as const,
          origin: {xMm: 15, yMm: 15},
          widthMm: 50,
          heightMm: 50,
        },
      ],
    };
    const result = validateMinimumMargins(page);
    expect(result.ok).toBe(true);
  });
});

describe('validateLineIntersections', () => {
  it('returns error when a fold line passes through the phone slot', () => {
    const page = {
      id: 'page-1',
      pageSize: 'A4' as const,
      widthMm: 210,
      heightMm: 297,
      elements: [
        {
          kind: 'rect' as const,
          id: 'phone-holder-slot',
          role: 'slot' as const,
          origin: {xMm: 50, yMm: 50},
          widthMm: 80,
          heightMm: 120,
        },
        {
          kind: 'line' as const,
          id: 'bad-fold',
          role: 'fold' as const,
          from: {xMm: 60, yMm: 60},
          to: {xMm: 100, yMm: 60},
        },
      ],
    };
    const result = validateLineIntersections(page);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('line_intersection');
  });

  it('passes when no fold/cut lines intersect critical areas', () => {
    const page = {
      id: 'page-1',
      pageSize: 'A4' as const,
      widthMm: 210,
      heightMm: 297,
      elements: [
        {
          kind: 'rect' as const,
          id: 'phone-holder-slot',
          role: 'slot' as const,
          origin: {xMm: 50, yMm: 50},
          widthMm: 80,
          heightMm: 120,
        },
        {
          kind: 'line' as const,
          id: 'safe-fold',
          role: 'fold' as const,
          from: {xMm: 10, yMm: 200},
          to: {xMm: 200, yMm: 200},
        },
      ],
    };
    const result = validateLineIntersections(page);
    expect(result.ok).toBe(true);
  });
});
