import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {InfoCard} from '../../components/feedback/InfoCard';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';

const handoffItems = [
  'Attach screening report PDF.',
  'Attach template metadata and phone profile.',
  'Include triage result and warnings.',
  'Send only after explicit user consent.',
  'Use backend API once hph-vision-api endpoints are available.',
];

export const ClinicianReviewScreen = () => {
  const {state, actions} = useHphVisionApp();

  return (
    <Screen
      route="clinicianReview"
      subtitle="Prepare the future clinician-review package without direct backend coupling.">
      <InfoCard
        title="HTTP boundary"
        body="The mobile app should call backend endpoints through src/integrations/api only. It should not import FastAPI or hph-vision-core modules."
      />
      <View style={styles.card}>
        <Text style={styles.title}>Handoff checklist</Text>
        {handoffItems.map(item => (
          <Text key={item} style={styles.line}>
            • {item}
          </Text>
        ))}
      </View>
      <InfoCard
        title="Current report"
        body={
          state.report
            ? `${state.report.id} is ready for export stubs.`
            : 'No report has been built yet.'
        }
        tone={state.report ? 'success' : 'warning'}
      />
      <PrimaryButton
        label="Back to report"
        onPress={() => actions.navigate('reporting')}
      />
      <PrimaryButton
        label="Start a new session"
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
