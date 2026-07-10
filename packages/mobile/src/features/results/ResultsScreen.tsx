import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  calculateReliability,
  createEmptyTestSession,
  createScreeningReport,
  HPHVISION_LIB_VERSION,
} from '@hiperhealth/hphvision-lib';
import {InfoCard} from '../../components/feedback/InfoCard';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';
import {formatDiopter, formatPercent} from '../../utils/format';

const APP_VERSION = '0.0.1';

export const ResultsScreen = () => {
  const {state, actions} = useHphVisionApp();
  const hasBlockingTriage = (state.triageResult?.redFlags.length ?? 0) > 0;

  const buildReport = () => {
    const onboarding = state.onboarding;
    const completedAcuity = state.acuityResult ? 1 : 0;
    const completedRefraction = state.refractionResult ? 1 : 0;
    const completionRate = hasBlockingTriage
      ? 0
      : (completedAcuity + completedRefraction) / 2;
    const reliability = calculateReliability({
      completionRate,
      distanceConfidence: state.templateDocument ? 0.75 : 0.35,
      tiltConfidence: 0.65,
      ambientLightScore: 0.7,
      voiceConfidence: onboarding?.voiceEnabled ? 0.55 : 1,
      contradictionScore: 0.1,
    });
    const session = createEmptyTestSession(state.sessionId, state.createdAt);
    session.appVersion = APP_VERSION;
    session.libraryVersion = HPHVISION_LIB_VERSION;
    session.environment = {
      distanceConfidence: state.templateDocument ? 0.75 : 0.35,
      tiltConfidence: 0.65,
    };
    session.patientContext = {};
    if (onboarding) {
      if (onboarding.ageRange) {
        session.patientContext.ageRange = onboarding.ageRange;
      }
      if (typeof onboarding.currentGlasses === 'boolean') {
        session.patientContext.currentGlasses = onboarding.currentGlasses;
      }
      if (typeof onboarding.hasPreviousPrescription === 'boolean') {
        session.patientContext.previousPrescription =
          onboarding.hasPreviousPrescription;
      }
    }
    if (state.deviceProfile) {
      session.deviceProfile = state.deviceProfile;
    }
    if (state.templateDocument) {
      session.templateMetadata = state.templateDocument.metadata;
    }
    if (state.triageResult) {
      session.triageResult = state.triageResult;
    }
    session.acuityResults = state.acuityResult ? [state.acuityResult] : [];
    if (state.refractionResult) {
      session.refractionResult = state.refractionResult;
    }
    session.reliability = reliability;
    session.reliabilityScore = reliability.score;
    session.warnings = reliability.warnings;
    const report = createScreeningReport(session, {
      id: `report-${state.sessionId}`,
      createdAt: new Date().toISOString(),
    });
    actions.saveResults(reliability, report);
  };

  const rightEye = state.refractionResult?.rightEye;

  return (
    <Screen
      route="results"
      subtitle="Summarize the prototype session and build a reusable report model.">
      {hasBlockingTriage ? (
        <InfoCard
          title="Testing stopped by safety triage"
          body={`Recommendation: ${
            state.triageResult?.recommendation ?? 'seekProfessionalCare'
          }. The self-test should not continue when red flags are present.`}
          tone="danger"
        />
      ) : null}
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Acuity</Text>
        <Text style={styles.resultLine}>
          Estimate: {state.acuityResult?.snellenEquivalent ?? 'not captured'}
        </Text>
        <Text style={styles.resultLine}>
          Confidence: {formatPercent(state.acuityResult?.confidence ?? 0)}
        </Text>
      </View>
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Refraction</Text>
        <Text style={styles.resultLine}>
          Sphere: {formatDiopter(rightEye?.sphere)}
        </Text>
        <Text style={styles.resultLine}>
          Cylinder: {formatDiopter(rightEye?.cylinder)}
        </Text>
        <Text style={styles.resultLine}>Axis: {rightEye?.axis ?? 'n/a'}</Text>
        <Text style={styles.resultLine}>
          Confidence: {formatPercent(state.refractionResult?.confidence ?? 0)}
        </Text>
      </View>
      {state.reliability ? (
        <InfoCard
          title={`Reliability: ${state.reliability.level}`}
          body={`Score ${formatPercent(state.reliability.score)} with ${
            state.reliability.warnings.length
          } warning(s).`}
          tone={state.reliability.level === 'invalid' ? 'danger' : 'success'}
        />
      ) : (
        <InfoCard
          title="Report not built yet"
          body="Build the report to calculate reliability and recommendation from shared library primitives."
          tone="warning"
        />
      )}
      <PrimaryButton label="Build report model" onPress={buildReport} />
      <PrimaryButton
        label="Open report screen"
        disabled={!state.report}
        onPress={() => actions.navigate('reporting')}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  resultCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  resultLine: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  resultTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
});
