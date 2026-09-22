import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, Typography, Spacing, Radius } from '@theme/index';

export function SmartMapScreen() {
  const insets = useSafeAreaInsets();
  const C      = useThemeColors();
  const s      = makeStyles(C);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Smart Map</Text>
        <Text style={s.subtitle}>Find nearby farmers & suppliers</Text>
      </View>
      <View style={s.body}>
        <Text style={s.icon}>🗺️</Text>
        <Text style={s.heading}>Smart Map Coming in Phase 2</Text>
        <Text style={s.desc}>
          Smart Map will use your location to find nearby verified farmers, compare prices,
          calculate total delivered cost and rank suppliers by Smart Match Score.
        </Text>
        <View style={s.featureList}>
          {[
            '📍 GPS-based discovery',
            '💰 Cheapest near me',
            '⭐ Top rated near me',
            '📦 Available now',
            '🚛 Bulk supplier matching',
            '🤖 AI-powered recommendations',
          ].map(f => (
            <View key={f} style={s.featureItem}>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: C.background },
    header:      { backgroundColor: C.green[700], paddingHorizontal: Spacing[5], paddingBottom: Spacing[5], paddingTop: Spacing[4] },
    title:       { ...Typography.headingMedium, color: '#ffffff' },
    subtitle:    { ...Typography.bodyMedium, color: 'rgba(255,255,255,.75)', marginTop: 2 },
    body:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
    icon:        { fontSize: 64, marginBottom: Spacing[5] },
    heading:     { ...Typography.headingSmall, color: C.textPrimary, textAlign: 'center', marginBottom: Spacing[3] },
    desc:        { ...Typography.bodyMedium, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing[6] },
    featureList: { width: '100%', gap: Spacing[2] },
    featureItem: { backgroundColor: C.white, borderRadius: Radius.lg, padding: Spacing[3], borderWidth: 1, borderColor: C.border },
    featureText: { ...Typography.bodyMedium, color: C.textSecondary },
  });
}
