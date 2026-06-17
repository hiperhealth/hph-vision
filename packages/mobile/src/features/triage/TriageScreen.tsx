import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {
  evaluateTriage,
  getTriageQuestions,
  type TriageAnswer,
} from '@hiperhealth/hphvision-lib';
import {InfoCard} from '../../components/feedback/InfoCard';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';

const questions = getTriageQuestions();

export const TriageScreen = () => {
  const {state, actions} = useHphVisionApp();
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>(
    () => {
      const initial: Record<string, boolean | undefined> = {};
      state.triageAnswers.forEach(answer => {
        initial[answer.questionId] = answer.value;
      });
      return initial;
    },
  );

  const normalizedAnswers = useMemo<TriageAnswer[]>(
    () =>
      questions
        .filter(question => typeof answers[question.id] === 'boolean')
        .map(question => ({
          questionId: question.id,
          value: Boolean(answers[question.id]),
        })),
    [answers],
  );
  const result = useMemo(
    () => evaluateTriage(normalizedAnswers),
    [normalizedAnswers],
  );
  const allAnswered = normalizedAnswers.length === questions.length;

  const selectAnswer = (questionId: string, value: boolean) => {
    setAnswers(previous => ({...previous, [questionId]: value}));
  };

  const markAllNo = () => {
    const nextAnswers: Record<string, boolean> = {};
    questions.forEach(question => {
      nextAnswers[question.id] = false;
    });
    setAnswers(nextAnswers);
  };

  const saveAndContinue = () => {
    actions.saveTriage(normalizedAnswers, result);
    actions.navigate(
      result.canContinueSelfTest ? 'deviceCalibration' : 'results',
    );
  };

  return (
    <Screen
      route="triage"
      subtitle="Positive red-flag answers stop the self-test and recommend professional care.">
      <InfoCard
        title="Safety first"
        body="This branch is intentionally conservative. The app should not continue to vision testing when red flags are present or unanswered."
        tone="warning"
      />
      {questions.map(question => {
        const value = answers[question.id];
        return (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionText}>{question.fallbackPrompt}</Text>
            <View style={styles.answerRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => selectAnswer(question.id, true)}
                style={[
                  styles.answer,
                  value === true ? styles.yesSelected : styles.answerUnselected,
                ]}>
                <Text
                  style={[
                    styles.answerText,
                    value === true
                      ? styles.answerTextSelected
                      : styles.answerTextUnselected,
                  ]}>
                  Yes
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => selectAnswer(question.id, false)}
                style={[
                  styles.answer,
                  value === false ? styles.noSelected : styles.answerUnselected,
                ]}>
                <Text
                  style={[
                    styles.answerText,
                    value === false
                      ? styles.answerTextSelected
                      : styles.answerTextUnselected,
                  ]}>
                  No
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      <InfoCard
        title={
          result.canContinueSelfTest
            ? 'Ready to continue'
            : 'Professional care recommended'
        }
        body={
          result.canContinueSelfTest
            ? 'No blocking triage answers were recorded.'
            : `${result.redFlags.length} red flag(s), ${result.unansweredQuestionIds.length} unanswered question(s). Recommendation: ${result.recommendation}.`
        }
        tone={result.canContinueSelfTest ? 'success' : 'danger'}
      />
      <PrimaryButton
        label="Mark all as no red flags"
        variant="secondary"
        onPress={markAllNo}
      />
      <PrimaryButton
        label={
          result.canContinueSelfTest
            ? 'Continue to device calibration'
            : 'Show result guidance'
        }
        disabled={!allAnswered}
        onPress={saveAndContinue}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  answer: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  answerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  answerText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  answerTextSelected: {
    color: colors.textInverted,
  },
  answerTextUnselected: {
    color: colors.text,
  },
  answerUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  noSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  questionText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  yesSelected: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
});
