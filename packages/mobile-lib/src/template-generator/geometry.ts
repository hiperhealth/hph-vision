import type {PhoneGeometry} from '../device-profile';
import {
  combineValidationResults,
  invalid,
  valid,
  type ValidationResult,
} from '../validation';
import {createTemplatePage} from './layout';
import type {
  AssemblyInstruction,
  TemplateDocument,
  TemplateOptions,
} from './types';
import {validatePhoneGeometry, validateTemplateOptions} from './validation';

export const TEMPLATE_VERSION = 'template-v0.1';

const createInstructions = (
  includeAssemblyInstructions: boolean,
): AssemblyInstruction[] => {
  if (!includeAssemblyInstructions) {
    return [];
  }

  return [
    {
      id: 'print-scale',
      step: 1,
      textKey: 'template.instructions.printScale',
      fallbackText: 'Print at 100% scale. Do not fit to page.',
    },
    {
      id: 'measure-square',
      step: 2,
      textKey: 'template.instructions.measureSquare',
      fallbackText:
        'Measure the calibration square and confirm it is exactly 50 mm.',
    },
    {
      id: 'cut-lines',
      step: 3,
      textKey: 'template.instructions.cutLines',
      fallbackText: 'Cut only on solid cut lines and keep fold lines intact.',
    },
    {
      id: 'fold-tabs',
      step: 4,
      textKey: 'template.instructions.foldTabs',
      fallbackText: 'Fold tabs along fold lines and glue/tape where marked.',
    },
    {
      id: 'fit-phone',
      step: 5,
      textKey: 'template.instructions.fitPhone',
      fallbackText:
        'Insert the phone and confirm it fits snugly without tilting.',
    },
  ];
};

export const generateTemplateDocument = (
  phone: PhoneGeometry,
  options: TemplateOptions,
): ValidationResult<TemplateDocument> => {
  const phoneValidation = validatePhoneGeometry(phone);
  const optionValidation = validateTemplateOptions(options);
  const combined = combineValidationResults(phoneValidation, optionValidation);

  if (!combined.ok) {
    return invalid(combined.errors, combined.warnings);
  }

  const page = createTemplatePage(phone, options);
  const calibrationElement = page.elements.find(
    element => element.id === 'scale-check-square-50mm',
  );

  return valid(
    {
      pages: [page],
      calibrationMarks: calibrationElement
        ? [
            {
              id: 'scale-check-square-50mm',
              kind: 'square',
              expectedSizeMm: 50,
              pageId: page.id,
              elementId: calibrationElement.id,
            },
          ]
        : [],
      instructions: createInstructions(options.includeAssemblyInstructions),
      metadata: {
        templateVersion: TEMPLATE_VERSION,
        generatedForModel: phone.modelName,
        pageSize: options.pageSize,
        phoneBodyWidthMm: phone.bodyWidthMm,
        phoneBodyHeightMm: phone.bodyHeightMm,
        phoneThicknessMm: phone.thicknessMm,
        cardboardThicknessMm: options.cardboardThicknessMm,
        eyeToScreenDistanceMm: options.eyeToScreenDistanceMm,
      },
    },
    combined.warnings,
  );
};
