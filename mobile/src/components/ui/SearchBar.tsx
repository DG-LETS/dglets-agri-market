import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors, Typography, Radius, Spacing, Shadow } from '@theme/index';

interface SearchBarProps {
  value:         string;
  onChangeText:  (text: string) => void;
  placeholder?:  string;
  onSubmit?:     () => void;
  onClear?:      () => void;
  style?:        ViewStyle;
}

export function SearchBar({
  value, onChangeText, placeholder = 'Search products, farmers…',
  onSubmit, onClear, style,
}: SearchBarProps) {
  const C = useThemeColors();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: C.white,
        borderColor:     C.border,
      },
      Shadow.sm,
      style,
    ]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={[styles.input, { color: C.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => { onChangeText(''); onClear?.(); }} style={styles.clearBtn}>
          <Text style={[styles.clearIcon, { color: C.textMuted }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      Radius.full,
    paddingHorizontal: Spacing[4],
    height:            48,
    borderWidth:       1,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing[2] },
  input:      { flex: 1, ...Typography.bodyLarge },
  clearBtn:   { padding: Spacing[1] },
  clearIcon:  { fontSize: 12 },
});
