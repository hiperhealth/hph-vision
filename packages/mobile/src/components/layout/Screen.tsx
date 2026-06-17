import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {getRouteDescriptor, type AppRoute} from '../../app/routes';
import {useHphVisionApp} from '../../state/sessionStore';
import {colors, radii, spacing, typography} from '../../theme';
import {PrimaryButton} from '../forms/PrimaryButton';

type ScreenProps = {
  route: AppRoute;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBack?: boolean;
};

export const Screen = ({
  route,
  title,
  subtitle,
  children,
  footer,
  showBack = true,
}: ScreenProps) => {
  const {state, actions} = useHphVisionApp();
  const descriptor = getRouteDescriptor(route);
  const canGoBack = showBack && state.routeHistory.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>{descriptor.stepLabel}</Text>
          </View>
          <Text style={styles.title}>{title ?? descriptor.title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        <View style={styles.footer}>
          {canGoBack ? (
            <PrimaryButton
              label="Back"
              variant="secondary"
              onPress={actions.back}
            />
          ) : null}
          {footer}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stepText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  content: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  footer: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
});
