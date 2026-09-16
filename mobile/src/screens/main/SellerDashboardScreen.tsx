import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '@theme/index';
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
  card:  { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing[4], alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  emoji: { fontSize: 24, marginBottom: Spacing[2] },
  value: { ...Typography.headingMedium, color: Colors.textPrimary },
  label: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  sub:   { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
});

export function SellerDashboardScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
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

  if (isLoading) return <LoadingState fullScreen message="Loading dashboard…" />;

  const orders   = sellerOrders ?? [];
  const products = myProducts  ?? [];

  /* ── Derived stats ── */
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

  /* ── Recent orders ── */
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

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: Spacing[12] }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.green[700]} />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Hello, {user?.firstName} 👋</Text>
          <Text style={styles.greetingRole}>{user?.role} Account</Text>
        </View>

        {/* Revenue cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue</Text>
          <View style={styles.revenueRow}>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueEmoji}>💰</Text>
              <Text style={styles.revenueAmount}>₦{totalRevenue.toLocaleString()}</Text>
              <Text style={styles.revenueLabel}>Total Earned</Text>
              <Text style={styles.revenueSub}>(after platform fee)</Text>
            </View>
            <View style={[styles.revenueCard, { backgroundColor: Colors.green[50] }]}>
              <Text style={styles.revenueEmoji}>⏳</Text>
              <Text style={[styles.revenueAmount, { color: Colors.gold[600] }]}>₦{pendingRevenue.toLocaleString()}</Text>
              <Text style={styles.revenueLabel}>In Progress</Text>
              <Text style={styles.revenueSub}>(awaiting completion)</Text>
            </View>
          </View>
        </View>

        {/* Order stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders</Text>
          <View style={styles.statsGrid}>
            <StatCard emoji="🆕" label="New Orders"  value={pending.toString()}   color={Colors.warning} />
            <StatCard emoji="⚡" label="Active"       value={active.toString()}    color={Colors.info} />
            <StatCard emoji="✅" label="Completed"    value={completed.toString()} color={Colors.success} />
            <StatCard emoji="❌" label="Cancelled"    value={cancelled.toString()} color={Colors.error} />
          </View>
        </View>

        {/* Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          <View style={styles.statsGrid}>
            <StatCard emoji="🟢" label="Live Listings" value={activeListings.toString()} color={Colors.green[600]} />
            <StatCard emoji="📝" label="Drafts"         value={draftListings.toString()}  color={Colors.gray[400]} />
            <StatCard emoji="📦" label="Total Products" value={products.length.toString()} />
          </View>
        </View>

        {/* Recent orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('OrdersTab')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyOrdersIcon}>📭</Text>
              <Text style={styles.emptyOrdersText}>No orders yet. Your orders will appear here.</Text>
            </View>
          ) : (
            recentOrders.map(order => {
              const cfg = statusBadge[order.status] ?? { label: order.status, variant: 'gray' };
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderRow}
                  activeOpacity={0.8}
                  onPress={() => (navigation as any).navigate('OrdersTab', {
                    screen: 'OrderDetail',
                    params: { orderId: order.id },
                  })}
                >
                  <View style={styles.orderRowLeft}>
                    <Text style={styles.orderNum}>#{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.orderRowRight}>
                    <Badge label={cfg.label} variant={cfg.variant} size="sm" />
                    <Text style={styles.orderAmount}>₦{order.total?.toLocaleString()}</Text>
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  header:      { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 40 },
  backText:    { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { ...Typography.titleLarge, color: Colors.textPrimary, flex: 1, textAlign: 'center' },

  greeting:     { backgroundColor: Colors.green[700], padding: Spacing[5] },
  greetingText: { ...Typography.headingSmall, color: Colors.white },
  greetingRole: { ...Typography.bodySmall, color: 'rgba(255,255,255,.7)', marginTop: 2 },

  section:       { padding: Spacing[5] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
  sectionTitle:  { ...Typography.titleLarge, color: Colors.textPrimary, marginBottom: Spacing[4] },
  seeAll:        { ...Typography.labelLarge, color: Colors.green[600] },

  revenueRow:    { flexDirection: 'row', gap: Spacing[4] },
  revenueCard:   { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing[5], alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  revenueEmoji:  { fontSize: 28, marginBottom: Spacing[2] },
  revenueAmount: { ...Typography.headingMedium, color: Colors.green[700] },
  revenueLabel:  { ...Typography.titleMedium, color: Colors.textSecondary, marginTop: 2 },
  revenueSub:    { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },

  orderRow:      { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  orderRowLeft:  { gap: Spacing[1] },
  orderRowRight: { alignItems: 'flex-end', gap: Spacing[2] },
  orderNum:      { ...Typography.titleMedium, color: Colors.textPrimary },
  orderDate:     { ...Typography.caption, color: Colors.textMuted },
  orderAmount:   { ...Typography.titleMedium, color: Colors.green[700] },

  emptyOrders:     { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing[8], alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyOrdersIcon: { fontSize: 36, marginBottom: Spacing[3] },
  emptyOrdersText: { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center' },
});
