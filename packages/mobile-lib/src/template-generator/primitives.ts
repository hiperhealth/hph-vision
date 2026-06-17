import type {
  LinePath,
  Point,
  RectPath,
  TemplateElementRole,
  TextElement,
} from './types';

export const point = (xMm: number, yMm: number): Point => ({xMm, yMm});

export const line = (
  id: string,
  from: Point,
  to: Point,
  role: TemplateElementRole,
): LinePath => ({kind: 'line', id, from, to, role});

export const rect = (
  id: string,
  origin: Point,
  widthMm: number,
  heightMm: number,
  role: TemplateElementRole,
): RectPath => ({kind: 'rect', id, origin, widthMm, heightMm, role});

export const text = (
  id: string,
  origin: Point,
  textKey: string,
  fallbackText: string,
  sizeMm: number,
): TextElement => ({
  kind: 'text',
  id,
  origin,
  textKey,
  fallbackText,
  sizeMm,
  role: 'label',
});
