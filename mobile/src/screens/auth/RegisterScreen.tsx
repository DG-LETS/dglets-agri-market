import { Wheat, ArrowLeft, User, Phone, Mail, Lock, Truck, CheckSquare, Square } from "lucide-react-native";
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useThemeColors, Typography, Spacing, Radius } from '@theme/index';
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

const roles = [
  { id: 'FARMER',     label: 'Farmer',     icon: 'User', desc: 'Sell your produce' },
  { id: 'BUYER',      label: 'Buyer',      icon: 'ShoppingCart',  desc: 'Buy farm produce' },
  { id: 'TRADER',     label: 'Trader',     icon: 'Store',  desc: 'Trade & aggregate' },
  { id: 'AGGREGATOR', label: 'Aggregator', icon: 'Handshake',  desc: 'Aggregate produce' },
  { id: 'HAULAGE',    label: 'Logistics',  emoji: <Truck size={20} color="#666" />,  desc: 'Deliver goods' },
  { id: 'PROCESSOR',  label: 'Processor',  icon: 'Factory',  desc: 'Process & export' },
  { id: 'EXPORTER',   label: 'Exporter',   icon: 'Globe',  desc: 'Export produce' },
];

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Register'> };

export function RegisterScreen({ navigation }: Props) {
  const insets    = useSafeAreaInsets();
  const { register: registerUser, isLoading } = useAuthStore();
  const C         = useThemeColors();
  const [selectedRole, setSelectedRole] = useState('BUYER');
  const [step, setStep] = useState<1 | 2>(1);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeSeller, setAgreeSeller] = useState(false);

  const { control, handleSubmit, formState: { errors }, trigger } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleNext = async () => {
    const valid = await trigger(['firstName', 'lastName', 'phone']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    const isSeller = ['FARMER', 'TRADER', 'AGGREGATOR', 'PROCESSOR', 'EXPORTER'].includes(selectedRole);
    if (!agreeTerms) {
      Alert.alert('Required', 'Please agree to the Terms & Conditions to continue.');
      return;
    }
    if (isSeller && !agreeSeller) {
      Alert.alert('Required', 'Please confirm the seller declarations to continue.');
      return;
    }
    try {
      const result = await registerUser({ ...data, role: selectedRole, email: data.email || undefined });
      navigation.navigate('Otp', { userId: result.userId, purpose: 'verify_phone', phone: data.phone });
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const s = makeStyles(C);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.flex}
        contentContainerStyle={[s.container, { paddingTop: insets.top + Spacing[4], paddingBottom: insets.bottom + Spacing[8] }]}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={s.backBtn}>
          <ArrowLeft size={24} color="#666" />
        </TouchableOpacity>
        <Text style={s.heading}>Create account</Text>
        <Text style={s.subheading}>Join Nigeria's agricultural marketplace</Text>
        <View style={s.steps}>
          <View style={[s.stepDot, step >= 1 && s.stepDotActive]} />
          <View style={s.stepLine} />
          <View style={[s.stepDot, step >= 2 && s.stepDotActive]} />
        </View>
        {step === 1 ? (
          <View>
            <Controller control={control} name="firstName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="First Name" placeholder="e.g. Musa" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.firstName?.message} leftIcon={<User size={24} color="#666" />} required />
              )} />
            <Controller control={control} name="lastName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Last Name" placeholder="e.g. Abdullahi" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.lastName?.message} leftIcon={<User size={24} color="#666" />} required />
              )} />
            <Controller control={control} name="phone"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Phone Number" placeholder="e.g. 08012345678" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phone?.message} keyboardType="phone-pad" leftIcon={<Phone size={24} color="#666" />} required />
              )} />
            <Button title="Continue" onPress={handleNext} size="lg" style={s.btn} />
          </View>
        ) : (
          <View>
            <Text style={s.roleLabel}>I am joining as a…</Text>
            <View style={s.roleGrid}>
              {roles.map(role => (
                <TouchableOpacity key={role.id} style={[s.roleCard, selectedRole === role.id && s.roleCardActive]}
                  onPress={() => setSelectedRole(role.id)} activeOpacity={0.8}>
                  <Text style={s.roleEmoji}>{role.emoji}</Text>
                  <Text style={[s.roleName, selectedRole === role.id && s.roleNameActive]}>{role.label}</Text>
                  <Text style={s.roleDesc}>{role.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Controller control={control} name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Email (optional)" placeholder="email@example.com" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" leftIcon={<Mail size={24} color="#666" />} />
              )} />
            <Controller control={control} name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Password (optional)" placeholder="At least 8 characters" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secureTextEntry leftIcon={<Lock size={24} color="#666" />} hint="Leave blank to use OTP login" />
              )} />
            <View style={s.checkboxContainer}>
              <TouchableOpacity style={s.checkbox} onPress={() => setAgreeTerms(!agreeTerms)} activeOpacity={0.8}>
                {agreeTerms ? <CheckSquare size={20} color={C.green[700]} /> : <Square size={20} color={C.gray[400]} />}
                <Text style={s.checkboxText}>I agree to the DG-LETS Terms & Conditions and acknowledge the Privacy Policy.</Text>
              </TouchableOpacity>
              
              {['FARMER', 'TRADER', 'AGGREGATOR', 'PROCESSOR', 'EXPORTER'].includes(selectedRole) && (
                <TouchableOpacity style={s.checkbox} onPress={() => setAgreeSeller(!agreeSeller)} activeOpacity={0.8}>
                  {agreeSeller ? <CheckSquare size={20} color={C.green[700]} /> : <Square size={20} color={C.gray[400]} />}
                  <Text style={s.checkboxText}>I confirm that the products I list are genuine, accurately described, legally permitted for sale, and that I have the right to sell them.</Text>
                </TouchableOpacity>
              )}
            </View>
            <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={isLoading} size="lg" style={s.btn} />
          </View>
        )}
        <View style={s.loginRow}>
          <Text style={s.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={s.loginLink}>Sign in</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:           { flex: 1, backgroundColor: C.white },
    container:      { flexGrow: 1, paddingHorizontal: Spacing[6] },
    backBtn:        { marginBottom: Spacing[5] },
    backIcon:       { fontSize: 22, color: C.textSecondary },
    heading:        { ...Typography.displayMedium, color: C.textPrimary, marginBottom: Spacing[1] },
    subheading:     { ...Typography.bodyLarge, color: C.textMuted, marginBottom: Spacing[6] },
    steps:          { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[7] },
    stepDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gray[200] },
    stepDotActive:  { backgroundColor: C.green[700] },
    stepLine:       { flex: 1, height: 2, backgroundColor: C.gray[200], marginHorizontal: Spacing[2] },
    btn:            { marginTop: Spacing[3] },
    roleLabel:      { ...Typography.labelLarge, color: C.textSecondary, marginBottom: Spacing[3] },
    roleGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginBottom: Spacing[5] },
    roleCard:       { width: '30%', backgroundColor: C.gray[100], borderRadius: Radius.lg, padding: Spacing[3], alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    roleCardActive: { borderColor: C.green[700], backgroundColor: C.green[50] },
    roleEmoji:      { fontSize: 24, marginBottom: Spacing[1] },
    roleName:       { ...Typography.labelMedium, color: C.textSecondary, fontWeight: '700' },
    roleNameActive: { color: C.green[700] },
    roleDesc:       { ...Typography.caption, color: C.textMuted, textAlign: 'center', marginTop: 2 },
    loginRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[6] },
    loginText:      { ...Typography.bodyMedium, color: C.textMuted },
    loginLink:      { ...Typography.bodyMedium, color: C.green[700], fontWeight: '700' },
    checkboxContainer: { marginTop: Spacing[2], marginBottom: Spacing[4], gap: Spacing[3] },
    checkbox:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },
    checkboxText:   { flex: 1, ...Typography.caption, color: C.textSecondary, lineHeight: 18 },
  });
}
