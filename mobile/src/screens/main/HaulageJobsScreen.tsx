import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Linking, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Badge, LoadingState, EmptyState } from '@components/ui';
import { haulageApi } from '@services/api';
import { useAuthStore } from '@store/authStore';

/* ── Status badge config ── */
const STATUS_CFG: Record<string, { label: string; variant: any }> = {
  CONFIRMED:        { label: 'Awaiting Pickup', variant: 'warning' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', variant: 'info' },
  PICKED_UP:        { label: 'Picked Up',        variant: 'info' },
  IN_TRANSIT:       { label: 'In Transit',        variant: 'info' },
};

/* ── Urgency helper ── */
function urgencyLabel(createdAt: string) {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 36e5;
  if (hours < 6)  return { label: '🔥 New',    color: Colors.error };
  if (hours < 24) return { label: '⚡ Today',  color: Colors.warning };
  return            { label: '📋 Open',        color: Colors.green[600] };
}

/* ── Nigerian states for filter ── */
const STATES = [
  'All States','Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa',
  'Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu',
  'FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi',
  'Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo',
  'Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

export function HaulageJobsScreen() {
  const insets       = useSafeAreaInsets();
  const { user }     = useAuthStore();
  const queryClient  = useQueryClient();
  const [stateFilter, setStateFilter] = useState('All States');
  const [showFilter,  setShowFilter]  = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['haulage-jobs', stateFilter],
    queryFn:  () => haulageApi.getJobs({
      state: stateFilter === 'All States' ? undefined : stateFilter,
    }).then(r => r.data),
    retry: 0,
  });

  const applyMutation = useMutation({
    mutationFn: (orderId: string) => haulageApi.applyForJob(orderId).then(r => r.data),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['haulage-jobs'] });
      Alert.alert(
        '✅ Application Sent!',
        'The seller has been notified of your interest. They will contact you to arrange pickup.',
      );
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not apply for this job. Please try again.');
    },
  });

  const handleApply = (job: any) => {
    Alert.alert(
      'Apply for Delivery Job',
      `Route: ${job.sellerState ?? '?'} → ${job.deliveryState ?? '?'}\nCargo: ${job.cargoSummary}\n\nYour contact details will be shared with the seller.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Now',
          onPress: () => applyMutation.mutate(job.id),
        },
      ],
    );
  };

  const handleWhatsApp = (phone: string, jobRef: string) => {
    const msg = encodeURIComponent(
      `Hello, I'm a haulage partner on DG-LETS Agri Market. I'm interested in your delivery job for order #${jobRef}. Please let me know if it's still available.`,
    );
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g,'')}?text=${msg}`).catch(() =>
      Alert.alert('Error', 'Could not open WhatsApp.'),
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const jobs = data ?? [];

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Delivery Jobs</Text>
            <Text style={styles.headerSub}>
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
              {stateFilter !== 'All States' ? ` · ${stateFilter}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilter(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterBtnText}>📍 {stateFilter === 'All States' ? 'Filter' : stateFilter}</Text>
          </TouchableOpacity>
        </View>

        {/* ── State filter pills ── */}
        {showFilter && (
          <FlatList
            horizontal
            data={STATES}
            keyExtractor={s => s}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterPill, stateFilter === item && styles.filterPillActive]}
                onPress={() => { setStateFilter(item); setShowFilter(false); }}
              >
                <Text style={[styles.filterPillText, stateFilter === item && styles.filterPillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* ── Info banner ── */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          🚛 Showing orders that need delivery. Apply for jobs in your coverage area.
        </Text>
      </View>

      {/* ── Job list ── */}
      {isLoading ? (
        <LoadingState message="Finding delivery jobs…" />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="🚛"
          title="No jobs right now"
          description={
            stateFilter !== 'All States'
              ? `No delivery jobs in ${stateFilter} at the moment. Try 'All States' to see more.`
              : 'No delivery jobs available right now. Check back soon!'
          }
        />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green[700]} />
          }
          renderItem={({ item: job }) => {
            const statusCfg = STATUS_CFG[job.status] ?? { label: job.status, variant: 'gray' };
            const urgency   = urgencyLabel(job.createdAt);
            const alreadyApplied = job.haulageApplications?.some(
              (a: any) => a.applicantId === user?.id,
            );

            return (
              <View style={styles.jobCard}>
                {/* Top row */}
                <View style={styles.jobTop}>
                  <View style={styles.jobTopLeft}>
                    <Text style={styles.jobRef}>#{job.orderNumber}</Text>
                    <View style={styles.jobBadges}>
                      <Badge label={statusCfg.label} variant={statusCfg.variant} size="sm" />
                      <View style={[styles.urgencyBadge, { borderColor: urgency.color }]}>
                        <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.jobDate}>
                    {new Date(job.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>

                {/* Route */}
                <View style={styles.routeRow}>
                  <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: Colors.green[600] }]} />
                    <View>
                      <Text style={styles.routeLabel}>Pickup</Text>
                      <Text style={styles.routeLocation}>
                        {job.sellerState ?? '—'}{job.sellerLga ? `, ${job.sellerLga}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.routeArrow}><Text style={styles.routeArrowText}>↓</Text></View>
                  <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: Colors.error }]} />
                    <View>
                      <Text style={styles.routeLabel}>Delivery</Text>
                      <Text style={styles.routeLocation}>
                        {job.deliveryState ?? '—'}{job.deliveryAddress ? `, ${job.deliveryAddress.split(',')[0]}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Cargo summary */}
                <View style={styles.cargoRow}>
                  <View style={styles.cargoItem}>
                    <Text style={styles.cargoLabel}>Cargo</Text>
                    <Text style={styles.cargoValue} numberOfLines={1}>{job.cargoSummary}</Text>
                  </View>
                  <View style={styles.cargoItem}>
                    <Text style={styles.cargoLabel}>Weight</Text>
                    <Text style={styles.cargoValue}>{job.totalWeight ? `~${job.totalWeight.toFixed(0)} kg` : 'Ask seller'}</Text>
                  </View>
                  <View style={styles.cargoItem}>
                    <Text style={styles.cargoLabel}>Delivery Fee</Text>
                    <Text style={[styles.cargoValue, styles.cargoFee]}>
                      {job.deliveryFee > 0 ? `₦${job.deliveryFee.toLocaleString()}` : 'Negotiable'}
                    </Text>
                  </View>
                </View>

                {/* Applicants count */}
                {job.applicationCount > 0 && (
                  <Text style={styles.applicantsText}>
                    {job.applicationCount} haulage partner{job.applicationCount > 1 ? 's' : ''} applied
                  </Text>
                )}

                {/* Actions */}
                <View style={styles.jobActions}>
                  {job.sellerPhone && (
                    <TouchableOpacity
                      style={styles.waBtn}
                      onPress={() => handleWhatsApp(job.sellerPhone, job.orderNumber)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.waBtnText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.applyBtn,
                      alreadyApplied && styles.applyBtnDone,
                      applyMutation.isPending && styles.applyBtnLoading,
                    ]}
                    onPress={() => !alreadyApplied && handleApply(job)}
                    activeOpacity={alreadyApplied ? 1 : 0.8}
                    disabled={alreadyApplied || applyMutation.isPending}
                  >
                    <Text style={styles.applyBtnText}>
                      {alreadyApplied ? '✓ Applied' : applyMutation.isPending ? 'Applying…' : '🚛 Apply for Job'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header:      { backgroundColor: Colors.white, paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  headerSub:   { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  filterBtn:   { backgroundColor: Colors.green[50], borderWidth: 1, borderColor: Colors.green[200], borderRadius: Radius.lg, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  filterBtnText: { ...Typography.labelLarge, color: Colors.green[700] },
  filterList:  { paddingVertical: Spacing[3], gap: Spacing[2] },
  filterPill:  { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], backgroundColor: Colors.gray[100], borderRadius: 50, borderWidth: 1, borderColor: Colors.border },
  filterPillActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[700] },
  filterPillText:     { ...Typography.caption, color: Colors.textSecondary },
  filterPillTextActive: { color: Colors.white, fontWeight: '700' },

  /* Info banner */
  infoBanner:     { backgroundColor: Colors.green[50], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.green[100] },
  infoBannerText: { ...Typography.bodySmall, color: Colors.green[700], lineHeight: 18 },

  /* List */
  list: { padding: Spacing[4], gap: Spacing[4] },

  /* Job card */
  jobCard:  { backgroundColor: Colors.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing[4], ...Shadow.sm },
  jobTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[4] },
  jobTopLeft: { gap: Spacing[2] },
  jobRef:   { ...Typography.titleLarge, color: Colors.textPrimary },
  jobBadges:{ flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
  jobDate:  { ...Typography.bodySmall, color: Colors.textMuted },

  urgencyBadge: { borderWidth: 1, borderRadius: 50, paddingHorizontal: Spacing[2], paddingVertical: 2 },
  urgencyText:  { fontSize: 11, fontWeight: '700' },

  /* Route */
  routeRow:      { backgroundColor: Colors.gray[50], borderRadius: Radius.lg, padding: Spacing[3], marginBottom: Spacing[3], gap: Spacing[2] },
  routePoint:    { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  routeDot:      { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  routeLabel:    { ...Typography.caption, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeLocation: { ...Typography.titleMedium, color: Colors.textPrimary },
  routeArrow:    { paddingLeft: Spacing[1] },
  routeArrowText:{ fontSize: 16, color: Colors.gray[400] },

  /* Cargo */
  cargoRow:   { flexDirection: 'row', marginBottom: Spacing[3], gap: Spacing[2] },
  cargoItem:  { flex: 1 },
  cargoLabel: { ...Typography.caption, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  cargoValue: { ...Typography.titleMedium, color: Colors.textPrimary },
  cargoFee:   { color: Colors.green[700] },

  /* Applicants */
  applicantsText: { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing[3] },

  /* Actions */
  jobActions:    { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[1] },
  waBtn:         { flex: 1, backgroundColor: '#e8faf0', borderWidth: 1, borderColor: '#25d36640', borderRadius: Radius.lg, paddingVertical: Spacing[3], alignItems: 'center' },
  waBtnText:     { ...Typography.labelLarge, color: '#128c7e' },
  applyBtn:      { flex: 2, backgroundColor: Colors.green[700], borderRadius: Radius.lg, paddingVertical: Spacing[3], alignItems: 'center' },
  applyBtnDone:  { backgroundColor: Colors.green[50], borderWidth: 1, borderColor: Colors.green[200] },
  applyBtnLoading: { opacity: 0.7 },
  applyBtnText:  { ...Typography.labelLarge, color: Colors.white, fontWeight: '700' },
});
