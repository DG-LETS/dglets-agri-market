import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { Button, Input } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

const schema = z.object({
  firstName: z.string().min(2, 'Enter your first name'),
  lastName:  z.string().min(2, 'Enter your last name'),
  phone:     z.string().min(7, 'Enter a valid phone number'),
  email:     z.string().email('Invalid email').optional().or(z.literal('')),
  password:  z.string().min(8, 'Password must be at least 8 characters').optional(),
});
type FormData = z.infer<typeof schema>;

type RoleOption = { id: string; label: string; emoji: string; desc: string };
const roles: RoleOption[] = [
  { id: 'FARMER',     label: 'Farmer',      emoji: '👨‍🌾', desc: 'Sell your produce' },
  { id: 'BUYER',      label: 'Buyer',       emoji: '🛒',  desc: 'Buy farm produce' },
  { id: 'TRADER',     label: 'Trader',      emoji: '🏪',  desc: 'Trade & aggregate' },
  { id: 'AGGREGATOR', label: 'Aggregator',  emoji: '🤝',  desc: 'Aggregate produce' },
  { id: 'HAULAGE',    label: 'Logistics',   emoji: '🚛',  desc: 'Deliver goods' },
  { id: 'PROCESSOR',  label: 'Processor',   emoji: '🏭',  desc: 'Process & export' },
  { id: 'EXPORTER',   label: 'Exporter',    emoji: '🌍',  desc: 'Export produce' },
];

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Register'> };

export function RegisterScreen({ navigation }: Props) {
  const insets    = useSafeAreaInsets();
  const { register: registerUser, isLoading } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<string>('BUYER');
  const [step, setStep] = useState<1 | 2>(1);

  const { control, handleSubmit, formState: { errors }, trigger } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleNext = async () => {
    const valid = await trigger(['firstName', 'lastName', 'phone']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const result = await registerUser({
        ...data,
        role: selectedRole,
        email: data.email || undefined,
      });
      navigation.navigate('Otp', {
        userId:  result.userId,
        purpose: 'verify_phone',
        phone:   data.phone,
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing[4], paddingBottom: insets.bottom + Spacing[8] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.subheading}>Join Nigeria's agricultural marketplace</Text>

        {/* Step indicator */}
        <View style={styles.steps}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>

        {step === 1 ? (
          /* ── Step 1: Basic info ── */
          <View>
            <Controller control={control} name="firstName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="First Name" placeholder="e.g. Musa" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.firstName?.message} leftIcon={<Text>👤</Text>} required />
              )}
            />
            <Controller control={control} name="lastName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Last Name" placeholder="e.g. Abdullahi" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.lastName?.message} leftIcon={<Text>👤</Text>} required />
              )}
            />
            <Controller control={control} name="phone"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Phone Number" placeholder="e.g. 08012345678" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phone?.message} keyboardType="phone-pad" leftIcon={<Text>📞</Text>} required />
              )}
            />
            <Button title="Continue" onPress={handleNext} size="lg" style={styles.btn} />
          </View>
        ) : (
          /* ── Step 2: Role, email, password ── */
          <View>
            <Text style={styles.roleLabel}>I am joining as a…</Text>
            <View style={styles.roleGrid}>
              {roles.map(role => (
                <TouchableOpacity
                  key={role.id}
                  style={[styles.roleCard, selectedRole === role.id && styles.roleCardActive]}
                  onPress={() => setSelectedRole(role.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.roleEmoji}>{role.emoji}</Text>
                  <Text style={[styles.roleName, selectedRole === role.id && styles.roleNameActive]}>{role.label}</Text>
                  <Text style={styles.roleDesc}>{role.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Controller control={control} name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Email (optional)" placeholder="email@example.com" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" leftIcon={<Text>✉️</Text>} />
              )}
            />
            <Controller control={control} name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Password (optional)" placeholder="At least 8 characters" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secureTextEntry leftIcon={<Text>🔒</Text>} hint="Leave blank to use OTP login" />
              )}
            />

            <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={isLoading} size="lg" style={styles.btn} />
          </View>
        )}

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: Colors.white },
  container:   { flexGrow: 1, paddingHorizontal: Spacing[6] },
  backBtn:     { marginBottom: Spacing[5] },
  backIcon:    { fontSize: 22, color: Colors.textSecondary },
  heading:     { ...Typography.displayMedium, color: Colors.textPrimary, marginBottom: Spacing[1] },
  subheading:  { ...Typography.bodyLarge, color: Colors.textMuted, marginBottom: Spacing[6] },
  steps:       { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[7] },
  stepDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gray[200] },
  stepDotActive: { backgroundColor: Colors.green[700] },
  stepLine:    { flex: 1, height: 2, backgroundColor: Colors.gray[200], marginHorizontal: Spacing[2] },
  btn:         { marginTop: Spacing[3] },
  roleLabel:   { ...Typography.labelLarge, color: Colors.textSecondary, marginBottom: Spacing[3] },
  roleGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginBottom: Spacing[5] },
  roleCard: {
    width: '30%', backgroundColor: Colors.gray[50],
    borderRadius: Radius.lg, padding: Spacing[3],
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  roleCardActive: { borderColor: Colors.green[700], backgroundColor: Colors.green[50] },
  roleEmoji:      { fontSize: 24, marginBottom: Spacing[1] },
  roleName:       { ...Typography.labelMedium, color: Colors.textSecondary, fontWeight: '700' },
  roleNameActive: { color: Colors.green[700] },
  roleDesc:       { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  loginRow:    { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[6] },
  loginText:   { ...Typography.bodyMedium, color: Colors.textMuted },
  loginLink:   { ...Typography.bodyMedium, color: Colors.green[700], fontWeight: '700' },
});
