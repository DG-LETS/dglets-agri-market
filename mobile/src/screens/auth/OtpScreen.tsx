import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Button } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { authApi } from '@services/api';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Otp'>;
  route:      RouteProp<AuthStackParamList, 'Otp'>;
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export function OtpScreen({ navigation, route }: Props) {
  const { userId, purpose, phone } = route.params;
  const insets                     = useSafeAreaInsets();
  const { verifyOtp, isLoading }   = useAuthStore();
  const C                          = useThemeColors();

  const [otp,       setOtp]       = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    const val = text.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[index] = val; setOtp(next);
    if (val && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length < OTP_LENGTH) { Alert.alert('Enter all 6 digits'); return; }
    try {
      const result = await verifyOtp(userId, token, purpose);
      if (purpose === 'verify_phone') {
        const { user } = useAuthStore.getState();
        const role = user?.role ?? '';
        const regFee = (result as any)?.registrationFee;
        if (role === 'HAULAGE') { navigation.navigate('HaulageProfileSetup'); return; }
        if (regFee?.required && !regFee?.paid) { navigation.navigate('RegistrationFee'); return; }
      }
    } catch (error: any) {
      Alert.alert('Invalid OTP', error?.response?.data?.message || 'The code is incorrect or has expired.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.login({ identifier: phone });
      setCountdown(RESEND_SECONDS); setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } catch { Alert.alert('Error', 'Could not resend OTP. Please try again.'); }
    finally { setResending(false); }
  };

  const purposeLabel: Record<string, string> = {
    verify_phone: 'verify your phone number', login: 'sign in to your account', reset_password: 'reset your password',
  };

  const s = makeStyles(C);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top + Spacing[6], paddingBottom: insets.bottom + Spacing[8] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Text style={s.backIcon}>←</Text></TouchableOpacity>
        <View style={s.iconWrap}><Text style={s.icon}>📱</Text></View>
        <Text style={s.heading}>Enter OTP</Text>
        <Text style={s.subheading}>We sent a 6-digit code to {phone} to {purposeLabel[purpose] ?? 'continue'}.</Text>
        <View style={s.otpRow}>
          {otp.map((digit, i) => (
            <TextInput key={i} ref={el => { inputs.current[i] = el; }}
              style={[s.otpInput, digit && s.otpInputFilled]}
              value={digit} onChangeText={text => handleChange(text, i)}
              onKeyPress={({ nativeEvent: { key } }) => { if (key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus(); }}
              keyboardType="number-pad" maxLength={1} selectTextOnFocus caretHidden />
          ))}
        </View>
        <Button title="Verify Code" onPress={handleVerify} loading={isLoading} size="lg" style={s.btn} />
        <View style={s.resendRow}>
          {countdown > 0
            ? <Text style={s.resendCountdown}>Resend code in {countdown}s</Text>
            : <TouchableOpacity onPress={handleResend} disabled={resending}><Text style={s.resendLink}>{resending ? 'Sending…' : 'Resend code'}</Text></TouchableOpacity>
          }
        </View>
        <Text style={s.devHint}>💡 Development: Check server console for OTP</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:           { flex: 1, backgroundColor: C.white },
    container:      { flex: 1, paddingHorizontal: Spacing[6] },
    backBtn:        { marginBottom: Spacing[6] },
    backIcon:       { fontSize: 22, color: C.textSecondary },
    iconWrap:       { width: 80, height: 80, backgroundColor: C.green[50], borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[5] },
    icon:           { fontSize: 40 },
    heading:        { ...Typography.displayMedium, color: C.textPrimary, marginBottom: Spacing[2] },
    subheading:     { ...Typography.bodyLarge, color: C.textMuted, marginBottom: Spacing[8], lineHeight: 24 },
    otpRow:         { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[8], justifyContent: 'center' },
    otpInput:       { width: 48, height: 56, borderWidth: 1.5, borderColor: C.border, borderRadius: Radius.lg, textAlign: 'center', ...Typography.headingMedium, color: C.textPrimary, backgroundColor: C.gray[100] },
    otpInputFilled: { borderColor: C.green[700], backgroundColor: C.green[50], ...Shadow.sm },
    btn:            { marginBottom: Spacing[5] },
    resendRow:      { alignItems: 'center', marginBottom: Spacing[4] },
    resendCountdown:{ ...Typography.bodyMedium, color: C.textMuted },
    resendLink:     { ...Typography.bodyMedium, color: C.green[700], fontWeight: '700' },
    devHint:        { ...Typography.caption, color: C.textMuted, textAlign: 'center', marginTop: Spacing[4] },
  });
}
