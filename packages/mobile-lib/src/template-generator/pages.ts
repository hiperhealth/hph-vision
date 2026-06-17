import type {PageSize} from './types';

export const PAGE_DIMENSIONS_MM: Record<
  PageSize,
  {widthMm: number; heightMm: number}
> = {
  A4: {widthMm: 210, heightMm: 297},
  LETTER: {widthMm: 215.9, heightMm: 279.4},
};

export const getPageDimensions = (
  pageSize: PageSize,
): {widthMm: number; heightMm: number} => PAGE_DIMENSIONS_MM[pageSize];
