import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {InfoCard} from '../../components/feedback/InfoCard';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {createReportPreviewFile} from '../../integrations/filesystem/reportFiles';
import {shareGeneratedFile} from '../../integrations/sharing/share';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';
import {formatPercent} from '../../utils/format';

export const ReportScreen = () => {
  const {state, actions} = useHphVisionApp();
  const [shareMessage, setShareMessage] = useState<string | undefined>();
  const report = state.report;

  const previewShare = async () => {
    if (!report) {
      return;
    }

    const file = await createReportPreviewFile(report);
    const result = await shareGeneratedFile(file);
    setShareMessage(result.message);
  };

  if (!report) {
    return (
      <Screen
        route="reporting"
        subtitle="Build the report model from the result summary first.">
        <InfoCard
          title="No report available"
          body="Return to results and build the report model before testing export behavior."
          tone="warning"
        />
        <PrimaryButton
          label="Go to results"
          onPress={() => actions.navigate('results')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      route="reporting"
      subtitle="Show report content and stub native PDF/share handoff for the initial build.">
      <InfoCard
        title="Clinical limitation"
        body={report.disclaimer}
        tone="warning"
      />
      <View style={styles.reportCard}>
        <Text style={styles.reportTitle}>{report.id}</Text>
        <Text style={styles.reportLine}>Session: {report.sessionId}</Text>
        <Text style={styles.reportLine}>Created: {report.createdAt}</Text>
        <Text style={styles.reportLine}>
          Recommendation: {report.recommendation}
        </Text>
        <Text style={styles.reportLine}>
          Reliability: {report.reliability.level} (
          {formatPercent(report.reliability.score)})
        </Text>
        <Text style={styles.reportLine}>
          Warnings: {report.warnings.length}
        </Text>
        <Text style={styles.reportLine}>
          Device: {report.deviceProfile?.modelName ?? 'not recorded'}
        </Text>
        <Text style={styles.reportLine}>
          Template:{' '}
          {report.templateMetadata?.templateVersion ?? 'not generated'}
        </Text>
      </View>
      {report.warnings.map(warning => (
        <InfoCard
          key={warning.code}
          title={warning.code}
          body={warning.message}
          tone="warning"
        />
      ))}
      {shareMessage ? (
        <InfoCard title="Share stub" body={shareMessage} tone="success" />
      ) : null}
      <PrimaryButton label="Preview report share stub" onPress={previewShare} />
      <PrimaryButton
        label="Clinician-review handoff"
        variant="secondary"
        onPress={() => actions.navigate('clinicianReview')}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  reportCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  reportLine: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  reportTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
});
