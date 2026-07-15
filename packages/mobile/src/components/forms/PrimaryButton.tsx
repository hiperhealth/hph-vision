import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {colors, radii, spacing, typography} from '../../theme';

type PrimaryButtonVariant = 'primary' | 'secondary' | 'danger';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: PrimaryButtonVariant;
  style?: StyleProp<ViewStyle>;
};

const backgroundColorByVariant: Record<PrimaryButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.surface,
  danger: colors.danger,
};

const textColorByVariant: Record<PrimaryButtonVariant, string> = {
  primary: colors.textInverted,
  secondary: colors.primaryDark,
  danger: colors.textInverted,
};

export const PrimaryButton = ({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: PrimaryButtonProps) => {
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {
          backgroundColor: backgroundColorByVariant[variant],
          borderColor: isSecondary
            ? colors.border
            : backgroundColorByVariant[variant],
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
        },
        style,
      ]}>
      <Text style={[styles.label, {color: textColorByVariant[variant]}]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '800',
  },
});
