import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useThemeColors, Typography, Spacing } from '@theme/index';

interface LoadingStateProps {
  message?:    string;
  fullScreen?: boolean;
}

export function LoadingState({ message, fullScreen = false }: LoadingStateProps) {
  const C = useThemeColors();
  return (
    <View style={[
      styles.container,
      fullScreen && { flex: 1, backgroundColor: C.background },
    ]}>
      <ActivityIndicator size="large" color={C.green[700]} />
      {message && (
        <Text style={[styles.message, { color: C.textMuted }]}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  message:   { ...Typography.bodyMedium, marginTop: Spacing[3] },
});
