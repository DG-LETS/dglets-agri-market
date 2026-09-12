import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Colors, Typography, Spacing } from '@theme/index';
import { Button, Input } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

const schema = z.object({
  identifier: z.string().min(7, 'Enter your phone number or email'),
  password:   z.string().optional(),
});
type FormData = z.infer<typeof schema>;

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Login'> };

export function LoginScreen({ navigation }: Props) {
  const insets  = useSafeAreaInsets();
  const { login, isLoading } = useAuthStore();
  const [useOtp, setUseOtp] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data.identifier, useOtp ? undefined : data.password);
      if (result?.otpSent) {
        navigation.navigate('Otp', {
          userId:  result.userId,
          purpose: 'login',
          phone:   data.identifier,
        });
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error?.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing[6], paddingBottom: insets.bottom + Spacing[8] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🌾</Text>
          </View>
          <Text style={styles.appName}>DG-LETS</Text>
          <Text style={styles.appSub}>AGRI MARKET</Text>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control} name="identifier"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Phone number or email"
                placeholder="08012345678 or email@example.com"
                value={value} onChangeText={onChange} onBlur={onBlur}
                error={errors.identifier?.message}
                keyboardType="default"
                leftIcon={<Text style={styles.inputIcon}>📞</Text>}
                required
              />
            )}
          />

          {!useOtp && (
            <Controller
              control={control} name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={value} onChangeText={onChange} onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
                />
              )}
            />
          )}

          {/* OTP toggle */}
          <TouchableOpacity style={styles.otpToggle} onPress={() => setUseOtp(v => !v)}>
            <Text style={styles.otpToggleText}>
              {useOtp ? '🔑 Sign in with password instead' : '📱 Sign in with OTP instead'}
            </Text>
          </TouchableOpacity>

          {/* Forgot password */}
          {!useOtp && (
            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <Button
            title={useOtp ? 'Send OTP' : 'Sign In'}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Join DG-LETS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: Colors.white },
  container:   { flexGrow: 1, paddingHorizontal: Spacing[6] },
  header:      { alignItems: 'center', marginBottom: Spacing[8] },
  logoWrap:    { width: 72, height: 72, backgroundColor: Colors.green[700], borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3] },
  logoEmoji:   { fontSize: 36 },
  appName:     { ...Typography.headingLarge, color: Colors.green[800], letterSpacing: 1 },
  appSub:      { ...Typography.labelLarge, color: Colors.green[600], letterSpacing: 3, marginBottom: Spacing[6] },
  heading:     { ...Typography.displayMedium, color: Colors.textPrimary, marginBottom: Spacing[1] },
  subheading:  { ...Typography.bodyLarge, color: Colors.textMuted },
  form:        { marginBottom: Spacing[6] },
  inputIcon:   { fontSize: 16 },
  otpToggle:   { alignSelf: 'flex-start', marginBottom: Spacing[3], marginTop: -Spacing[2] },
  otpToggleText: { ...Typography.bodyMedium, color: Colors.green[600], fontWeight: '600' },
  forgotBtn:   { alignSelf: 'flex-end', marginBottom: Spacing[5], marginTop: -Spacing[2] },
  forgotText:  { ...Typography.bodyMedium, color: Colors.green[600], fontWeight: '600' },
  submitBtn:   { marginTop: Spacing[2] },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[4] },
  registerText:{ ...Typography.bodyMedium, color: Colors.textMuted },
  registerLink:{ ...Typography.bodyMedium, color: Colors.green[700], fontWeight: '700' },
});
