import React, { useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, TextInputProps, ViewStyle,
} from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@theme/index';

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
  const [focused,  setFocused]  = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={[
        styles.inputWrap,
        focused && styles.inputWrapFocused,
        !!error && styles.inputWrapError,
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeft, (rightIcon || isPassword) && styles.inputWithRight]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={Colors.gray[400]}
          secureTextEntry={isPassword && !revealed}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity style={styles.iconRight} onPress={() => setRevealed(r => !r)}>
            <Text style={styles.eyeIcon}>{revealed ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
        {!isPassword && rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { marginBottom: Spacing[4] },
  label:       { ...Typography.labelLarge, color: Colors.gray[700], marginBottom: Spacing[1.5] },
  required:    { color: Colors.error },
  inputWrap: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1.5,
    borderColor:    Colors.gray[300],
    borderRadius:   Radius.lg,
    backgroundColor: Colors.white,
    minHeight:      50,
  },
  inputWrapFocused: { borderColor: Colors.green[600] },
  inputWrapError:   { borderColor: Colors.error },
  input: {
    flex: 1,
    paddingVertical:   Spacing[3],
    paddingHorizontal: Spacing[4],
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
  inputWithLeft:  { paddingLeft:  Spacing[2] },
  inputWithRight: { paddingRight: Spacing[2] },
  iconLeft:  { paddingLeft: Spacing[3] },
  iconRight: { paddingRight: Spacing[3] },
  eyeIcon:   { fontSize: 16 },
  error: { ...Typography.bodySmall, color: Colors.error, marginTop: Spacing[1] },
  hint:  { ...Typography.bodySmall, color: Colors.gray[500], marginTop: Spacing[1] },
});
