import type {
  ScreeningReport,
  TemplateDocument,
} from '@hiperhealth/hphvision-lib';

export type GeneratedFile = {
  fileName: string;
  mimeType: string;
  uri: string;
};

export const createTemplatePreviewFile = async (
  document: TemplateDocument,
): Promise<GeneratedFile> => ({
  fileName: `hphvision-template-${document.metadata.generatedForModel}.pdf`,
  mimeType: 'application/pdf',
  uri: 'memory://hphvision/template-preview.pdf',
});

export const createReportPreviewFile = async (
  report: ScreeningReport,
): Promise<GeneratedFile> => ({
  fileName: `${report.id}.pdf`,
  mimeType: 'application/pdf',
  uri: 'memory://hphvision/report-preview.pdf',
});
