import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {
  getDeviceProfiles,
  toPhoneGeometry,
  validateDeviceProfile,
  type DeviceProfile,
} from '@hiperhealth/hphvision-lib';
import {getDeviceDetectionInput} from '../../integrations/device-info/getDeviceDetectionInput';
import {InfoCard} from '../../components/feedback/InfoCard';
import {FieldLabel} from '../../components/forms/FieldLabel';
import {PrimaryButton} from '../../components/forms/PrimaryButton';
import {Screen} from '../../components/layout/Screen';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';
import {formatMillimeters} from '../../utils/format';

const deviceProfiles = getDeviceProfiles();
const defaultProfile: DeviceProfile = deviceProfiles[1] ??
  deviceProfiles[0] ?? {
    id: 'manual-fallback-phone',
    manufacturer: 'Manual',
    modelName: 'Manual phone',
    bodyWidthMm: 72,
    bodyHeightMm: 153,
    thicknessMm: 8.5,
    screenWidthPx: 1170,
    screenHeightPx: 2532,
    pixelDensity: 3,
    screenWidthMm: 68,
    screenHeightMm: 145,
    templateFamily: 'generic-slab',
  };

const parseDimension = (value: string): number =>
  Number.parseFloat(value.replace(',', '.'));

export const DeviceCalibrationScreen = () => {
  const {state, actions} = useHphVisionApp();
  const initialProfile = state.deviceProfile ?? defaultProfile;
  const [modelName, setModelName] = useState(initialProfile.modelName);
  const [bodyWidthMm, setBodyWidthMm] = useState(
    String(initialProfile.bodyWidthMm),
  );
  const [bodyHeightMm, setBodyHeightMm] = useState(
    String(initialProfile.bodyHeightMm),
  );
  const [thicknessMm, setThicknessMm] = useState(
    String(initialProfile.thicknessMm),
  );
  const detectionInput = useMemo(() => getDeviceDetectionInput(), []);

  const profile = useMemo<DeviceProfile>(
    () => ({
      ...initialProfile,
      id: 'manual-mobile-profile',
      manufacturer: initialProfile.manufacturer || 'Manual',
      modelName: modelName.trim() || 'Manual phone',
      bodyWidthMm: parseDimension(bodyWidthMm),
      bodyHeightMm: parseDimension(bodyHeightMm),
      thicknessMm: parseDimension(thicknessMm),
    }),
    [bodyHeightMm, bodyWidthMm, initialProfile, modelName, thicknessMm],
  );
  const validation = useMemo(() => validateDeviceProfile(profile), [profile]);
  const phoneGeometry = useMemo(() => toPhoneGeometry(profile), [profile]);

  const saveAndContinue = () => {
    if (!validation.ok) {
      return;
    }

    actions.saveDeviceCalibration(validation.value, phoneGeometry);
    actions.navigate('templateGeneration');
  };

  return (
    <Screen
      route="deviceCalibration"
      subtitle="Use a known generic profile or manually enter the phone body dimensions in millimeters.">
      <InfoCard
        title="Detected screen signal"
        body={`OS: ${detectionInput.os ?? 'unknown'}, screen: ${
          detectionInput.screenWidthPx ?? 'n/a'
        } × ${detectionInput.screenHeightPx ?? 'n/a'} px, density: ${
          detectionInput.pixelDensity ?? 'n/a'
        }. Model matching will be added after device-info integration is selected.`}
      />
      <FieldLabel>Phone model label</FieldLabel>
      <TextInput
        accessibilityLabel="Phone model label"
        onChangeText={setModelName}
        placeholder="Medium phone"
        style={styles.input}
        value={modelName}
      />
      <FieldLabel>Body width</FieldLabel>
      <TextInput
        accessibilityLabel="Body width in millimeters"
        keyboardType="decimal-pad"
        onChangeText={setBodyWidthMm}
        placeholder="72"
        style={styles.input}
        value={bodyWidthMm}
      />
      <FieldLabel>Body height</FieldLabel>
      <TextInput
        accessibilityLabel="Body height in millimeters"
        keyboardType="decimal-pad"
        onChangeText={setBodyHeightMm}
        placeholder="153"
        style={styles.input}
        value={bodyHeightMm}
      />
      <FieldLabel>Thickness</FieldLabel>
      <TextInput
        accessibilityLabel="Phone thickness in millimeters"
        keyboardType="decimal-pad"
        onChangeText={setThicknessMm}
        placeholder="8.5"
        style={styles.input}
        value={thicknessMm}
      />
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Geometry preview</Text>
        <Text style={styles.previewLine}>
          Width: {formatMillimeters(profile.bodyWidthMm)}
        </Text>
        <Text style={styles.previewLine}>
          Height: {formatMillimeters(profile.bodyHeightMm)}
        </Text>
        <Text style={styles.previewLine}>
          Thickness: {formatMillimeters(profile.thicknessMm)}
        </Text>
      </View>
      {!validation.ok ? (
        <InfoCard
          title="Check dimensions"
          body={validation.errors.map(error => error.message).join(' ')}
          tone="danger"
        />
      ) : (
        <InfoCard
          title="Dimensions accepted"
          body="The shared library accepted this manual device profile for template generation."
          tone="success"
        />
      )}
      <PrimaryButton
        label="Generate template preview"
        disabled={!validation.ok}
        onPress={saveAndContinue}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
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
