import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, Typography, Spacing } from '@theme/index';

interface ScreenHeaderProps {
  title:         string;
  subtitle?:     string;
  showBack?:     boolean;
  onBack?:       () => void;
  rightElement?: React.ReactNode;
  dark?:         boolean;
}

export function ScreenHeader({
  title, subtitle, showBack, onBack, rightElement, dark = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const C      = useThemeColors();

  const bg = dark ? C.green[700] : C.white;
  const fg = dark ? '#ffffff' : C.textPrimary;

  return (
    <View style={[styles.container, { backgroundColor: bg, borderBottomColor: C.border, paddingTop: insets.top + Spacing[2] }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <View style={styles.inner}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={[styles.backIcon, { color: fg }]}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.title, { color: fg }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: dark ? 'rgba(255,255,255,.75)' : C.textMuted }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightElement && <View style={styles.right}>{rightElement}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1 },
  inner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[5], paddingBottom: Spacing[3] },
  left:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn:   { marginRight: Spacing[3] },
  backIcon:  { fontSize: 22, fontWeight: '300' },
  title:     { ...Typography.headingSmall },
  subtitle:  { ...Typography.bodySmall, marginTop: 2 },
  right:     { marginLeft: Spacing[3] },
});
