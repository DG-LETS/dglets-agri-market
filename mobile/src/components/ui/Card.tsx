import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors, Radius, Spacing, Shadow } from '@theme/index';

interface CardProps {
  children:  React.ReactNode;
  style?:    ViewStyle;
  padding?:  number;
  shadow?:   keyof typeof Shadow;
  bordered?: boolean;
}

export function Card({
  children, style, padding = Spacing[4],
  shadow = 'sm', bordered = true,
}: CardProps) {
  const C = useThemeColors();
  return (
    <View style={[
      styles.card,
      { backgroundColor: C.white, ...(bordered ? { borderWidth: 1, borderColor: C.border } : {}) },
      Shadow[shadow],
      { padding },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.xl },
});
