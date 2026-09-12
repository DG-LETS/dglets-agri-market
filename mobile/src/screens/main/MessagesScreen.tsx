import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@theme/index';

export function MessagesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.icon}>💬</Text>
        <Text style={styles.heading}>Messaging Coming in Phase 5</Text>
        <Text style={styles.desc}>
          Real-time chat with farmers, buyers and haulage partners.
          Every conversation linked to orders and products.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header:    { backgroundColor: Colors.white, paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:     { ...Typography.headingMedium, color: Colors.textPrimary },
  body:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  icon:      { fontSize: 64, marginBottom: Spacing[5] },
  heading:   { ...Typography.headingSmall, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing[3] },
  desc:      { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
