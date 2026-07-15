import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  SCREENING_DISCLAIMER,
  mobileLibraryName,
} from '@hiperhealth/hphvision-lib';
import {runStartupChecks} from '../../app/startup';
import {InfoCard} from '../../components/feedback/InfoCard';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, spacing, typography} from '../../theme';

export const DisclaimerScreen = () => {
  const {actions} = useHphVisionApp();
  const startup = runStartupChecks();

  const continueToOnboarding = () => {
    actions.acceptConsent();
    actions.navigate('onboarding');
  };

  return (
    <Screen
      route="disclaimer"
      subtitle="HPH Vision is an internal prototype for guided smartphone-based vision screening.">
      <InfoCard
        title="Important safety note"
        body={SCREENING_DISCLAIMER}
        tone="warning"
      />
      <InfoCard
        title="What this build validates"
        body="This initial app shell validates the monorepo React Native app, shared hphvision-lib imports, and the first internal screening flow before native PDF, camera, sensor, and voice modules are selected."
      />
      <View style={styles.checkList}>
        {startup.checks.map(check => (
          <View key={check.id} style={styles.checkItem}>
            <Text style={styles.checkLabel}>{check.label}</Text>
            <Text style={styles.checkStatus}>{check.status.toUpperCase()}</Text>
            <Text style={styles.checkDetail}>{check.detail}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.libraryText}>
        Using {mobileLibraryName} for reusable domain logic.
      </Text>
      <PrimaryButton
        label="I understand — start onboarding"
        onPress={continueToOnboarding}
      />
      <PrimaryButton
        label="Open settings"
        variant="secondary"
        onPress={() => actions.navigate('settings')}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  checkList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
  },
  checkLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  checkStatus: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  checkDetail: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  libraryText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginBottom: spacing.md,
  },
});
