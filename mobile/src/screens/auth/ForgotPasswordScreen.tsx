import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@theme/index';
import { Button, Input } from '@components/ui';
import { authApi } from '@services/api';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export function ForgotPasswordScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const [phone,  setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,  setError]   = useState('');

  const handleSubmit = async () => {
    if (phone.length < 7) { setError('Enter a valid phone number'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.requestPasswordReset(phone);
      navigation.navigate('Otp', {
        userId:  data.userId,
        purpose: 'reset_password',
        phone,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Phone number not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + Spacing[6], paddingBottom: insets.bottom + Spacing[8] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.iconWrap}><Text style={styles.icon}>🔐</Text></View>
        <Text style={styles.heading}>Reset password</Text>
        <Text style={styles.subheading}>Enter your phone number and we'll send you a reset code.</Text>
        <Input
          label="Phone number"
          placeholder="08012345678"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={error}
          leftIcon={<Text>📞</Text>}
          required
        />
        <Button title="Send Reset Code" onPress={handleSubmit} loading={loading} size="lg" />
        <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backToLoginText}>← Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: Colors.white },
  container:    { flex: 1, paddingHorizontal: Spacing[6] },
  backBtn:      { marginBottom: Spacing[6] },
  backIcon:     { fontSize: 22, color: Colors.textSecondary },
  iconWrap:     { width: 80, height: 80, backgroundColor: Colors.green[50], borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[5] },
  icon:         { fontSize: 40 },
  heading:      { ...Typography.displayMedium, color: Colors.textPrimary, marginBottom: Spacing[2] },
  subheading:   { ...Typography.bodyLarge, color: Colors.textMuted, marginBottom: Spacing[8], lineHeight: 24 },
  backToLogin:  { alignItems: 'center', marginTop: Spacing[5] },
  backToLoginText: { ...Typography.bodyMedium, color: Colors.green[600], fontWeight: '600' },
});
