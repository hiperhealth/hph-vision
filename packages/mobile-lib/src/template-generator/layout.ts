import type {PhoneGeometry} from '../device-profile';
import type {TemplateOptions, TemplatePage} from './types';
import {getPageDimensions} from './pages';
import {line, point, rect, text} from './primitives';

export const createTemplatePage = (
  phone: PhoneGeometry,
  options: TemplateOptions,
): TemplatePage => {
  const {widthMm, heightMm} = getPageDimensions(options.pageSize);
  const marginMm = 10;
  const clearanceMm = 2;
  const slotWidthMm = phone.bodyWidthMm + clearanceMm;
  const slotHeightMm = phone.bodyHeightMm + clearanceMm;
  const centerX = widthMm / 2;
  const slotOriginX = centerX - slotWidthMm / 2;
  const slotOriginY = 42;
  const visorWidthMm = Math.min(
    widthMm - marginMm * 2,
    Math.max(slotWidthMm + 48, 130),
  );
  const visorHeightMm = Math.min(heightMm - marginMm * 2, slotHeightMm + 92);
  const visorOriginX = centerX - visorWidthMm / 2;
  const visorOriginY = 28;
  const eyeWindowWidthMm = Math.min(42, visorWidthMm - 60);
  const eyeWindowHeightMm = 26;
  const eyeWindowOriginY = slotOriginY + slotHeightMm + 24;

  return {
    id: 'page-1',
    pageSize: options.pageSize,
    widthMm,
    heightMm,
    elements: [
      text(
        'title',
        point(marginMm, 14),
        'template.title',
        `hphvision cardboard template for ${phone.modelName}`,
        4,
      ),
      rect(
        'visor-outer-cut',
        point(visorOriginX, visorOriginY),
        visorWidthMm,
        visorHeightMm,
        'cut',
      ),
      rect(
        'phone-fit-outline',
        point(slotOriginX, slotOriginY),
        slotWidthMm,
        slotHeightMm,
        'guide',
      ),
      rect(
        'phone-holder-slot',
        point(slotOriginX + 4, slotOriginY + 4),
        slotWidthMm - 8,
        slotHeightMm - 8,
        'slot',
      ),
      rect(
        'eye-window-cut',
        point(centerX - eyeWindowWidthMm / 2, eyeWindowOriginY),
        eyeWindowWidthMm,
        eyeWindowHeightMm,
        'cut',
      ),
      rect(
        'nose-cutout-guide',
        point(centerX - 13, eyeWindowOriginY + eyeWindowHeightMm + 5),
        26,
        15,
        'guide',
      ),
      rect(
        'occlusion-flap-cut',
        point(centerX + eyeWindowWidthMm / 2 + 8, eyeWindowOriginY),
        30,
        eyeWindowHeightMm,
        'cut',
      ),
      rect(
        'left-glue-tab',
        point(visorOriginX - 8, visorOriginY + 18),
        8,
        52,
        'glue',
      ),
      rect(
        'right-glue-tab',
        point(visorOriginX + visorWidthMm, visorOriginY + 18),
        8,
        52,
        'glue',
      ),
      line(
        'top-fold-line',
        point(visorOriginX, visorOriginY + 18),
        point(visorOriginX + visorWidthMm, visorOriginY + 18),
        'fold',
      ),
      line(
        'bottom-fold-line',
        point(visorOriginX, visorOriginY + visorHeightMm - 18),
        point(visorOriginX + visorWidthMm, visorOriginY + visorHeightMm - 18),
        'fold',
      ),
      line(
        'center-alignment-line',
        point(centerX, visorOriginY),
        point(centerX, visorOriginY + visorHeightMm),
        'guide',
      ),
      rect(
        'scale-check-square-50mm',
        point(marginMm, heightMm - 68),
        50,
        50,
        'calibration',
      ),
      line(
        'calibration-ruler',
        point(marginMm + 65, heightMm - 18),
        point(marginMm + 115, heightMm - 18),
        'calibration',
      ),
      text(
        'scale-check-label',
        point(marginMm, heightMm - 72),
        'template.scaleCheck',
        'Measure this square: it must be exactly 50 mm.',
        3,
      ),
    ],
  };
};
