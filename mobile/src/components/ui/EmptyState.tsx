import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@theme/index';
import { Button } from './Button';

interface EmptyStateProps {
  icon?:       string;
  title:       string;
  description?: string;
  actionLabel?: string;
  onAction?:   () => void;
}

export function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.desc}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={styles.btn}
          fullWidth={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: Spacing[10] },
  icon:      { fontSize: 48, marginBottom: Spacing[4] },
  title:     { ...Typography.headingSmall, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing[2] },
  desc:      { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing[5] },
  btn:       { marginTop: Spacing[2] },
});
