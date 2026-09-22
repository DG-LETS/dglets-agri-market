import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius } from '@theme/index';
import { LoadingState, EmptyState, Badge } from '@components/ui';
import { ordersApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { OrdersStackParamList } from '@navigation/MainNavigator';

type Tab = 'buying' | 'selling';
const statusBadge: Record<string, { label: string; variant: any }> = {
  PENDING:    { label: 'Pending',    variant: 'warning' },
  CONFIRMED:  { label: 'Confirmed',  variant: 'info' },
  COMPLETED:  { label: 'Completed',  variant: 'success' },
  CANCELLED:  { label: 'Cancelled',  variant: 'error' },
  IN_TRANSIT: { label: 'In Transit', variant: 'info' },
  DELIVERED:  { label: 'Delivered',  variant: 'success' },
};

type Props = { navigation: StackNavigationProp<OrdersStackParamList, 'OrdersList'> };

export function OrdersScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthStore();
  const C        = useThemeColors();
  const [tab, setTab] = useState<Tab>('buying');
  const isFarmer = ['FARMER','TRADER','AGGREGATOR','PROCESSOR','EXPORTER','HAULAGE'].includes(user?.role ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', tab],
    queryFn:  () => tab === 'buying'
      ? ordersApi.myBuyerOrders().then(r => r.data)
      : ordersApi.mySellerOrders().then(r => r.data),
  });

  const s = makeStyles(C);

  return (
    <View style={[s.flex, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Orders</Text>
        {isFarmer && (
          <View style={s.tabs}>
            <TouchableOpacity style={[s.tab, tab === 'buying' && s.tabActive]} onPress={() => setTab('buying')}>
              <Text style={[s.tabText, tab === 'buying' && s.tabTextActive]}>Buying</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, tab === 'selling' && s.tabActive]} onPress={() => setTab('selling')}>
              <Text style={[s.tabText, tab === 'selling' && s.tabTextActive]}>Selling</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {isLoading ? <LoadingState message="Loading orders…" /> : !data?.length ? (
        <EmptyState icon="📦" title="No orders yet" description="Your orders will appear here once you start buying or selling." />
      ) : (
        <FlatList
          data={data} keyExtractor={item => item.id} contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const status = statusBadge[item.status] || { label: item.status, variant: 'gray' };
            return (
              <TouchableOpacity style={s.orderCard} activeOpacity={0.8}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
                <View style={s.orderTop}>
                  <Text style={s.orderNum}>#{item.orderNumber}</Text>
                  <Badge label={status.label} variant={status.variant} />
                </View>
                <Text style={s.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <View style={s.orderBottom}>
                  <Text style={s.orderItems}>{item.items?.length} item{item.items?.length !== 1 ? 's' : ''}</Text>
                  <Text style={s.orderTotal}>₦{item.total?.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:          { flex: 1, backgroundColor: C.background },
    header:        { backgroundColor: C.white, paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[3], borderBottomWidth: 1, borderBottomColor: C.border },
    title:         { ...Typography.headingMedium, color: C.textPrimary, marginBottom: Spacing[3] },
    tabs:          { flexDirection: 'row', backgroundColor: C.gray[100], borderRadius: Radius.lg, padding: 3 },
    tab:           { flex: 1, paddingVertical: Spacing[2], alignItems: 'center', borderRadius: Radius.md },
    tabActive:     { backgroundColor: C.white },
    tabText:       { ...Typography.labelLarge, color: C.textMuted },
    tabTextActive: { color: C.green[700] },
    list:          { padding: Spacing[4], gap: Spacing[3] },
    orderCard:     { backgroundColor: C.white, borderRadius: Radius.xl, padding: Spacing[4], borderWidth: 1, borderColor: C.border },
    orderTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[1] },
    orderNum:      { ...Typography.titleMedium, color: C.textPrimary },
    orderDate:     { ...Typography.bodySmall, color: C.textMuted, marginBottom: Spacing[3] },
    orderBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderItems:    { ...Typography.bodyMedium, color: C.textSecondary },
    orderTotal:    { ...Typography.titleLarge, color: C.green[700] },
  });
}
