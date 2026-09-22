import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors, Typography, Radius, Spacing } from '@theme/index';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'green' | 'gold' | 'gray';
interface BadgeProps {
  label:    string;
  variant?: BadgeVariant;
  size?:    'sm' | 'md';
  style?:   ViewStyle;
}

export function Badge({ label, variant = 'gray', size = 'md', style }: BadgeProps) {
  const C = useThemeColors();

  const map: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: C.successLight,  text: C.success },
    warning: { bg: C.warningLight,  text: C.warning },
    error:   { bg: C.errorLight,    text: C.error },
    info:    { bg: C.infoLight,     text: C.info },
    green:   { bg: C.green[100],    text: C.green[800] },
    gold:    { bg: C.gold[100],     text: C.gold[700] },
    gray:    { bg: C.gray[100],     text: C.gray[700] },
  };

  const colors = map[variant];

  return (
    <View style={[
      styles.base,
      size === 'sm' ? styles.sm : styles.md,
      { backgroundColor: colors.bg },
      style,
    ]}>
      <Text style={[
        styles.text,
        size === 'sm' && styles.textSm,
        { color: colors.text },
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base:   { borderRadius: Radius.full, alignSelf: 'flex-start' },
  md:     { paddingVertical: Spacing[0.5], paddingHorizontal: Spacing[2.5] },
  sm:     { paddingVertical: 2, paddingHorizontal: Spacing[2] },
  text:   { ...Typography.labelMedium, fontWeight: '700' },
  textSm: { fontSize: 10 },
});
