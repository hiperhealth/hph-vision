import type {HphVisionAppState} from './sessionStore';

export type PersistedSessionDraft = {
  savedAt: string;
  state: HphVisionAppState;
};

let inMemoryDraft: PersistedSessionDraft | undefined;

export const loadSessionDraft = async (): Promise<
  PersistedSessionDraft | undefined
> => inMemoryDraft;

export const saveSessionDraft = async (
  state: HphVisionAppState,
): Promise<void> => {
  inMemoryDraft = {
    savedAt: new Date().toISOString(),
    state,
  };
};

export const clearSessionDraft = async (): Promise<void> => {
  inMemoryDraft = undefined;
};
