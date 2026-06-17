import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {
  generateTemplateDocument,
  type PageSize,
  type TemplateOptions,
} from '@hiperhealth/hphvision-lib';
import {InfoCard} from '../../components/feedback/InfoCard';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {createTemplatePreviewFile} from '../../integrations/filesystem/reportFiles';
import {shareGeneratedFile} from '../../integrations/sharing/share';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';
import {formatMillimeters} from '../../utils/format';

const pageSizes: PageSize[] = ['LETTER', 'A4'];

export const TemplateGenerationScreen = () => {
  const {state, actions} = useHphVisionApp();
  const [pageSize, setPageSize] = useState<PageSize>('LETTER');
  const [shareMessage, setShareMessage] = useState<string | undefined>();
  const phone = state.phoneGeometry;
  const options = useMemo<TemplateOptions>(
    () => ({
      pageSize,
      cardboardThicknessMm: 1.5,
      eyeToScreenDistanceMm: 220,
      includeAssemblyInstructions: true,
    }),
    [pageSize],
  );
  const templateResult = useMemo(
    () => (phone ? generateTemplateDocument(phone, options) : undefined),
    [options, phone],
  );
  const templateDocument = templateResult?.ok
    ? templateResult.value
    : undefined;
  const templateErrorBody =
    templateResult && !templateResult.ok
      ? templateResult.errors.map(error => error.message).join(' ')
      : '';

  const saveAndContinue = () => {
    if (!templateDocument) {
      return;
    }

    actions.saveTemplateDocument(templateDocument);
    actions.navigate('visorAssembly');
  };

  const previewShare = async () => {
    if (!templateDocument) {
      return;
    }

    const file = await createTemplatePreviewFile(templateDocument);
    const result = await shareGeneratedFile(file);
    setShareMessage(result.message);
  };

  if (!phone) {
    return (
      <Screen
        route="templateGeneration"
        subtitle="Device geometry is required first.">
        <InfoCard
          title="Missing device calibration"
          body="Return to device calibration and save a valid phone geometry before generating the template."
          tone="warning"
        />
        <PrimaryButton
          label="Go to device calibration"
          onPress={() => actions.navigate('deviceCalibration')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      route="templateGeneration"
      subtitle="Generate the cardboard visor/support template from shared library geometry.">
      <InfoCard
        title="Template generation scope"
        body="The library generates geometry and assembly instructions. The app will own native PDF rendering, print, save, and sharing in a later implementation step."
      />
      <View style={styles.choiceWrap}>
        {pageSizes.map(size => (
          <Pressable
            accessibilityRole="button"
            key={size}
            onPress={() => setPageSize(size)}
            style={[
              styles.choice,
              pageSize === size ? styles.choiceSelected : styles.choicePlain,
            ]}>
            <Text
              style={[
                styles.choiceText,
                pageSize === size
                  ? styles.choiceTextSelected
                  : styles.choiceTextPlain,
              ]}>
              {size}
            </Text>
          </Pressable>
        ))}
      </View>
      {templateDocument ? (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Template preview</Text>
          <Text style={styles.previewLine}>
            Model: {templateDocument.metadata.generatedForModel}
          </Text>
          <Text style={styles.previewLine}>
            Pages: {templateDocument.pages.length}
          </Text>
          <Text style={styles.previewLine}>
            Phone body:{' '}
            {formatMillimeters(templateDocument.metadata.phoneBodyWidthMm)} ×{' '}
            {formatMillimeters(templateDocument.metadata.phoneBodyHeightMm)}
          </Text>
          <Text style={styles.previewLine}>
            Eye-to-screen distance:{' '}
            {formatMillimeters(templateDocument.metadata.eyeToScreenDistanceMm)}
          </Text>
          <Text style={styles.previewLine}>
            Calibration marks: {templateDocument.calibrationMarks.length}
          </Text>
          <Text style={styles.previewLine}>
            Assembly steps: {templateDocument.instructions.length}
          </Text>
        </View>
      ) : (
        <InfoCard
          title="Template cannot be generated"
          body={templateErrorBody}
          tone="danger"
        />
      )}
      {templateDocument ? (
        <View style={styles.elementCard}>
          <Text style={styles.previewTitle}>Page elements</Text>
          {templateDocument.pages[0]?.elements.slice(0, 6).map(element => (
            <Text key={element.id} style={styles.previewLine}>
              {element.role}: {element.id}
            </Text>
          ))}
        </View>
      ) : null}
      {shareMessage ? (
        <InfoCard title="Share stub" body={shareMessage} tone="success" />
      ) : null}
      <PrimaryButton
        label="Preview native share stub"
        disabled={!templateDocument}
        variant="secondary"
        onPress={previewShare}
      />
      <PrimaryButton
        label="Continue to assembly checklist"
        disabled={!templateDocument}
        onPress={saveAndContinue}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  choice: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choicePlain: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  choiceSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  choiceTextPlain: {
    color: colors.text,
  },
  choiceTextSelected: {
    color: colors.textInverted,
  },
  choiceWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  elementCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  previewLine: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  previewTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
});
