import {toPhoneGeometry} from '../device-profile';
import type {TemplateInput} from '../template-generator';
import {
  fixtureMediumPhone,
  fixtureSmallPhone,
  fixtureLargePhone,
} from './devices';

export const fixtureTemplateInput: TemplateInput = {
  phone: toPhoneGeometry(fixtureMediumPhone),
  options: {
    pageSize: 'A4',
    cardboardThicknessMm: 1.5,
    eyeToScreenDistanceMm: 250,
    includeAssemblyInstructions: true,
  },
};

export const fixtureSmallTemplateInput: TemplateInput = {
  phone: toPhoneGeometry(fixtureSmallPhone),
  options: {
    pageSize: 'A4',
    cardboardThicknessMm: 1.5,
    eyeToScreenDistanceMm: 250,
    includeAssemblyInstructions: true,
  },
};

export const fixtureLargeTemplateInput: TemplateInput = {
  phone: toPhoneGeometry(fixtureLargePhone),
  options: {
    pageSize: 'A4',
    cardboardThicknessMm: 1.5,
    eyeToScreenDistanceMm: 250,
    includeAssemblyInstructions: true,
  },
};
