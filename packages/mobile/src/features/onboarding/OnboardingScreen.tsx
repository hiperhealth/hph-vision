import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {InfoCard} from '../../components/feedback/InfoCard';
import {FieldLabel} from '../../components/forms/FieldLabel';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {
  type OnboardingAnswers,
  useHphVisionApp,
} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';

const ageRanges = ['Under 18', '18–39', '40–64', '65+'];
const yesNoOptions = [
  {label: 'Yes', value: true},
  {label: 'No', value: false},
];

type ToggleRowProps = {
  label: string;
  value?: boolean;
  onChange: (value: boolean) => void;
};

const ToggleRow = ({label, value, onChange}: ToggleRowProps) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <View style={styles.choiceRow}>
      {yesNoOptions.map(option => (
        <Pressable
          accessibilityRole="button"
          key={option.label}
          onPress={() => onChange(option.value)}
          style={[
            styles.choice,
            value === option.value
              ? styles.choiceSelected
              : styles.choiceUnselected,
          ]}>
          <Text
            style={[
              styles.choiceText,
              value === option.value
                ? styles.choiceTextSelected
                : styles.choiceTextUnselected,
            ]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);

export const OnboardingScreen = () => {
  const {state, actions} = useHphVisionApp();
  const existing = state.onboarding;
  const [ageRange, setAgeRange] = useState(existing?.ageRange ?? '18–39');
  const [currentGlasses, setCurrentGlasses] = useState<boolean | undefined>(
    existing?.currentGlasses,
  );
  const [contactLensUse, setContactLensUse] = useState<boolean | undefined>(
    existing?.contactLensUse,
  );
  const [hasPreviousPrescription, setHasPreviousPrescription] = useState<
    boolean | undefined
  >(existing?.hasPreviousPrescription);
  const [testingReason, setTestingReason] = useState(
    existing?.testingReason ?? '',
  );
  const [preferredLanguage, setPreferredLanguage] = useState(
    existing?.preferredLanguage ?? 'en-US',
  );
  const [voiceEnabled, setVoiceEnabled] = useState(
    existing?.voiceEnabled ?? false,
  );
  const [wantsClinicianReview, setWantsClinicianReview] = useState(
    existing?.wantsClinicianReview ?? true,
  );

  const canContinue = useMemo(
    () => ageRange.trim().length > 0 && preferredLanguage.trim().length > 0,
    [ageRange, preferredLanguage],
  );

  const saveAndContinue = () => {
    const answers: OnboardingAnswers = {
      ageRange,
      currentGlasses,
      contactLensUse,
      hasPreviousPrescription,
      testingReason: testingReason.trim() || undefined,
      preferredLanguage,
      voiceEnabled,
      wantsClinicianReview,
    };
    actions.saveOnboarding(answers);
    actions.navigate('triage');
  };

  return (
    <Screen
      route="onboarding"
      subtitle="Collect only the minimum context needed to run an internal prototype session.">
      <InfoCard
        title="Plain-language setup"
        body="The MVP keeps onboarding short. Clinical intake, localization, and previous prescription import can be expanded later without changing the shared library APIs."
      />
      <FieldLabel>Age range</FieldLabel>
      <View style={styles.choiceWrap}>
        {ageRanges.map(option => (
          <Pressable
            accessibilityRole="button"
            key={option}
            onPress={() => setAgeRange(option)}
            style={[
              styles.choice,
              ageRange === option
                ? styles.choiceSelected
                : styles.choiceUnselected,
            ]}>
            <Text
              style={[
                styles.choiceText,
                ageRange === option
                  ? styles.choiceTextSelected
                  : styles.choiceTextUnselected,
              ]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
      <ToggleRow
        label="Do you currently wear glasses?"
        value={currentGlasses}
        onChange={setCurrentGlasses}
      />
      <ToggleRow
        label="Do you currently wear contact lenses?"
        value={contactLensUse}
        onChange={setContactLensUse}
      />
      <ToggleRow
        label="Do you have a previous prescription?"
        value={hasPreviousPrescription}
        onChange={setHasPreviousPrescription}
      />
      <ToggleRow
        label="Enable voice interaction later in the flow?"
        value={voiceEnabled}
        onChange={setVoiceEnabled}
      />
      <ToggleRow
        label="Would you like clinician-review handoff?"
        value={wantsClinicianReview}
        onChange={setWantsClinicianReview}
      />
      <FieldLabel>Preferred language tag</FieldLabel>
      <TextInput
        accessibilityLabel="Preferred language"
        autoCapitalize="none"
        onChangeText={setPreferredLanguage}
        placeholder="en-US"
        style={styles.input}
        value={preferredLanguage}
      />
      <FieldLabel>Reason for testing</FieldLabel>
      <TextInput
        accessibilityLabel="Reason for testing"
        multiline
        onChangeText={setTestingReason}
        placeholder="Example: checking if I need updated glasses"
        style={[styles.input, styles.multiline]}
        value={testingReason}
      />
      <PrimaryButton
        label="Continue to safety triage"
        disabled={!canContinue}
        onPress={saveAndContinue}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  choice: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  choiceText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  choiceTextSelected: {
    color: colors.textInverted,
  },
  choiceTextUnselected: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  toggleLabel: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
    paddingRight: spacing.md,
  },
  toggleRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
});
