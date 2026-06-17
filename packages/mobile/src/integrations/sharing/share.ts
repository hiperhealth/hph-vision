import type {GeneratedFile} from '../filesystem/reportFiles';

export type ShareResult = {
  completed: boolean;
  message: string;
};

export const shareGeneratedFile = async (
  file: GeneratedFile,
): Promise<ShareResult> => ({
  completed: true,
  message: `${file.fileName} is ready for the native sharing implementation.`,
});
