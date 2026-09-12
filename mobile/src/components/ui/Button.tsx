import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, View,
} from 'react-native';
import { Colors, Typography, Radius, Spacing, Shadow } from '@theme/index';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title:       string;
  onPress:     () => void;
  variant?:    Variant;
  size?:       Size;
  loading?:    boolean;
  disabled?:   boolean;
  fullWidth?:  boolean;
  leftIcon?:   React.ReactNode;
  rightIcon?:  React.ReactNode;
  style?:      ViewStyle;
  textStyle?:  TextStyle;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, fullWidth = true,
  leftIcon, rightIcon, style, textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.green[700] : Colors.white}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius:   Radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
    flexDirection:  'row',
  },
  fullWidth: { width: '100%' },
  content:   { flexDirection: 'row', alignItems: 'center' },
  iconLeft:  { marginRight: Spacing[2] },
  iconRight: { marginLeft:  Spacing[2] },

  /* Variants */
  primary: {
    backgroundColor: Colors.green[700],
    ...Shadow.green,
  },
  secondary: {
    backgroundColor: Colors.green[100],
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.green[700],
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  gold: {
    backgroundColor: Colors.gold[600],
    ...Shadow.md,
  },
  disabled: {
    opacity: 0.5,
  },

  /* Sizes */
  size_sm: { paddingVertical: Spacing[2],   paddingHorizontal: Spacing[4],  minHeight: 36 },
  size_md: { paddingVertical: Spacing[3.5], paddingHorizontal: Spacing[5],  minHeight: 48 },
  size_lg: { paddingVertical: Spacing[4],   paddingHorizontal: Spacing[6],  minHeight: 56 },

  /* Text */
  text: { fontWeight: '700', textAlign: 'center' },
  text_primary:   { color: Colors.white },
  text_secondary: { color: Colors.green[800] },
  text_outline:   { color: Colors.green[700] },
  text_ghost:     { color: Colors.green[700] },
  text_danger:    { color: Colors.white },
  text_gold:      { color: Colors.white },

  textSize_sm: { ...Typography.labelLarge },
  textSize_md: { ...Typography.titleMedium },
  textSize_lg: { ...Typography.titleLarge },
});
