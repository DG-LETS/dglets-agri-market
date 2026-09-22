import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, Typography, Spacing } from '@theme/index';

export function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const C      = useThemeColors();
  const s      = makeStyles(C);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
      </View>
      <View style={s.body}>
        <Text style={s.icon}>💬</Text>
        <Text style={s.heading}>Messaging Coming in Phase 5</Text>
        <Text style={s.desc}>
          Real-time chat with farmers, buyers and haulage partners.
          Every conversation linked to orders and products.
        </Text>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header:    { backgroundColor: C.white, paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.border },
    title:     { ...Typography.headingMedium, color: C.textPrimary },
    body:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
    icon:      { fontSize: 64, marginBottom: Spacing[5] },
    heading:   { ...Typography.headingSmall, color: C.textPrimary, textAlign: 'center', marginBottom: Spacing[3] },
    desc:      { ...Typography.bodyMedium, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  });
}
