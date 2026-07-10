import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {InfoCard} from '../../components/feedback/InfoCard';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {getAudioReadiness} from '../../integrations/audio';
import {getCameraReadiness} from '../../integrations/camera';
import {getSensorReadiness} from '../../integrations/sensors';
import {getSpeechRecognitionReadiness} from '../../integrations/speech-recognition';
import {getTextToSpeechReadiness} from '../../integrations/text-to-speech';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';

type ReadinessItem = {
  label: string;
  available: boolean;
  message: string;
};

const audioReadiness = getAudioReadiness();
const cameraReadiness = getCameraReadiness();
const sensorReadiness = getSensorReadiness();
const speechReadiness = getSpeechRecognitionReadiness();
const ttsReadiness = getTextToSpeechReadiness();

const readinessItems: ReadinessItem[] = [
  {
    label: 'Audio prompts',
    available: audioReadiness.canPlayPrompts,
    message: audioReadiness.message,
  },
  {
    label: 'Camera calibration',
    available: cameraReadiness.available,
    message: cameraReadiness.message,
  },
  {
    label: 'Sensors',
    available: sensorReadiness.available,
    message: sensorReadiness.message,
  },
  {
    label: 'Speech recognition',
    available: speechReadiness.available,
    message: speechReadiness.message,
  },
  {
    label: 'Text-to-speech',
    available: ttsReadiness.available,
    message: ttsReadiness.message,
  },
];

export const SettingsScreen = () => {
  const {state, actions} = useHphVisionApp();
  const returnRoute = state.consentAccepted
    ? state.routeHistory[state.routeHistory.length - 1] ?? 'onboarding'
    : 'disclaimer';

  return (
    <Screen
      route="settings"
      subtitle="Expose app-shell settings and native integration readiness.">
      <InfoCard
        title="Initial build"
        body="Native capability choices are intentionally deferred. The app shell can launch and run the minimal flow without requesting permissions."
      />
      <View style={styles.card}>
        <Text style={styles.title}>Session</Text>
        <Text style={styles.line}>ID: {state.sessionId}</Text>
        <Text style={styles.line}>
          Consent accepted: {state.consentAccepted ? 'yes' : 'no'}
        </Text>
        <Text style={styles.line}>Current route: {state.route}</Text>
      </View>
      {readinessItems.map(item => (
        <View key={item.label} style={styles.card}>
          <Text style={styles.title}>{item.label}</Text>
          <Text style={styles.line}>
            Available: {item.available ? 'yes' : 'no'}
          </Text>
          <Text style={styles.line}>{item.message}</Text>
        </View>
      ))}
      <PrimaryButton
        label={
          state.consentAccepted
            ? 'Return to current flow'
            : 'Return to disclaimer'
        }
        onPress={() => actions.navigate(returnRoute)}
      />
      <PrimaryButton
        label="Reset session"
        variant="danger"
        onPress={actions.resetSession}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  line: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  title: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
});
