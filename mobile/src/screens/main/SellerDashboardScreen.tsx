import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Badge, LoadingState, EmptyState } from '@components/ui';
import { ordersApi, marketplaceApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '@navigation/MainNavigator';
import type { CompositeNavigationProp } from '@react-navigation/native';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'SellerDashboard'>;
};

function StatCard({ emoji, label, value, sub, color }: {
  emoji: string; label: string; value: string; sub?: string; color?: string;
}) {
  const s = makeStyles(C);
  return (
    <View style={[statStyles.card, color && { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      {sub && <Text style={statStyles.sub}>{sub}</Text>}
    </View>
  );
}
const statStyles = StyleSheet.create({
  card:  { flex: 1, backgroundColor: '#ffffff', borderRadius: Radius.xl, padding: Spacing[4], alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', ...Shadow.sm },
  emoji: { fontSize: 24, marginBottom: Spacing[2] },
  value: { ...Typography.headingMedium, color: '#111827' },
  label: { ...Typography.caption, color: '#6b7280', textAlign: 'center', marginTop: 2 },
  sub:   { ...Typography.caption, color: '#6b7280', textAlign: 'center' },
});

export function SellerDashboardScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const C = useThemeColors();
  const { user } = useAuthStore();

  const { data: sellerOrders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['seller-orders-dashboard'],
    queryFn:  () => ordersApi.mySellerOrders().then(r => r.data),
    retry:    0,
  });

  const { data: myProducts } = useQuery({
    queryKey: ['my-products-dashboard'],
    queryFn:  () => marketplaceApi.getMyProducts().then(r => r.data),
    retry:    0,
  });

  if (isLoading) return <LoadingState fullScreen message="Loading dashboardâ€¦" />;

  const orders   = sellerOrders ?? [];
  const products = myProducts  ?? [];

  /* â”€â”€ Derived stats â”€â”€ */
  const pending   = orders.filter(o => o.status === 'PENDING').length;
  const active    = orders.filter(o => ['CONFIRMED','PROCESSING','READY_FOR_PICKUP','PICKED_UP','IN_TRANSIT'].includes(o.status)).length;
  const completed = orders.filter(o => o.status === 'COMPLETED').length;
  const cancelled = orders.filter(o => o.status === 'CANCELLED').length;

  const totalRevenue = orders
    .filter(o => o.status === 'COMPLETED' && o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + (o.subtotal - o.platformFee), 0);

  const pendingRevenue = orders
    .filter(o => !['COMPLETED','CANCELLED'].includes(o.status) && o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + (o.subtotal - o.platformFee), 0);

  const activeListings = products.filter(p => p.status === 'PUBLISHED').length;
  const draftListings  = products.filter(p => p.status === 'DRAFT').length;

  /* â”€â”€ Recent orders â”€â”€ */
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statusBadge: Record<string, any> = {
    PENDING:          { label: 'Pending',    variant: 'warning' },
    CONFIRMED:        { label: 'Confirmed',  variant: 'info'    },
    PROCESSING:       { label: 'Processing', variant: 'info'    },
    READY_FOR_PICKUP: { label: 'Ready',      variant: 'info'    },
    IN_TRANSIT:       { label: 'In Transit', variant: 'info'    },
    DELIVERED:        { label: 'Delivered',  variant: 'success' },
    COMPLETED:        { label: 'Completed',  variant: 'success' },
    CANCELLED:        { label: 'Cancelled',  variant: 'error'   },
  };

  const s = makeStyles(C);
  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>â†</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Seller Dashboard</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        style={s.flex}
        contentContainerStyle={{ paddingBottom: Spacing[12] }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.green[700]} />
        }
      >
        {/* Greeting */}
        <View style={s.greeting}>
          <Text style={s.greetingText}>Hello, {user?.firstName} ðŸ‘‹</Text>
          <Text style={s.greetingRole}>{user?.role} Account</Text>
        </View>

        {/* Revenue cards */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Revenue</Text>
          <View style={s.revenueRow}>
            <View style={s.revenueCard}>
              <Text style={s.revenueEmoji}>ðŸ’°</Text>
              <Text style={s.revenueAmount}>â‚¦{totalRevenue.toLocaleString()}</Text>
              <Text style={s.revenueLabel}>Total Earned</Text>
              <Text style={s.revenueSub}>(after platform fee)</Text>
            </View>
            <View style={[styles.revenueCard, { backgroundColor: C.green[50] }]}>
              <Text style={s.revenueEmoji}>â³</Text>
              <Text style={[styles.revenueAmount, { color: C.gold[600] }]}>â‚¦{pendingRevenue.toLocaleString()}</Text>
              <Text style={s.revenueLabel}>In Progress</Text>
              <Text style={s.revenueSub}>(awaiting completion)</Text>
            </View>
          </View>
        </View>

        {/* Order stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Orders</Text>
          <View style={s.statsGrid}>
            <StatCard emoji="ðŸ†•" label="New Orders"  value={pending.toString()}   color={C.warning} />
            <StatCard emoji="âš¡" label="Active"       value={active.toString()}    color={C.info} />
            <StatCard emoji="âœ…" label="Completed"    value={completed.toString()} color={C.success} />
            <StatCard emoji="âŒ" label="Cancelled"    value={cancelled.toString()} color={C.error} />
          </View>
        </View>

        {/* Listings */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>My Listings</Text>
          <View style={s.statsGrid}>
            <StatCard emoji="ðŸŸ¢" label="Live Listings" value={activeListings.toString()} color={C.green[600]} />
            <StatCard emoji="ðŸ“" label="Drafts"         value={draftListings.toString()}  color={C.gray[400]} />
            <StatCard emoji="ðŸ“¦" label="Total Products" value={products.length.toString()} />
          </View>
        </View>

        {/* Recent orders */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('OrdersTab')}>
              <Text style={s.seeAll}>See all â†’</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={s.emptyOrders}>
              <Text style={s.emptyOrdersIcon}>ðŸ“­</Text>
              <Text style={s.emptyOrdersText}>No orders yet. Your orders will appear here.</Text>
            </View>
          ) : (
            recentOrders.map(order => {
              const cfg = statusBadge[order.status] ?? { label: order.status, variant: 'gray' };
              return (
                <TouchableOpacity
                  key={order.id}
                  style={s.orderRow}
                  activeOpacity={0.8}
                  onPress={() => (navigation as any).navigate('OrdersTab', {
                    screen: 'OrderDetail',
                    params: { orderId: order.id },
                  })}
                >
                  <View style={s.orderRowLeft}>
                    <Text style={s.orderNum}>#{order.orderNumber}</Text>
                    <Text style={s.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={s.orderRowRight}>
                    <Badge label={cfg.label} variant={cfg.variant} size="sm" />
                    <Text style={s.orderAmount}>â‚¦{order.total?.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = makeStyles(C);
function makeStyles(C: any) { return StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.background },

  header:      { backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 40 },
  backText:    { fontSize: 22, color: C.textSecondary },
  headerTitle: { ...Typography.titleLarge, color: C.textPrimary, flex: 1, textAlign: 'center' },

  greeting:     { backgroundColor: C.green[700], padding: Spacing[5] },
  greetingText: { ...Typography.headingSmall, color: C.white },
  greetingRole: { ...Typography.bodySmall, color: 'rgba(255,255,255,.7)', marginTop: 2 },

  section:       { padding: Spacing[5] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
  sectionTitle:  { ...Typography.titleLarge, color: C.textPrimary, marginBottom: Spacing[4] },
  seeAll:        { ...Typography.labelLarge, color: C.green[600] },

  revenueRow:    { flexDirection: 'row', gap: Spacing[4] },
  revenueCard:   { flex: 1, backgroundColor: C.white, borderRadius: Radius.xl, padding: Spacing[5], alignItems: 'center', borderWidth: 1, borderColor: C.border, ...Shadow.sm },
  revenueEmoji:  { fontSize: 28, marginBottom: Spacing[2] },
  revenueAmount: { ...Typography.headingMedium, color: C.green[700] },
  revenueLabel:  { ...Typography.titleMedium, color: C.textSecondary, marginTop: 2 },
  revenueSub:    { ...Typography.caption, color: C.textMuted, marginTop: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },

  orderRow:      { backgroundColor: C.white, borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  orderRowLeft:  { gap: Spacing[1] },
  orderRowRight: { alignItems: 'flex-end', gap: Spacing[2] },
  orderNum:      { ...Typography.titleMedium, color: C.textPrimary },
  orderDate:     { ...Typography.caption, color: C.textMuted },
  orderAmount:   { ...Typography.titleMedium, color: C.green[700] },

  emptyOrders:     { backgroundColor: C.white, borderRadius: Radius.xl, padding: Spacing[8], alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emptyOrdersIcon: { fontSize: 36, marginBottom: Spacing[3] },
  emptyOrdersText: { ...Typography.bodyMedium, color: C.textMuted, textAlign: 'center' },
});
}
