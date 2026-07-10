import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {
  createAcuitySession,
  nextAcuityTrial,
  recordAcuityResponse,
  scoreAcuitySession,
  type OptotypeOrientation,
} from '@hiperhealth/hphvision-lib';
import {InfoCard} from '../../components/feedback/InfoCard';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';
import {formatPercent} from '../../utils/format';

const answerOptions: Array<OptotypeOrientation | 'unknown'> = [
  'up',
  'right',
  'down',
  'left',
  'unknown',
];

const rotationByOrientation: Record<OptotypeOrientation, string> = {
  up: '0deg',
  right: '90deg',
  down: '180deg',
  left: '270deg',
};

export const AcuityTestScreen = () => {
  const {state, actions} = useHphVisionApp();
  const session = state.acuitySession;
  const currentTrial = useMemo(
    () => (session ? nextAcuityTrial(session) : undefined),
    [session],
  );
  const answeredCount = session?.responses.length ?? 0;
  const totalCount = session?.trials.length ?? 0;

  const startSession = () => {
    actions.saveAcuitySession(
      createAcuitySession({
        id: `${state.sessionId}-acuity-right`,
        eye: 'right',
        practiceTrials: 2,
        randomSeed: state.sessionId,
        sizeLogMarSequence: [0.8, 0.6, 0.4, 0.2, 0, -0.1],
      }),
    );
  };

  const recordAnswer = (answer: OptotypeOrientation | 'unknown') => {
    if (!session || !currentTrial) {
      return;
    }

    const nextSession = recordAcuityResponse(session, {
      trialId: currentTrial.id,
      answer,
      inputMethod: 'touch',
      createdAt: new Date().toISOString(),
    });
    actions.saveAcuitySession(nextSession);
  };

  const scoreAndContinue = () => {
    if (!session) {
      return;
    }

    actions.saveAcuityResult(scoreAcuitySession(session));
    actions.navigate('refractionTest');
  };

  if (!session) {
    return (
      <Screen
        route="acuityTest"
        subtitle="Run a short Tumbling E prototype using hphvision-lib state-machine logic.">
        <InfoCard
          title="Right-eye acuity prototype"
          body="This internal build starts with a single right-eye sequence. Left-eye and binocular routing can be added after the route shell is stable."
        />
        <PrimaryButton label="Start acuity prototype" onPress={startSession} />
      </Screen>
    );
  }

  if (!currentTrial) {
    return (
      <Screen
        route="acuityTest"
        subtitle="All acuity trials have touch responses.">
        <InfoCard
          title="Acuity sequence complete"
          body={`${answeredCount} of ${totalCount} trials captured. Score the shared-library session to continue.`}
          tone="success"
        />
        {state.acuityResult ? (
          <InfoCard
            title="Acuity result"
            body={`Estimate: ${
              state.acuityResult.snellenEquivalent ?? 'n/a'
            }, confidence ${formatPercent(state.acuityResult.confidence)}.`}
          />
        ) : null}
        <PrimaryButton
          label="Score acuity and continue"
          onPress={scoreAndContinue}
        />
      </Screen>
    );
  }

  return (
    <Screen
      route="acuityTest"
      subtitle="Ask which direction the E points. Responses are recorded through hphvision-lib.">
      <InfoCard
        title={currentTrial.isPractice ? 'Practice trial' : 'Test trial'}
        body={`Trial ${
          answeredCount + 1
        } of ${totalCount}. Size logMAR ${currentTrial.sizeLogMar.toFixed(1)}.`}
      />
      <View style={styles.optotypeStage}>
        <Text
          accessibilityLabel={`Tumbling E pointing ${currentTrial.orientation}`}
          style={[
            styles.optotype,
            {
              transform: [
                {rotate: rotationByOrientation[currentTrial.orientation]},
              ],
            },
          ]}>
          E
        </Text>
      </View>
      <View style={styles.answerGrid}>
        {answerOptions.map(option => (
          <Pressable
            accessibilityRole="button"
            key={option}
            onPress={() => recordAnswer(option)}
            style={styles.answerButton}>
            <Text style={styles.answerText}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.progressText}>
        Captured {answeredCount} / {totalCount} responses
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  answerButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  answerText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  optotype: {
    color: colors.text,
    fontSize: 132,
    fontWeight: '900',
    letterSpacing: 8,
  },
  optotypeStage: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    minHeight: 220,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
});
