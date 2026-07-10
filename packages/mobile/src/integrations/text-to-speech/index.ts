export type TextToSpeechReadiness = {
  available: boolean;
  message: string;
};

export const getTextToSpeechReadiness = (): TextToSpeechReadiness => ({
  available: false,
  message:
    'Text-to-speech prompts are planned for the accessibility milestone.',
});
