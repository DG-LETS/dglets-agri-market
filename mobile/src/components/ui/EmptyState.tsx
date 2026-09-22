import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, Typography, Spacing } from '@theme/index';
import { Button } from './Button';

interface EmptyStateProps {
  icon?:        string;
  title:        string;
  description?: string;
  actionLabel?: string;
  onAction?:    () => void;
}

export function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  const C = useThemeColors();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: C.textPrimary }]}>{title}</Text>
      {description && (
        <Text style={[styles.desc, { color: C.textMuted }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={styles.btn} fullWidth={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: Spacing[10] },
  icon:      { fontSize: 48, marginBottom: Spacing[4] },
  title:     { ...Typography.headingSmall, textAlign: 'center', marginBottom: Spacing[2] },
  desc:      { ...Typography.bodyMedium, textAlign: 'center', lineHeight: 22, marginBottom: Spacing[5] },
  btn:       { marginTop: Spacing[2] },
});
