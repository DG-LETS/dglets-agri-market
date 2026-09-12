import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Radius, Spacing, Shadow } from '@theme/index';

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
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray[400]}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => { onChangeText(''); onClear?.(); }} style={styles.clearBtn}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.white,
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing[4],
    height:          48,
    borderWidth:     1,
    borderColor:     Colors.border,
    ...Shadow.sm,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing[2] },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
  clearBtn:  { padding: Spacing[1] },
  clearIcon: { fontSize: 12, color: Colors.gray[500] },
});
