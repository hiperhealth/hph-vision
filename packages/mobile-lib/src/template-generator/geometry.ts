import type {PhoneGeometry} from '../device-profile';
import {
  validationIssue,
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
  let outOfBounds = false;
  for (const element of page.elements) {
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

    if (maxY > page.heightMm || minY < 0 || maxX > page.widthMm || minX < 0) {
      outOfBounds = true;
      break;
    }
  }

  if (outOfBounds) {
    return invalid(
      [
        validationIssue(
          'out_of_bounds',
          'Phone dimensions require a larger page size.',
          'pageSize',
        ),
      ],
      combined.warnings,
    );
  }

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
