import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Linking, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Badge, LoadingState, EmptyState } from '@components/ui';
import { haulageApi } from '@services/api';
import { useAuthStore } from '@store/authStore';

/* â”€â”€ Status badge config â”€â”€ */
const STATUS_CFG: Record<string, { label: string; variant: any }> = {
  CONFIRMED:        { label: 'Awaiting Pickup', variant: 'warning' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', variant: 'info' },
  PICKED_UP:        { label: 'Picked Up',        variant: 'info' },
  IN_TRANSIT:       { label: 'In Transit',        variant: 'info' },
};

/* â”€â”€ Urgency helper â”€â”€ */
function urgencyLabel(createdAt: string) {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 36e5;
  if (hours < 6)  return { label: 'ðŸ”¥ New',    color: '#ef4444' };
  if (hours < 24) return { label: 'âš¡ Today',  color: '#f59e0b' };
  return            { label: 'ðŸ“‹ Open',        color: '#16a34a' };
}

/* â”€â”€ Nigerian states for filter â”€â”€ */
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
        'âœ… Application Sent!',
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
      `Route: ${job.sellerState ?? '?'} â†’ ${job.deliveryState ?? '?'}\nCargo: ${job.cargoSummary}\n\nYour contact details will be shared with the seller.`,
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

  const C = useThemeColors();
  const s = makeStyles(C);
  return (
    <View style={[s.flex, { paddingTop: insets.top }]}>

      {/* â”€â”€ Header â”€â”€ */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Delivery Jobs</Text>
            <Text style={s.headerSub}>
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
              {stateFilter !== 'All States' ? ` Â· ${stateFilter}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={s.filterBtn}
            onPress={() => setShowFilter(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={s.filterBtnText}>ðŸ“ {stateFilter === 'All States' ? 'Filter' : stateFilter}</Text>
          </TouchableOpacity>
        </View>

        {/* â”€â”€ State filter pills â”€â”€ */}
        {showFilter && (
          <FlatList
            horizontal
            data={STATES}
            keyExtractor={s => s}
            showsHorizontalScrollIndicator={false}
            contentContainerstyle={s.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.filterPill, stateFilter === item && s.filterPillActive]}
                onPress={() => { setStateFilter(item); setShowFilter(false); }}
              >
                <Text style={[s.filterPillText, stateFilter === item && s.filterPillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* â”€â”€ Info banner â”€â”€ */}
      <View style={s.infoBanner}>
        <Text style={s.infoBannerText}>
          ðŸš› Showing orders that need delivery. Apply for jobs in your coverage area.
        </Text>
      </View>

      {/* â”€â”€ Job list â”€â”€ */}
      {isLoading ? (
        <LoadingState message="Finding delivery jobsâ€¦" />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="ðŸš›"
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
          contentContainerstyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green[700]} />
          }
          renderItem={({ item: job }) => {
            const statusCfg = STATUS_CFG[job.status] ?? { label: job.status, variant: 'gray' };
            const urgency   = urgencyLabel(job.createdAt);
            const alreadyApplied = job.haulageApplications?.some(
              (a: any) => a.applicantId === user?.id,
            );

            return (
              <View style={s.jobCard}>
                {/* Top row */}
                <View style={s.jobTop}>
                  <View style={s.jobTopLeft}>
                    <Text style={s.jobRef}>#{job.orderNumber}</Text>
                    <View style={s.jobBadges}>
                      <Badge label={statusCfg.label} variant={statusCfg.variant} size="sm" />
                      <View style={[s.urgencyBadge, { borderColor: urgency.color }]}>
                        <Text style={[s.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={s.jobDate}>
                    {new Date(job.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>

                {/* Route */}
                <View style={s.routeRow}>
                  <View style={s.routePoint}>
                    <View style={[s.routeDot, { backgroundcolor: '#16a34a' }]} />
                    <View>
                      <Text style={s.routeLabel}>Pickup</Text>
                      <Text style={s.routeLocation}>
                        {job.sellerState ?? 'â€”'}{job.sellerLga ? `, ${job.sellerLga}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={s.routeArrow}><Text style={s.routeArrowText}>â†“</Text></View>
                  <View style={s.routePoint}>
                    <View style={[s.routeDot, { backgroundcolor: '#ef4444' }]} />
                    <View>
                      <Text style={s.routeLabel}>Delivery</Text>
                      <Text style={s.routeLocation}>
                        {job.deliveryState ?? 'â€”'}{job.deliveryAddress ? `, ${job.deliveryAddress.split(',')[0]}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Cargo summary */}
                <View style={s.cargoRow}>
                  <View style={s.cargoItem}>
                    <Text style={s.cargoLabel}>Cargo</Text>
                    <Text style={s.cargoValue} numberOfLines={1}>{job.cargoSummary}</Text>
                  </View>
                  <View style={s.cargoItem}>
                    <Text style={s.cargoLabel}>Weight</Text>
                    <Text style={s.cargoValue}>{job.totalWeight ? `~${job.totalWeight.toFixed(0)} kg` : 'Ask seller'}</Text>
                  </View>
                  <View style={s.cargoItem}>
                    <Text style={s.cargoLabel}>Delivery Fee</Text>
                    <Text style={[s.cargoValue, s.cargoFee]}>
                      {job.deliveryFee > 0 ? `â‚¦${job.deliveryFee.toLocaleString()}` : 'Negotiable'}
                    </Text>
                  </View>
                </View>

                {/* Applicants count */}
                {job.applicationCount > 0 && (
                  <Text style={s.applicantsText}>
                    {job.applicationCount} haulage partner{job.applicationCount > 1 ? 's' : ''} applied
                  </Text>
                )}

                {/* Actions */}
                <View style={s.jobActions}>
                  {job.sellerPhone && (
                    <TouchableOpacity
                      style={s.waBtn}
                      onPress={() => handleWhatsApp(job.sellerPhone, job.orderNumber)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.waBtnText}>ðŸ’¬ WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      s.applyBtn,
                      alreadyApplied && s.applyBtnDone,
                      applyMutation.isPending && s.applyBtnLoading,
                    ]}
                    onPress={() => !alreadyApplied && handleApply(job)}
                    activeOpacity={alreadyApplied ? 1 : 0.8}
                    disabled={alreadyApplied || applyMutation.isPending}
                  >
                    <Text style={s.applyBtnText}>
                      {alreadyApplied ? 'âœ“ Applied' : applyMutation.isPending ? 'Applyingâ€¦' : 'ðŸš› Apply for Job'}
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

function makeStyles(C: any) { return StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.background },

  /* Header */
  header:      { backgroundColor: C.white, paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[3], borderBottomWidth: 1, borderBottomColor: C.border },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { ...Typography.headingMedium, color: C.textPrimary },
  headerSub:   { ...Typography.bodySmall, color: C.textMuted, marginTop: 2 },
  filterBtn:   { backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderRadius: Radius.lg, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  filterBtnText: { ...Typography.labelLarge, color: C.green[700] },
  filterList:  { paddingVertical: Spacing[3], gap: Spacing[2] },
  filterPill:  { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], backgroundColor: C.gray[100], borderRadius: 50, borderWidth: 1, borderColor: C.border },
  filterPillActive: { backgroundColor: C.green[700], borderColor: C.green[700] },
  filterPillText:     { ...Typography.caption, color: C.textSecondary },
  filterPillTextActive: { color: C.white, fontWeight: '700' },

  /* Info banner */
  infoBanner:     { backgroundColor: C.green[50], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: C.green[100] },
  infoBannerText: { ...Typography.bodySmall, color: C.green[700], lineHeight: 18 },

  /* List */
  list: { padding: Spacing[4], gap: Spacing[4] },

  /* Job card */
  jobCard:  { backgroundColor: C.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: C.border, padding: Spacing[4], ...Shadow.sm },
  jobTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[4] },
  jobTopLeft: { gap: Spacing[2] },
  jobRef:   { ...Typography.titleLarge, color: C.textPrimary },
  jobBadges:{ flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
  jobDate:  { ...Typography.bodySmall, color: C.textMuted },

  urgencyBadge: { borderWidth: 1, borderRadius: 50, paddingHorizontal: Spacing[2], paddingVertical: 2 },
  urgencyText:  { fontSize: 11, fontWeight: '700' },

  /* Route */
  routeRow:      { backgroundColor: C.gray[50], borderRadius: Radius.lg, padding: Spacing[3], marginBottom: Spacing[3], gap: Spacing[2] },
  routePoint:    { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  routeDot:      { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  routeLabel:    { ...Typography.caption, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeLocation: { ...Typography.titleMedium, color: C.textPrimary },
  routeArrow:    { paddingLeft: Spacing[1] },
  routeArrowText:{ fontSize: 16, color: C.gray[400] },

  /* Cargo */
  cargoRow:   { flexDirection: 'row', marginBottom: Spacing[3], gap: Spacing[2] },
  cargoItem:  { flex: 1 },
  cargoLabel: { ...Typography.caption, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  cargoValue: { ...Typography.titleMedium, color: C.textPrimary },
  cargoFee:   { color: C.green[700] },

  /* Applicants */
  applicantsText: { ...Typography.bodySmall, color: C.textMuted, marginBottom: Spacing[3] },

  /* Actions */
  jobActions:    { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[1] },
  waBtn:         { flex: 1, backgroundColor: '#e8faf0', borderWidth: 1, borderColor: '#25d36640', borderRadius: Radius.lg, paddingVertical: Spacing[3], alignItems: 'center' },
  waBtnText:     { ...Typography.labelLarge, color: '#128c7e' },
  applyBtn:      { flex: 2, backgroundColor: C.green[700], borderRadius: Radius.lg, paddingVertical: Spacing[3], alignItems: 'center' },
  applyBtnDone:  { backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200] },
  applyBtnLoading: { opacity: 0.7 },
  applyBtnText:  { ...Typography.labelLarge, color: C.white, fontWeight: '700' },
});
}

