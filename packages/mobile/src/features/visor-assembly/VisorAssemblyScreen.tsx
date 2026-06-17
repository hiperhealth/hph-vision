import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {InfoCard} from '../../components/feedback/InfoCard';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';

const checklistItems = [
  'Printed at 100% scale; not fit-to-page.',
  '50 mm calibration square measures exactly 50 mm.',
  'Cut lines are clean and fold lines remain intact.',
  'Phone fits snugly without tilt or pressure on buttons.',
  'Eye window is unobstructed and centered.',
  'Screen is clean and brightness can be adjusted.',
];

export const VisorAssemblyScreen = () => {
  const {state, actions} = useHphVisionApp();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = checklistItems.every(item => checked[item]);
  const instructions = state.templateDocument?.instructions ?? [];

  const toggle = (item: string) => {
    setChecked(previous => ({...previous, [item]: !previous[item]}));
  };

  return (
    <Screen
      route="visorAssembly"
      subtitle="Confirm the printed template and physical assembly before showing optotypes.">
      <InfoCard
        title="MVP manual environment check"
        body="Sensor and camera checks are not active yet. This checklist records the quality gates that will later feed the reliability score."
        tone="warning"
      />
      {instructions.map(instruction => (
        <View key={instruction.id} style={styles.instructionCard}>
          <Text style={styles.step}>Step {instruction.step}</Text>
          <Text style={styles.instruction}>{instruction.fallbackText}</Text>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Fit-check checklist</Text>
      {checklistItems.map(item => (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{checked: Boolean(checked[item])}}
          key={item}
          onPress={() => toggle(item)}
          style={[
            styles.checkItem,
            checked[item] ? styles.checkItemSelected : styles.checkItemPlain,
          ]}>
          <Text
            style={[
              styles.checkText,
              checked[item] ? styles.checkTextSelected : styles.checkTextPlain,
            ]}>
            {checked[item] ? '✓ ' : '○ '}
            {item}
          </Text>
        </Pressable>
      ))}
      <PrimaryButton
        label="Continue to acuity prototype"
        disabled={!allChecked}
        onPress={() => actions.navigate('acuityTest')}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  checkItem: {
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  checkItemPlain: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  checkItemSelected: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  checkText: {
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  checkTextPlain: {
    color: colors.text,
  },
  checkTextSelected: {
    color: colors.success,
  },
  instruction: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  instructionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  step: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
});
