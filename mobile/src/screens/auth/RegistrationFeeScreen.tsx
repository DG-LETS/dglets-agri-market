import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Button, LoadingState } from '@components/ui';
import { feesApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'RegistrationFee'> };

const ROLE_LABELS: Record<string, string> = {
  FARMER:'Farmer', TRADER:'Trader', AGGREGATOR:'Aggregator',
  PROCESSOR:'Processor', EXPORTER:'Exporter', HAULAGE:'Haulage Partner',
};

const ROLE_BENEFITS: Record<string, string[]> = {
  FARMER:     ['List your produce to thousands of buyers','Receive orders directly','Access market prices','Build your seller reputation'],
  TRADER:     ['Access verified farmers and bulk produce','Manage buy/sell operations','Build trade reputation'],
  AGGREGATOR: ['Aggregate produce from multiple farmers','Connect with large buyers and exporters'],
  PROCESSOR:  ['Source raw materials directly from farmers','List processed products on the marketplace'],
  EXPORTER:   ['Access export-grade produce','Connect with international buyers'],
  HAULAGE:    ['Access delivery jobs across Nigeria','Get hired by verified sellers','Build logistics reputation','Earn per delivery after platform commission'],
};

export function RegistrationFeeScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthStore();
  const C        = useThemeColors();
  const [paying, setPaying] = useState(false);

  const { data: feeStatus, isLoading, refetch } = useQuery({
    queryKey: ['registration-fee-status'],
    queryFn:  () => feesApi.getRegistrationStatus().then(r => r.data),
    retry: 0,
  });

  const payMutation = useMutation({
    mutationFn: () => feesApi.initRegistrationPayment().then(r => r.data),
    onSuccess: async (data) => {
      const url = data?.authorization_url as string | undefined;
      if (!url) { Alert.alert('Error', 'Could not get payment link. Please try again.'); return; }
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        setTimeout(() => { refetch(); setPaying(false); }, 2000);
      } else {
        Alert.alert('Cannot Open', 'Unable to open the payment page.');
      }
    },
    onError: (e: any) => {
      Alert.alert('Payment Error', e?.response?.data?.message ?? 'Could not start payment.');
      setPaying(false);
    },
  });

  const handlePay = () => {
    Alert.alert(
      'Activate Your Account',
      `Pay ₦${feeStatus?.amount?.toLocaleString() ?? '...'} to activate your ${ROLE_LABELS[user?.role ?? ''] ?? ''} account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay with Paystack', onPress: () => { setPaying(true); payMutation.mutate(); } },
      ],
    );
  };

  const handleSkip = () => {
    Alert.alert('Pay Later?', 'Your account will be in limited mode until the activation fee is paid.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue Anyway', onPress: () => navigation.replace('Login') },
    ]);
  };

  if (isLoading) return <LoadingState fullScreen message="Checking account status…" />;

  const s = makeStyles(C);

  if (!feeStatus?.required || feeStatus?.paid) {
    return (
      <View style={[s.flex, s.center, { paddingTop: insets.top }]}>
        <Text style={s.doneIcon}>🎉</Text>
        <Text style={s.doneTitle}>Account Activated!</Text>
        <Text style={s.doneSub}>Your account is active. Welcome to DG-LETS Agri Market!</Text>
        <Button title="Enter the Marketplace →" onPress={() => navigation.replace('Login')} size="lg" style={s.doneBtn} />
      </View>
    );
  }

  const role     = user?.role ?? 'FARMER';
  const benefits = ROLE_BENEFITS[role] ?? [];

  return (
    <ScrollView
      style={s.flex}
      contentContainerStyle={[s.container, { paddingTop: insets.top + Spacing[4], paddingBottom: insets.bottom + Spacing[10] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress */}
      <View style={s.progressBar}>
        {[{ label: 'Account', done: true }, ...(role === 'HAULAGE' ? [{ label: 'Profile', done: true }] : []), { label: 'Activation', done: false, active: true }].map((step, i, arr) => (
          <React.Fragment key={step.label}>
            <View style={s.progressStep}>
              <View style={[s.progressDot, step.done && s.progressDotDone, (step as any).active && s.progressDotActive]}>
                {step.done && <Text style={s.progressCheck}>✓</Text>}
              </View>
              <Text style={[s.progressLabel, (step as any).active && { color: C.green[700], fontWeight: '700' }]}>{step.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={[s.progressLine, step.done && s.progressLineDone]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Fee header */}
      <View style={s.headerCard}>
        <Text style={s.feeAmount}>₦{feeStatus?.amount?.toLocaleString()}</Text>
        <Text style={s.feeLabel}>One-time Activation Fee</Text>
        <Text style={s.feeRole}>{ROLE_LABELS[role]} Account</Text>
      </View>

      {/* Benefits */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>What you get with your activated account:</Text>
        <View style={s.benefitsList}>
          {[...benefits, 'Verified account badge on your profile', 'Priority listing in search results'].map((b, i) => (
            <View key={i} style={s.benefitItem}>
              <View style={s.benefitDot} />
              <Text style={s.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Fee note */}
      <View style={s.feeNote}>
        <Text style={s.feeNoteTitle}>💡 How DG-LETS fees work</Text>
        <Text style={s.feeNoteText}>• <Text style={{ fontWeight: '700' }}>Registration fee (one-time):</Text> ₦{feeStatus?.amount?.toLocaleString()} — paid once to activate.</Text>
        <Text style={s.feeNoteText}>• <Text style={{ fontWeight: '700' }}>Transaction fee:</Text> 2.05% deducted automatically from each completed order.</Text>
        {role === 'HAULAGE' && <Text style={s.feeNoteText}>• <Text style={{ fontWeight: '700' }}>Delivery commission:</Text> 5% of each delivery fee deducted when a job completes.</Text>}
        <Text style={s.feeNoteText}>• Buyers pay no fees to register or transact.</Text>
      </View>

      <View style={s.secureRow}>
        <Text style={s.secureText}>🔒 Secure payment via Paystack. Your card details are never stored by DG-LETS.</Text>
      </View>

      <Button
        title={paying || payMutation.isPending ? '⏳ Opening Paystack…' : `💳 Pay ₦${feeStatus?.amount?.toLocaleString()} & Activate`}
        onPress={handlePay} loading={paying || payMutation.isPending} size="lg" style={s.payBtn}
      />
      <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
        <Text style={s.skipText}>Pay later (limited access)</Text>
      </TouchableOpacity>
      <Text style={s.supportText}>
        Questions?{' '}
        <Text style={s.supportLink} onPress={() => Linking.openURL('https://wa.me/2348070566642?text=Hello%20DG-LETS%2C%20I%20need%20help%20with%20my%20registration%20fee.')}>
          Chat on WhatsApp
        </Text>
      </Text>
    </ScrollView>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:      { flex: 1, backgroundColor: C.white },
    center:    { justifyContent: 'center', alignItems: 'center', padding: Spacing[8] },
    container: { paddingHorizontal: Spacing[5] },

    progressBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[7] },
    progressStep:      { alignItems: 'center', gap: Spacing[1] },
    progressDot:       { width: 24, height: 24, borderRadius: 12, backgroundColor: C.gray[200], borderWidth: 2, borderColor: C.gray[300], alignItems: 'center', justifyContent: 'center' },
    progressDotDone:   { backgroundColor: C.green[700], borderColor: C.green[700] },
    progressDotActive: { backgroundColor: C.green[500], borderColor: C.green[700], width: 28, height: 28, borderRadius: 14 },
    progressCheck:     { fontSize: 11, color: '#ffffff', fontWeight: '900' },
    progressLine:      { width: 48, height: 2, backgroundColor: C.gray[200], marginHorizontal: Spacing[2] },
    progressLineDone:  { backgroundColor: C.green[700] },
    progressLabel:     { ...Typography.caption, color: C.textMuted, marginTop: 4 },

    headerCard: { backgroundColor: C.green[700], borderRadius: Radius.xl, padding: Spacing[6], alignItems: 'center', marginBottom: Spacing[6], ...Shadow.green },
    feeAmount:  { fontSize: 48, fontWeight: '900', color: '#ffffff', letterSpacing: -1 },
    feeLabel:   { ...Typography.titleLarge, color: 'rgba(255,255,255,.85)', marginTop: Spacing[1] },
    feeRole:    { ...Typography.bodyMedium, color: 'rgba(255,255,255,.65)', marginTop: Spacing[1] },

    section:      { marginBottom: Spacing[5] },
    sectionTitle: { ...Typography.titleLarge, color: C.textPrimary, marginBottom: Spacing[4] },
    benefitsList: { gap: Spacing[3] },
    benefitItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
    benefitDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green[700], marginTop: 6, flexShrink: 0 },
    benefitText:  { ...Typography.bodyMedium, color: C.textSecondary, flex: 1, lineHeight: 22 },

    feeNote:      { backgroundColor: C.green[50], borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[5], borderWidth: 1, borderColor: C.green[200] },
    feeNoteTitle: { ...Typography.titleMedium, color: C.green[800], marginBottom: Spacing[3] },
    feeNoteText:  { ...Typography.bodySmall, color: C.green[700], lineHeight: 22, marginBottom: Spacing[2] },

    secureRow:  { alignItems: 'center', marginBottom: Spacing[5] },
    secureText: { ...Typography.caption, color: C.textMuted, textAlign: 'center', lineHeight: 18 },

    payBtn:      { marginBottom: Spacing[3] },
    skipBtn:     { alignItems: 'center', paddingVertical: Spacing[3], marginBottom: Spacing[4] },
    skipText:    { ...Typography.bodySmall, color: C.textMuted },
    supportText: { ...Typography.caption, color: C.textMuted, textAlign: 'center' },
    supportLink: { color: C.green[600], fontWeight: '700' },

    doneIcon:  { fontSize: 64, marginBottom: Spacing[4] },
    doneTitle: { ...Typography.headingLarge, color: C.textPrimary, textAlign: 'center', marginBottom: Spacing[2] },
    doneSub:   { ...Typography.bodyLarge, color: C.textMuted, textAlign: 'center', marginBottom: Spacing[8], lineHeight: 24 },
    doneBtn:   { width: '100%' },
  });
}
