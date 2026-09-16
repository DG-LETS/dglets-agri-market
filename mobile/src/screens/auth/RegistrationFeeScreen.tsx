import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, Linking, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Button, LoadingState } from '@components/ui';
import { feesApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'RegistrationFee'> };

const ROLE_LABELS: Record<string, string> = {
  FARMER:     'Farmer',
  TRADER:     'Trader',
  AGGREGATOR: 'Aggregator',
  PROCESSOR:  'Processor',
  EXPORTER:   'Exporter',
  HAULAGE:    'Haulage Partner',
};

const ROLE_BENEFITS: Record<string, string[]> = {
  FARMER:     ['List your produce to thousands of buyers', 'Receive orders directly', 'Access market prices', 'Build your seller reputation'],
  TRADER:     ['Access verified farmers and bulk produce', 'Manage buy/sell operations', 'Build trade reputation'],
  AGGREGATOR: ['Aggregate produce from multiple farmers', 'Connect with large buyers and exporters'],
  PROCESSOR:  ['Source raw materials directly from farmers', 'List processed products on the marketplace'],
  EXPORTER:   ['Access export-grade produce', 'Connect with international buyers'],
  HAULAGE:    ['Access delivery jobs across Nigeria', 'Get hired by verified sellers', 'Build logistics reputation', 'Earn per delivery after platform commission'],
};

export function RegistrationFeeScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [paying,  setPaying]  = useState(false);

  /* Check fee status from backend */
  const { data: feeStatus, isLoading, refetch } = useQuery({
    queryKey: ['registration-fee-status'],
    queryFn:  () => feesApi.getRegistrationStatus().then(r => r.data),
    retry:    0,
  });

  /* Initiate Paystack payment */
  const payMutation = useMutation({
    mutationFn: () => feesApi.initRegistrationPayment().then(r => r.data),
    onSuccess: async (data) => {
      const url = data?.authorization_url as string | undefined;
      if (!url) {
        Alert.alert('Error', 'Could not get payment link. Please try again.');
        return;
      }
      /* Open Paystack checkout */
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        /* After returning from browser, refresh fee status */
        setTimeout(() => { refetch(); setPaying(false); }, 2000);
      } else {
        Alert.alert('Cannot Open', 'Unable to open the payment page. Please try again.');
      }
    },
    onError: (e: any) => {
      Alert.alert('Payment Error', e?.response?.data?.message ?? 'Could not start payment. Please try again.');
      setPaying(false);
    },
  });

  const handlePay = () => {
    Alert.alert(
      'Activate Your Account',
      `Pay ₦${feeStatus?.amount?.toLocaleString() ?? '...'} to activate your ${ROLE_LABELS[user?.role ?? ''] ?? ''} account on DG-LETS Agri Market.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay with Paystack',
          onPress: () => { setPaying(true); payMutation.mutate(); },
        },
      ],
    );
  };

  const handleSkip = () => {
    /* Let them into the app — they can pay later. Fee status shown on profile. */
    Alert.alert(
      'Pay Later?',
      'You can use the app but your account will be in limited mode until the activation fee is paid. You can pay anytime from your Profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue Anyway', onPress: () => navigation.replace('Login') },
      ],
    );
  };

  if (isLoading) return <LoadingState fullScreen message="Checking account status…" />;

  /* If no fee required or already paid — go straight to app */
  if (!feeStatus?.required || feeStatus?.paid) {
    return (
      <View style={[styles.flex, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.doneIcon}>🎉</Text>
        <Text style={styles.doneTitle}>Account Activated!</Text>
        <Text style={styles.doneSub}>
          Your account is active. Welcome to DG-LETS Agri Market!
        </Text>
        <Button
          title="Enter the Marketplace →"
          onPress={() => navigation.replace('Login')}
          size="lg"
          style={styles.doneBtn}
        />
      </View>
    );
  }

  const role     = user?.role ?? 'FARMER';
  const benefits = ROLE_BENEFITS[role] ?? [];

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing[4], paddingBottom: insets.bottom + Spacing[10] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotDone]}><Text style={styles.progressCheck}>✓</Text></View>
          <Text style={styles.progressLabel}>Account</Text>
        </View>
        <View style={[styles.progressLine, styles.progressLineDone]} />
        {role === 'HAULAGE' && (
          <>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotDone]}><Text style={styles.progressCheck}>✓</Text></View>
              <Text style={styles.progressLabel}>Profile</Text>
            </View>
            <View style={[styles.progressLine, styles.progressLineDone]} />
          </>
        )}
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <Text style={[styles.progressLabel, { color: Colors.green[700], fontWeight: '700' }]}>Activation</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.feeAmount}>₦{feeStatus?.amount?.toLocaleString()}</Text>
        <Text style={styles.feeLabel}>One-time Activation Fee</Text>
        <Text style={styles.feeRole}>{ROLE_LABELS[role]} Account</Text>
      </View>

      {/* What you get */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What you get with your activated account:</Text>
        <View style={styles.benefitsList}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
          <View style={styles.benefitItem}>
            <View style={styles.benefitDot} />
            <Text style={styles.benefitText}>Verified account badge on your profile</Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.benefitDot} />
            <Text style={styles.benefitText}>Priority listing in search results</Text>
          </View>
        </View>
      </View>

      {/* Platform fee note */}
      <View style={styles.feeNote}>
        <Text style={styles.feeNoteTitle}>💡 How DG-LETS fees work</Text>
        <Text style={styles.feeNoteText}>
          • <Text style={{ fontWeight: '700' }}>Registration fee (one-time):</Text> ₦{feeStatus?.amount?.toLocaleString()} — paid once to activate your account.
        </Text>
        <Text style={styles.feeNoteText}>
          • <Text style={{ fontWeight: '700' }}>Transaction fee:</Text> 2.05% deducted automatically from each completed order. No separate payment needed.
        </Text>
        {role === 'HAULAGE' && (
          <Text style={styles.feeNoteText}>
            • <Text style={{ fontWeight: '700' }}>Delivery commission:</Text> 5% of each delivery fee is deducted automatically when a job is completed.
          </Text>
        )}
        <Text style={styles.feeNoteText}>
          • Buyers pay no fees to register or transact.
        </Text>
      </View>

      {/* Security note */}
      <View style={styles.secureRow}>
        <Text style={styles.secureText}>🔒 Secure payment via Paystack. Your card details are never stored by DG-LETS.</Text>
      </View>

      {/* Pay button */}
      <Button
        title={paying || payMutation.isPending ? '⏳ Opening Paystack…' : `💳 Pay ₦${feeStatus?.amount?.toLocaleString()} & Activate`}
        onPress={handlePay}
        loading={paying || payMutation.isPending}
        size="lg"
        style={styles.payBtn}
      />

      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Pay later (limited access)</Text>
      </TouchableOpacity>

      <Text style={styles.supportText}>
        Questions? Chat with us on{' '}
        <Text
          style={styles.supportLink}
          onPress={() => Linking.openURL('https://wa.me/2348070566642?text=Hello%20DG-LETS%2C%20I%20need%20help%20with%20my%20registration%20fee.')}
        >
          WhatsApp
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.white },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing[8] },
  container: { paddingHorizontal: Spacing[5] },

  /* Progress */
  progressBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[7] },
  progressStep:     { alignItems: 'center', gap: Spacing[1] },
  progressDot:      { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.gray[200], borderWidth: 2, borderColor: Colors.gray[300], alignItems: 'center', justifyContent: 'center' },
  progressDotDone:  { backgroundColor: Colors.green[700], borderColor: Colors.green[700] },
  progressDotActive:{ backgroundColor: Colors.green[500], borderColor: Colors.green[700], width: 28, height: 28, borderRadius: 14 },
  progressCheck:    { fontSize: 11, color: Colors.white, fontWeight: '900' },
  progressLine:     { width: 48, height: 2, backgroundColor: Colors.gray[200], marginHorizontal: Spacing[2] },
  progressLineDone: { backgroundColor: Colors.green[700] },
  progressLabel:    { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },

  /* Fee header card */
  headerCard:  { backgroundColor: Colors.green[700], borderRadius: Radius.xl, padding: Spacing[6], alignItems: 'center', marginBottom: Spacing[6], ...Shadow.green },
  feeAmount:   { fontSize: 48, fontWeight: '900', color: Colors.white, letterSpacing: -1 },
  feeLabel:    { ...Typography.titleLarge, color: 'rgba(255,255,255,.85)', marginTop: Spacing[1] },
  feeRole:     { ...Typography.bodyMedium, color: 'rgba(255,255,255,.65)', marginTop: Spacing[1] },

  /* Benefits */
  section:        { marginBottom: Spacing[5] },
  sectionTitle:   { ...Typography.titleLarge, color: Colors.textPrimary, marginBottom: Spacing[4] },
  benefitsList:   { gap: Spacing[3] },
  benefitItem:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  benefitDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green[700], marginTop: 6, flexShrink: 0 },
  benefitText:    { ...Typography.bodyMedium, color: Colors.textSecondary, flex: 1, lineHeight: 22 },

  /* Fee note */
  feeNote:      { backgroundColor: Colors.green[50], borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[5], borderWidth: 1, borderColor: Colors.green[200] },
  feeNoteTitle: { ...Typography.titleMedium, color: Colors.green[800], marginBottom: Spacing[3] },
  feeNoteText:  { ...Typography.bodySmall, color: Colors.green[700], lineHeight: 22, marginBottom: Spacing[2] },

  /* Security */
  secureRow:  { alignItems: 'center', marginBottom: Spacing[5] },
  secureText: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

  /* Buttons */
  payBtn:   { marginBottom: Spacing[3] },
  skipBtn:  { alignItems: 'center', paddingVertical: Spacing[3], marginBottom: Spacing[4] },
  skipText: { ...Typography.bodySmall, color: Colors.textMuted },

  /* Support */
  supportText: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  supportLink: { color: Colors.green[600], fontWeight: '700' },

  /* Done state */
  doneIcon:  { fontSize: 64, marginBottom: Spacing[4] },
  doneTitle: { ...Typography.headingLarge, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing[2] },
  doneSub:   { ...Typography.bodyLarge, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing[8], lineHeight: 24 },
  doneBtn:   { width: '100%' },
});
