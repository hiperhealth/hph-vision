import type {PhoneGeometry} from '../device-profile';

export type PageSize = 'A4' | 'LETTER';

export type TemplateOptions = {
  pageSize: PageSize;
  cardboardThicknessMm: number;
  eyeToScreenDistanceMm: number;
  includeAssemblyInstructions: boolean;
};

export type Point = {xMm: number; yMm: number};

export type TemplateElementRole =
  | 'cut'
  | 'fold'
  | 'guide'
  | 'calibration'
  | 'label'
  | 'slot'
  | 'glue';

export type LinePath = {
  kind: 'line';
  id: string;
  from: Point;
  to: Point;
  role: TemplateElementRole;
};

export type RectPath = {
  kind: 'rect';
  id: string;
  origin: Point;
  widthMm: number;
  heightMm: number;
  role: TemplateElementRole;
};

export type TextElement = {
  kind: 'text';
  id: string;
  origin: Point;
  textKey: string;
  fallbackText: string;
  sizeMm: number;
  role: TemplateElementRole;
};

export type RoundedRectPath = {
  kind: 'rounded-rect';
  id: string;
  origin: Point;
  widthMm: number;
  heightMm: number;
  cornerRadiusMm: number;
  role: TemplateElementRole;
};

export type GeneralPath = {
  kind: 'general';
  id: string;
  points: Point[];
  role: TemplateElementRole;
};

export type TemplateElement =
  | LinePath
  | RectPath
  | TextElement
  | RoundedRectPath
  | GeneralPath;

export type TemplatePage = {
  id: string;
  pageSize: PageSize;
  widthMm: number;
  heightMm: number;
  elements: TemplateElement[];
};

export type CalibrationMark = {
  id: string;
  kind: 'square' | 'ruler';
  expectedSizeMm: number;
  pageId: string;
  elementId: string;
};

export type AssemblyInstruction = {
  id: string;
  step: number;
  textKey: string;
  fallbackText: string;
};

export type TemplateMetadata = {
  templateVersion: string;
  generatedForModel: string;
  pageSize: PageSize;
  phoneBodyWidthMm: number;
  phoneBodyHeightMm: number;
  phoneThicknessMm: number;
  cardboardThicknessMm: number;
  eyeToScreenDistanceMm: number;
};

export type TemplateDocument = {
  pages: TemplatePage[];
  calibrationMarks: CalibrationMark[];
  instructions: AssemblyInstruction[];
  metadata: TemplateMetadata;
};

export type TemplateInput = {
  phone: PhoneGeometry;
  options: TemplateOptions;
};
