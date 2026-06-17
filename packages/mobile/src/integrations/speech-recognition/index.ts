export type SpeechRecognitionReadiness = {
  available: boolean;
  message: string;
};

export const getSpeechRecognitionReadiness =
  (): SpeechRecognitionReadiness => ({
    available: false,
    message:
      'Voice answers will be wired after native speech permissions are selected.',
  });
