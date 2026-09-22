import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useThemeColors, Typography, Spacing } from '@theme/index';
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
  const insets              = useSafeAreaInsets();
  const { login, isLoading }= useAuthStore();
  const C                   = useThemeColors();
  const [useOtp, setUseOtp] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data.identifier, useOtp ? undefined : data.password);
      if (result?.otpSent) navigation.navigate('Otp', { userId: result.userId, purpose: 'login', phone: data.identifier });
    } catch (error: any) {
      Alert.alert('Login Failed', error?.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  const s = makeStyles(C);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.flex}
        contentContainerStyle={[s.container, { paddingTop: insets.top + Spacing[6], paddingBottom: insets.bottom + Spacing[8] }]}
        keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.logoWrap}><Text style={s.logoEmoji}>🌾</Text></View>
          <Text style={s.appName}>DG-LETS</Text>
          <Text style={s.appSub}>AGRI MARKET</Text>
          <Text style={s.heading}>Welcome back</Text>
          <Text style={s.subheading}>Sign in to your account</Text>
        </View>
        <View style={s.form}>
          <Controller control={control} name="identifier"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input label="Phone number or email" placeholder="08012345678 or email@example.com"
                value={value} onChangeText={onChange} onBlur={onBlur}
                error={errors.identifier?.message} leftIcon={<Text>📞</Text>} required />
            )}
          />
          {!useOtp && (
            <Controller control={control} name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Password" placeholder="Enter your password"
                  value={value} onChangeText={onChange} onBlur={onBlur}
                  error={errors.password?.message} secureTextEntry leftIcon={<Text>🔒</Text>} />
              )}
            />
          )}
          <TouchableOpacity style={s.otpToggle} onPress={() => setUseOtp(v => !v)}>
            <Text style={s.otpToggleText}>{useOtp ? '🔑 Sign in with password instead' : '📱 Sign in with OTP instead'}</Text>
          </TouchableOpacity>
          {!useOtp && (
            <TouchableOpacity style={s.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}
          <Button title={useOtp ? 'Send OTP' : 'Sign In'} onPress={handleSubmit(onSubmit)} loading={isLoading} size="lg" style={s.submitBtn} />
        </View>
        <View style={s.registerRow}>
          <Text style={s.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.registerLink}>Join DG-LETS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:         { flex: 1, backgroundColor: C.white },
    container:    { flexGrow: 1, paddingHorizontal: Spacing[6] },
    header:       { alignItems: 'center', marginBottom: Spacing[8] },
    logoWrap:     { width: 72, height: 72, backgroundColor: C.green[700], borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3] },
    logoEmoji:    { fontSize: 36 },
    appName:      { ...Typography.headingLarge, color: C.green[800], letterSpacing: 1 },
    appSub:       { ...Typography.labelLarge, color: C.green[600], letterSpacing: 3, marginBottom: Spacing[6] },
    heading:      { ...Typography.displayMedium, color: C.textPrimary, marginBottom: Spacing[1] },
    subheading:   { ...Typography.bodyLarge, color: C.textMuted },
    form:         { marginBottom: Spacing[6] },
    otpToggle:    { alignSelf: 'flex-start', marginBottom: Spacing[3], marginTop: -Spacing[2] },
    otpToggleText:{ ...Typography.bodyMedium, color: C.green[600], fontWeight: '600' },
    forgotBtn:    { alignSelf: 'flex-end', marginBottom: Spacing[5], marginTop: -Spacing[2] },
    forgotText:   { ...Typography.bodyMedium, color: C.green[600], fontWeight: '600' },
    submitBtn:    { marginTop: Spacing[2] },
    registerRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[4] },
    registerText: { ...Typography.bodyMedium, color: C.textMuted },
    registerLink: { ...Typography.bodyMedium, color: C.green[700], fontWeight: '700' },
  });
}
