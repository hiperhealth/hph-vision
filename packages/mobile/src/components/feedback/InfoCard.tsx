import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, radii, spacing, typography} from '../../theme';

type InfoCardTone = 'default' | 'success' | 'warning' | 'danger';

type InfoCardProps = {
  title?: string;
  body: string;
  tone?: InfoCardTone;
  children?: React.ReactNode;
};

const toneStyles: Record<
  InfoCardTone,
  {backgroundColor: string; borderColor: string}
> = {
  default: {backgroundColor: colors.surface, borderColor: colors.border},
  success: {backgroundColor: colors.successSoft, borderColor: colors.success},
  warning: {backgroundColor: colors.warningSoft, borderColor: colors.warning},
  danger: {backgroundColor: colors.dangerSoft, borderColor: colors.danger},
};

export const InfoCard = ({
  title,
  body,
  tone = 'default',
  children,
}: InfoCardProps) => {
  const palette = toneStyles[tone];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.body}>{body}</Text>
      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  children: {
    marginTop: spacing.md,
  },
});
