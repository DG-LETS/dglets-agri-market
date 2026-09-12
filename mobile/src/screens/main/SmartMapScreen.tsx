import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@theme/index';

export function SmartMapScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Map</Text>
        <Text style={styles.subtitle}>Find nearby farmers & suppliers</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.heading}>Smart Map Coming in Phase 6</Text>
        <Text style={styles.desc}>
          Smart Map will use your location to find nearby verified farmers, compare prices,
          calculate total delivered cost and rank suppliers by Smart Match Score.
        </Text>
        <View style={styles.featureList}>
          {[
            '📍 GPS-based discovery',
            '💰 Cheapest near me',
            '⭐ Top rated near me',
            '📦 Available now',
            '🚛 Bulk supplier matching',
            '🤖 AI-powered recommendations',
          ].map(f => (
            <View key={f} style={styles.featureItem}>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header:      { backgroundColor: Colors.green[700], paddingHorizontal: Spacing[5], paddingBottom: Spacing[5], paddingTop: Spacing[4] },
  title:       { ...Typography.headingMedium, color: Colors.white },
  subtitle:    { ...Typography.bodyMedium, color: 'rgba(255,255,255,.75)', marginTop: 2 },
  body:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  icon:        { fontSize: 64, marginBottom: Spacing[5] },
  heading:     { ...Typography.headingSmall, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing[3] },
  desc:        { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing[6] },
  featureList: { width: '100%', gap: Spacing[2] },
  featureItem: { backgroundColor: Colors.white, borderRadius: 10, padding: Spacing[3], borderWidth: 1, borderColor: Colors.border },
  featureText: { ...Typography.bodyMedium, color: Colors.textSecondary },
});
