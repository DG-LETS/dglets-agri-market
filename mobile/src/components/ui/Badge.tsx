import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@theme/index';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'green' | 'gold' | 'gray';

interface BadgeProps {
  label:    string;
  variant?: BadgeVariant;
  size?:    'sm' | 'md';
  style?:   ViewStyle;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.successLight, text: '#14532d' },
  warning: { bg: Colors.warningLight, text: '#92400e' },
  error:   { bg: Colors.errorLight,   text: '#991b1b' },
  info:    { bg: Colors.infoLight,    text: '#1e3a8a' },
  green:   { bg: Colors.green[100],   text: Colors.green[800] },
  gold:    { bg: Colors.gold[100],    text: Colors.gold[700] },
  gray:    { bg: Colors.gray[100],    text: Colors.gray[700] },
};

export function Badge({ label, variant = 'gray', size = 'md', style }: BadgeProps) {
  const colors = variantMap[variant];
  return (
    <View style={[styles.base, styles[size], { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.full, alignSelf: 'flex-start' },
  md:   { paddingVertical: Spacing[0.5], paddingHorizontal: Spacing[2.5] },
  sm:   { paddingVertical: 2, paddingHorizontal: Spacing[2] },
  text: { ...Typography.labelMedium, fontWeight: '700' },
  textSm: { fontSize: 10 },
});
