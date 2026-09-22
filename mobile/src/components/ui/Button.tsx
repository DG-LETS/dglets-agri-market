import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, View,
} from 'react-native';
import { useThemeColors, Typography, Radius, Spacing, Shadow } from '@theme/index';

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
  const C = useThemeColors();
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary:   C.green[700],
    secondary: C.green[100],
    outline:   C.transparent,
    ghost:     C.transparent,
    danger:    C.error,
    gold:      C.gold[600],
  };
  const tc: Record<Variant, string> = {
    primary:   '#ffffff',
    secondary: C.green[800],
    outline:   C.green[700],
    ghost:     C.green[700],
    danger:    '#ffffff',
    gold:      '#ffffff',
  };
  const borderColor = variant === 'outline' ? C.green[700] : 'transparent';
  const hasBorder   = variant === 'outline';
  const shadow = variant === 'primary' ? Shadow.green : variant === 'gold' ? Shadow.md : {};

  const sizeStyles: Record<Size, object> = {
    sm: { paddingVertical: Spacing[2],   paddingHorizontal: Spacing[4],  minHeight: 36 },
    md: { paddingVertical: Spacing[3],   paddingHorizontal: Spacing[5],  minHeight: 48 },
    lg: { paddingVertical: Spacing[4],   paddingHorizontal: Spacing[6],  minHeight: 56 },
  };
  const textSizeStyles: Record<Size, object> = {
    sm: { ...Typography.labelLarge },
    md: { ...Typography.titleMedium },
    lg: { ...Typography.titleLarge },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        sizeStyles[size],
        { backgroundColor: bg[variant], ...(hasBorder ? { borderWidth: 1.5, borderColor } : {}) },
        ...([shadow] as any),
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? C.green[700] : '#ffffff'} />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[styles.text, { color: tc[variant] }, textSizeStyles[size] as TextStyle, textStyle]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:      { borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%' },
  content:   { flexDirection: 'row', alignItems: 'center' },
  iconLeft:  { marginRight: Spacing[2] },
  iconRight: { marginLeft:  Spacing[2] },
  text:      { fontWeight: '700', textAlign: 'center' },
  disabled:  { opacity: 0.5 },
});
