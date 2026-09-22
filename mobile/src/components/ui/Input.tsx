import React, { useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, TextInputProps, ViewStyle,
} from 'react-native';
import { useThemeColors, Typography, Radius, Spacing } from '@theme/index';

interface InputProps extends TextInputProps {
  label?:        string;
  error?:        string;
  hint?:         string;
  leftIcon?:     React.ReactNode;
  rightIcon?:    React.ReactNode;
  containerStyle?: ViewStyle;
  required?:     boolean;
}

export function Input({
  label, error, hint, leftIcon, rightIcon,
  containerStyle, required, secureTextEntry, ...props
}: InputProps) {
  const C = useThemeColors();
  const [focused,  setFocused]  = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = secureTextEntry;

  const s = makeStyles(C);

  return (
    <View style={[s.container, containerStyle]}>
      {label && (
        <Text style={s.label}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      )}
      <View style={[
        s.inputWrap,
        focused && s.inputWrapFocused,
        !!error && s.inputWrapError,
      ]}>
        {leftIcon && <View style={s.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[s.input, leftIcon && s.inputWithLeft, (rightIcon || isPassword) && s.inputWithRight]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={C.gray[400]}
          secureTextEntry={isPassword && !revealed}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity style={s.iconRight} onPress={() => setRevealed(r => !r)}>
            <Text style={s.eyeIcon}>{revealed ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
        {!isPassword && rightIcon && <View style={s.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      {hint && !error && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container:        { marginBottom: Spacing[4] },
    label:            { ...Typography.labelLarge, color: C.gray[700], marginBottom: Spacing[1] },
    required:         { color: C.error },
    inputWrap: {
      flexDirection:   'row',
      alignItems:      'center',
      borderWidth:     1.5,
      borderColor:     C.border,
      borderRadius:    Radius.lg,
      backgroundColor: C.white,
      minHeight:       50,
    },
    inputWrapFocused: { borderColor: C.green[600] },
    inputWrapError:   { borderColor: C.error },
    input: {
      flex: 1,
      paddingVertical:   Spacing[3],
      paddingHorizontal: Spacing[4],
      ...Typography.bodyLarge,
      color: C.textPrimary,
    },
    inputWithLeft:  { paddingLeft:  Spacing[2] },
    inputWithRight: { paddingRight: Spacing[2] },
    iconLeft:  { paddingLeft: Spacing[3] },
    iconRight: { paddingRight: Spacing[3] },
    eyeIcon:   { fontSize: 16 },
    error: { ...Typography.bodySmall, color: C.error, marginTop: Spacing[1] },
    hint:  { ...Typography.bodySmall, color: C.textMuted, marginTop: Spacing[1] },
  });
}
