import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@theme/index';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message, fullScreen = false }: LoadingStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Colors.green[700]} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  fullScreen: { flex: 1, backgroundColor: Colors.white },
  message:    { ...Typography.bodyMedium, color: Colors.textMuted, marginTop: Spacing[3] },
});
