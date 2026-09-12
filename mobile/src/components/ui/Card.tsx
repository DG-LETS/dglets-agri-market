import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '@theme/index';

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
  return (
    <View style={[
      styles.card,
      Shadow[shadow],
      bordered && styles.bordered,
      { padding },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.xl,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
