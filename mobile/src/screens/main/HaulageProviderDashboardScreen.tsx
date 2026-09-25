import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Badge, LoadingState } from '@components/ui';
import { haulageApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'HaulageProviderDashboard'>;
};

const JOB_STATUS: Record<string, { label: string; variant: any; emoji: string }> = {
  OPEN:       { label: 'Open',       variant: 'warning', emoji: '📋' },
  AWARDED:    { label: 'Awarded',    variant: 'info',    emoji: '🚛' },
  IN_TRANSIT: { label: 'In Transit', variant: 'info',    emoji: '🚚' },
  DELIVERED:  { label: 'Delivered',  variant: 'success', emoji: '✅' },
  CANCELLED:  { label: 'Cancelled',  variant: 'error',   emoji: '❌' },
};

export function HaulageProviderDashboardScreen({ navigation }: Props) {
  const insets      = useSafeAreaInsets();
  const C           = useThemeColors();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();

  const { data: activeData, isLoading: activeLoading, refetch: refetchActive, isRefetching } = useQuery({
    queryKey: ['haulage-active-jobs'],
    queryFn:  () => haulageApi.getMyActiveJobs().then(r => r.data),
    retry: 0,
  });

  const { data: appsData, isLoading: appsLoading, refetch: refetchApps } = useQuery({
    queryKey: ['haulage-my-applications'],
    queryFn:  () => haulageApi.getMyApplications().then(r => r.data),
    retry: 0,
  });

  const completeMutation = useMutation({
    mutationFn: (jobId: string) => haulageApi.completeJob(jobId).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['haulage-active-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['haulage-my-applications'] });
      Alert.alert('✅ Job Completed', 'Delivery confirmed. Your commission has been calculated.');
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Could not complete job.'),
  });

  const onRefresh = async () => { await Promise.all([refetchActive(), refetchApps()]); };

  if (activeLoading || appsLoading) return <LoadingState fullScreen message="Loading dashboard…" />;

  const activeJobs   = (activeData  ?? []) as any[];
  const applications = (appsData    ?? []) as any[];

  const completedApps = applications.filter((a: any) => a.status === 'ACCEPTED');
  const pendingApps   = applications.filter((a: any) => a.status === 'PENDING');

  const estimatedEarnings = completedApps.reduce((sum: number, a: any) => {
    return sum + (a.job?.agreedFee ?? a.job?.offeredFee ?? 0) * 0.95;
  }, 0);

  const s = makeStyles(C);

  const handleWhatsApp = (phone: string, orderNum: string) => {
    const msg = encodeURIComponent(`Hello, I'm your assigned haulage partner on DG-LETS for order #${orderNum}. Ready to coordinate pickup.`);
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`).catch(() => Alert.alert('Error', 'Could not open WhatsApp.'));
  };

  const handleComplete = (jobId: string, orderNum: string) => {
    Alert.alert('✅ Confirm Delivery', `Mark job for order #${orderNum} as DELIVERED?\n\nMake sure the buyer has received the goods.`, [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Confirm Delivered', onPress: () => completeMutation.mutate(jobId) },
    ]);
  };

  return (
    <View style={[s.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Dashboard</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: Spacing[12] }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={C.green[700]} />}>

        {/* Greeting */}
        <View style={s.greeting}>
          <Text style={s.greetingText}>Hello, {user?.firstName} 🚛</Text>
          <Text style={s.greetingRole}>Haulage Partner</Text>
        </View>

        {/* Stats grid */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Overview</Text>
          <View style={s.statsGrid}>
            {[
              { emoji: '⚡', label: 'Active Jobs',   value: activeJobs.length.toString(),   color: C.green[600] },
              { emoji: '📝', label: 'Applied',        value: applications.length.toString(), color: C.info },
              { emoji: '⏳', label: 'Pending Reply',  value: pendingApps.length.toString(),  color: C.warning },
              { emoji: '✅', label: 'Accepted',        value: completedApps.length.toString(),color: C.success },
            ].map(item => (
              <View key={item.label} style={[s.statCard, { borderTopColor: item.color, borderTopWidth: 3 }]}>
                <Text style={s.statEmoji}>{item.emoji}</Text>
                <Text style={s.statValue}>{item.value}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Earnings */}
        <View style={s.section}>
          <View style={s.earningsCard}>
            <View>
              <Text style={s.earningsLabel}>Estimated Earnings</Text>
              <Text style={s.earningsAmount}>₦{estimatedEarnings.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</Text>
              <Text style={s.earningsSub}>After 5% commission · {completedApps.length} job{completedApps.length !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={s.earningsIcon}>💰</Text>
          </View>
        </View>

        {/* Active Jobs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Active Jobs</Text>
          {activeJobs.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>🚛</Text>
              <Text style={s.emptyText}>No active jobs right now.</Text>
              <Text style={s.emptySubText}>Browse the Jobs tab to find deliveries in your area.</Text>
            </View>
          ) : (
            activeJobs.map((job: any) => {
              const cfg    = JOB_STATUS[job.status] ?? { label: job.status, variant: 'gray', emoji: '📋' };
              const seller = job.order?.seller;
              const buyer  = job.order?.buyer;
              return (
                <View key={job.id} style={s.jobCard}>
                  <View style={s.jobTop}>
                    <Text style={s.jobRef}>#{job.order?.orderNumber}</Text>
                    <Badge label={cfg.label} variant={cfg.variant} size="sm" />
                  </View>
                  <View style={s.routeRow}>
                    <View style={s.routePoint}>
                      <View style={[s.routeDot, { backgroundColor: C.green[600] }]} />
                      <Text style={s.routeText}>{job.pickupState ?? '—'}{job.pickupAddress ? `, ${job.pickupAddress}` : ''}</Text>
                    </View>
                    <Text style={s.routeArrow}>↓</Text>
                    <View style={s.routePoint}>
                      <View style={[s.routeDot, { backgroundColor: C.error }]} />
                      <Text style={s.routeText}>{job.deliveryState ?? '—'}{job.deliveryAddress ? `, ${job.deliveryAddress.split(',')[0]}` : ''}</Text>
                    </View>
                  </View>
                  <View style={s.cargoRow}>
                    <View style={s.cargoItem}><Text style={s.cargoLabel}>Cargo</Text><Text style={s.cargoValue} numberOfLines={1}>{job.cargoSummary ?? 'Produce'}</Text></View>
                    <View style={s.cargoItem}><Text style={s.cargoLabel}>Agreed Fee</Text><Text style={[s.cargoValue, { color: C.green[700] }]}>{job.agreedFee ? `₦${job.agreedFee.toLocaleString()}` : 'TBD'}</Text></View>
                    <View style={s.cargoItem}><Text style={s.cargoLabel}>Your Payout</Text><Text style={[s.cargoValue, { color: C.green[700], fontWeight: '700' }]}>{job.agreedFee ? `₦${(job.agreedFee * 0.95).toLocaleString('en-NG', { maximumFractionDigits: 0 })}` : '—'}</Text></View>
                  </View>
                  <View style={s.jobActions}>
                    {seller?.phone && <TouchableOpacity style={s.waBtn} onPress={() => handleWhatsApp(seller.phone, job.order?.orderNumber)}><Text style={s.waBtnText}>💬 Seller</Text></TouchableOpacity>}
                    {buyer?.phone  && <TouchableOpacity style={s.waBtn} onPress={() => handleWhatsApp(buyer.phone,  job.order?.orderNumber)}><Text style={s.waBtnText}>💬 Buyer</Text></TouchableOpacity>}
                    {['AWARDED','IN_TRANSIT'].includes(job.status) && (
                      <TouchableOpacity style={[s.doneBtn, completeMutation.isPending && { opacity: 0.6 }]}
                        onPress={() => handleComplete(job.id, job.order?.orderNumber)} disabled={completeMutation.isPending}>
                        <Text style={s.doneBtnText}>{completeMutation.isPending ? 'Confirming…' : '✅ Mark Delivered'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Application History */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Application History</Text>
          {applications.length === 0 ? (
            <View style={s.emptyCard}><Text style={s.emptyText}>No applications yet.</Text></View>
          ) : (
            applications.slice(0, 10).map((app: any) => {
              const statusMap: Record<string, { label: string; variant: any }> = {
                PENDING:   { label: 'Awaiting Reply', variant: 'warning' },
                ACCEPTED:  { label: 'Accepted',       variant: 'success' },
                REJECTED:  { label: 'Not Selected',   variant: 'error'   },
                WITHDRAWN: { label: 'Withdrawn',      variant: 'gray'    },
              };
              const sc = statusMap[app.status] ?? { label: app.status, variant: 'gray' };
              return (
                <View key={app.id} style={s.appRow}>
                  <View style={s.appLeft}>
                    <Text style={s.appRef}>#{app.job?.order?.orderNumber ?? '—'}</Text>
                    <Text style={s.appRoute}>{app.job?.pickupState ?? '?'} → {app.job?.deliveryState ?? '?'}</Text>
                    <Text style={s.appDate}>Applied {new Date(app.appliedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                  <Badge label={sc.label} variant={sc.variant} size="sm" />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:         { flex: 1, backgroundColor: C.background },
    header:       { backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn:      { width: 40 },
    backText:     { fontSize: 22, color: C.textSecondary },
    headerTitle:  { ...Typography.titleLarge, color: C.textPrimary, flex: 1, textAlign: 'center' },
    greeting:     { backgroundColor: C.green[700], padding: Spacing[5] },
    greetingText: { ...Typography.headingSmall, color: '#ffffff' },
    greetingRole: { ...Typography.bodySmall, color: 'rgba(255,255,255,.7)', marginTop: 2 },
    section:      { padding: Spacing[5] },
    sectionTitle: { ...Typography.titleLarge, color: C.textPrimary, marginBottom: Spacing[4] },
    statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
    statCard:     { flex: 1, backgroundColor: C.white, borderRadius: Radius.xl, padding: Spacing[4], alignItems: 'center', borderWidth: 1, borderColor: C.border, ...Shadow.sm },
    statEmoji:    { fontSize: 24, marginBottom: Spacing[2] },
    statValue:    { ...Typography.headingMedium, color: C.textPrimary },
    statLabel:    { ...Typography.caption, color: C.textMuted, textAlign: 'center', marginTop: 2 },
    earningsCard:   { backgroundColor: C.green[700], borderRadius: Radius.xl, padding: Spacing[5], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    earningsLabel:  { ...Typography.bodySmall, color: 'rgba(255,255,255,.7)' },
    earningsAmount: { ...Typography.headingMedium, color: '#ffffff', marginTop: 2 },
    earningsSub:    { ...Typography.caption, color: 'rgba(255,255,255,.6)', marginTop: 4 },
    earningsIcon:   { fontSize: 40 },
    emptyCard:    { backgroundColor: C.white, borderRadius: Radius.xl, padding: Spacing[8], alignItems: 'center', borderWidth: 1, borderColor: C.border },
    emptyIcon:    { fontSize: 36, marginBottom: Spacing[3] },
    emptyText:    { ...Typography.titleMedium, color: C.textMuted },
    emptySubText: { ...Typography.bodySmall, color: C.textMuted, marginTop: Spacing[2], textAlign: 'center' },
    jobCard:    { backgroundColor: C.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: C.border, padding: Spacing[4], marginBottom: Spacing[3], ...Shadow.sm },
    jobTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
    jobRef:     { ...Typography.titleLarge, color: C.textPrimary },
    routeRow:   { backgroundColor: C.gray[50], borderRadius: Radius.lg, padding: Spacing[3], marginBottom: Spacing[3], gap: Spacing[2] },
    routePoint: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    routeDot:   { width: 10, height: 10, borderRadius: 5 },
    routeText:  { ...Typography.titleMedium, color: C.textPrimary, flex: 1 },
    routeArrow: { paddingLeft: Spacing[1], fontSize: 14, color: C.gray[400] },
    cargoRow:   { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[3] },
    cargoItem:  { flex: 1 },
    cargoLabel: { ...Typography.caption, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
    cargoValue: { ...Typography.titleMedium, color: C.textPrimary },
    jobActions: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
    waBtn:      { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], backgroundColor: '#e8faf0', borderRadius: Radius.lg, borderWidth: 1, borderColor: '#25d36640' },
    waBtnText:  { ...Typography.labelLarge, color: '#128c7e' },
    doneBtn:    { flex: 1, backgroundColor: C.green[700], borderRadius: Radius.lg, paddingVertical: Spacing[3], alignItems: 'center' },
    doneBtnText:{ ...Typography.labelLarge, color: '#ffffff', fontWeight: '700' },
    appRow:    { backgroundColor: C.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: Spacing[4], marginBottom: Spacing[3], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    appLeft:   { flex: 1, gap: Spacing[1] },
    appRef:    { ...Typography.titleMedium, color: C.textPrimary },
    appRoute:  { ...Typography.bodySmall, color: C.textSecondary },
    appDate:   { ...Typography.caption, color: C.textMuted },
  });
}
