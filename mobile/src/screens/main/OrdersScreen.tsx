import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { LoadingState, EmptyState, Badge } from '@components/ui';
import { ordersApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { OrdersStackParamList } from '@navigation/MainNavigator';

type Tab = 'buying' | 'selling';

const statusBadge: Record<string, { label: string; variant: any }> = {
  PENDING:      { label: 'Pending',    variant: 'warning' },
  CONFIRMED:    { label: 'Confirmed',  variant: 'info' },
  COMPLETED:    { label: 'Completed',  variant: 'success' },
  CANCELLED:    { label: 'Cancelled',  variant: 'error' },
  IN_TRANSIT:   { label: 'In Transit', variant: 'info' },
  DELIVERED:    { label: 'Delivered',  variant: 'success' },
};

type Props = {
  navigation: StackNavigationProp<OrdersStackParamList, 'OrdersList'>;
};

export function OrdersScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('buying');
  const isFarmer = ['FARMER','TRADER','AGGREGATOR','PROCESSOR','EXPORTER','HAULAGE'].includes(user?.role ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', tab],
    queryFn:  () => tab === 'buying'
      ? ordersApi.myBuyerOrders().then(r => r.data)
      : ordersApi.mySellerOrders().then(r => r.data),
  });

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        {isFarmer && (
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, tab === 'buying' && styles.tabActive]} onPress={() => setTab('buying')}>
              <Text style={[styles.tabText, tab === 'buying' && styles.tabTextActive]}>Buying</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === 'selling' && styles.tabActive]} onPress={() => setTab('selling')}>
              <Text style={[styles.tabText, tab === 'selling' && styles.tabTextActive]}>Selling</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading ? (
        <LoadingState message="Loading orders…" />
      ) : !data?.length ? (
        <EmptyState icon="📦" title="No orders yet" description="Your orders will appear here once you start buying or selling." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const status = statusBadge[item.status] || { label: item.status, variant: 'gray' };
            return (
              <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              >
                <View style={styles.orderTop}>
                  <Text style={styles.orderNum}>#{item.orderNumber}</Text>
                  <Badge label={status.label} variant={status.variant} />
                </View>
                <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <View style={styles.orderBottom}>
                  <Text style={styles.orderItems}>{item.items?.length} item{item.items?.length !== 1 ? 's' : ''}</Text>
                  <Text style={styles.orderTotal}>₦{item.total?.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: Colors.background },
  header:       { backgroundColor: Colors.white, paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:        { ...Typography.headingMedium, color: Colors.textPrimary, marginBottom: Spacing[3] },
  tabs:         { flexDirection: 'row', backgroundColor: Colors.gray[100], borderRadius: Radius.lg, padding: 3 },
  tab:          { flex: 1, paddingVertical: Spacing[2], alignItems: 'center', borderRadius: Radius.md },
  tabActive:    { backgroundColor: Colors.white },
  tabText:      { ...Typography.labelLarge, color: Colors.textMuted },
  tabTextActive:{ color: Colors.green[700] },
  list:         { padding: Spacing[4], gap: Spacing[3] },
  orderCard:    { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border },
  orderTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[1] },
  orderNum:     { ...Typography.titleMedium, color: Colors.textPrimary },
  orderDate:    { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing[3] },
  orderBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItems:   { ...Typography.bodyMedium, color: Colors.textSecondary },
  orderTotal:   { ...Typography.titleLarge, color: Colors.green[700] },
});
