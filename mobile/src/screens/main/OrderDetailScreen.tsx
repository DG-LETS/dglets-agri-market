import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Badge, LoadingState, Button } from '@components/ui';
import { ordersApi, paymentsApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { OrdersStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<OrdersStackParamList, 'OrderDetail'>;
  route:      RouteProp<OrdersStackParamList, 'OrderDetail'>;
};

/* ── Status config ── */
const STATUS_CONFIG: Record<string, { label: string; variant: any; emoji: string }> = {
  PENDING:          { label: 'Pending',           variant: 'warning', emoji: '⏳' },
  CONFIRMED:        { label: 'Confirmed',          variant: 'info',    emoji: '✅' },
  PROCESSING:       { label: 'Processing',         variant: 'info',    emoji: '⚙️' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup',   variant: 'info',    emoji: '📦' },
  PICKED_UP:        { label: 'Picked Up',          variant: 'info',    emoji: '🚗' },
  IN_TRANSIT:       { label: 'In Transit',         variant: 'info',    emoji: '🚚' },
  DELIVERED:        { label: 'Delivered',          variant: 'success', emoji: '🏠' },
  COMPLETED:        { label: 'Completed',          variant: 'success', emoji: '🎉' },
  CANCELLED:        { label: 'Cancelled',          variant: 'error',   emoji: '❌' },
  DISPUTED:         { label: 'Disputed',           variant: 'error',   emoji: '⚠️' },
  REFUNDED:         { label: 'Refunded',           variant: 'gray',    emoji: '↩️' },
};

/* Full lifecycle in order */
const STATUS_TIMELINE = [
  'PENDING', 'CONFIRMED', 'PROCESSING',
  'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT',
  'DELIVERED', 'COMPLETED',
];

/* Actions a seller can take */
const SELLER_ACTIONS: Record<string, { next: string; label: string; variant: any }[]> = {
  PENDING:          [{ next: 'CONFIRMED',        label: 'Confirm Order',    variant: 'primary' }, { next: 'CANCELLED', label: 'Cancel', variant: 'danger' }],
  CONFIRMED:        [{ next: 'PROCESSING',       label: 'Start Processing', variant: 'primary' }],
  PROCESSING:       [{ next: 'READY_FOR_PICKUP', label: 'Ready for Pickup', variant: 'primary' }],
  READY_FOR_PICKUP: [{ next: 'PICKED_UP',        label: 'Mark Picked Up',   variant: 'primary' }],
  PICKED_UP:        [{ next: 'IN_TRANSIT',       label: 'Mark In Transit',  variant: 'primary' }],
  IN_TRANSIT:       [{ next: 'DELIVERED',        label: 'Mark Delivered',   variant: 'primary' }],
  DELIVERED:        [{ next: 'COMPLETED',        label: 'Mark Completed',   variant: 'primary' }],
};

/* Actions a buyer can take */
const BUYER_ACTIONS: Record<string, { next: string; label: string; variant: any }[]> = {
  PENDING:   [{ next: 'CANCELLED', label: 'Cancel Order', variant: 'danger' }],
  DELIVERED: [{ next: 'COMPLETED', label: 'Confirm Receipt', variant: 'primary' }],
};

function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatPhone(phone: string) {
  return phone?.replace(/^(\+?234|0)/, '0');
}

export function OrderDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const insets       = useSafeAreaInsets();
  const { user }     = useAuthStore();
  const queryClient  = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn:  () => ordersApi.getById(orderId).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => ordersApi.updateStatus(orderId, status).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.response?.data?.message || 'Could not update order status.');
    },
  });

  /* ── Pay Now ── */
  const payMutation = useMutation({
    mutationFn: () => paymentsApi.initPaystack(orderId).then(r => r.data),
    onSuccess: async (result) => {
      const url = result?.data?.authorization_url as string | undefined;
      if (!url) {
        Alert.alert('Payment Error', 'Could not get payment link. Please try again.');
        return;
      }
      /* Open Paystack checkout in the device browser */
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        /* After user returns from browser, re-fetch the order to check payment status */
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        }, 2000);
      } else {
        Alert.alert('Cannot Open', 'Unable to open the payment page.');
      }
    },
    onError: (e: any) => {
      Alert.alert('Payment Failed', e?.response?.data?.message ?? 'Could not initialise payment.');
    },
  });

  const handlePayNow = () => {
    Alert.alert(
      'Pay with Paystack',
      `You will be redirected to Paystack to complete payment of ₦${order?.total?.toLocaleString()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue to Payment', onPress: () => payMutation.mutate() },
      ],
    );
  };

  const handleStatusAction = (next: string, label: string) => {    Alert.alert(
      'Confirm Action',
      `${label} — are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => statusMutation.mutate(next) },
      ],
    );
  };

  const callContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Cannot Call', 'Unable to open the phone dialler.'),
    );
  };

  const whatsappContact = (phone: string, name: string) => {
    const msg = encodeURIComponent(
      `Hello ${name}, I'm reaching out about order #${order?.orderNumber} on DG-LETS Agri Market.`,
    );
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`);
  };

  if (isLoading || !order) return <LoadingState fullScreen message="Loading order…" />;

  const isSeller    = order.sellerId === user?.id;
  const isBuyer     = order.buyerId  === user?.id;
  const cfg         = STATUS_CONFIG[order.status] ?? { label: order.status, variant: 'gray', emoji: '📋' };
  const timelinePos = STATUS_TIMELINE.indexOf(order.status);
  const actions     = isSeller ? (SELLER_ACTIONS[order.status] ?? []) : (BUYER_ACTIONS[order.status] ?? []);
  const contact     = isBuyer ? order.seller : order.buyer;
  const contactRole = isBuyer ? 'Seller' : 'Buyer';

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Detail</Text>
          <Text style={styles.headerSub}>#{order.orderNumber}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: Spacing[12] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <Text style={styles.statusEmoji}>{cfg.emoji}</Text>
            <View style={styles.statusInfo}>
              <Badge label={cfg.label} variant={cfg.variant} />
              <Text style={styles.statusDate}>
                Placed {fmt(order.createdAt)}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          {!['CANCELLED','DISPUTED','REFUNDED'].includes(order.status) && (
            <View style={styles.timeline}>
              {STATUS_TIMELINE.map((s, i) => {
                const done    = i <= timelinePos;
                const current = i === timelinePos;
                const sCfg    = STATUS_CONFIG[s];
                return (
                  <View key={s} style={styles.timelineStep}>
                    <View style={styles.timelineTrack}>
                      <View style={[styles.timelineDot, done && styles.timelineDotDone, current && styles.timelineDotCurrent]}>
                        {done && <Text style={styles.timelineDotCheck}>✓</Text>}
                      </View>
                      {i < STATUS_TIMELINE.length - 1 && (
                        <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                      )}
                    </View>
                    <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]} numberOfLines={1}>
                      {sCfg?.label ?? s}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Order items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.card}>
            {order.items?.map((item: any, i: number) => (
              <View
                key={item.id}
                style={[styles.orderItem, i < order.items.length - 1 && styles.orderItemBorder]}
              >
                <View style={styles.orderItemImageWrap}>
                  {item.product?.images?.[0] ? (
                    <Image
                      source={{ uri: item.product.images[0] }}
                      style={styles.orderItemImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.orderItemImage, styles.orderItemImagePlaceholder]}>
                      <Text style={{ fontSize: 20 }}>🌾</Text>
                    </View>
                  )}
                </View>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName} numberOfLines={2}>
                    {item.product?.name ?? 'Product'}
                  </Text>
                  <Text style={styles.orderItemQty}>
                    {item.quantity} × ₦{item.unitPrice?.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.orderItemSubtotal}>
                  ₦{item.subtotal?.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Price breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceVal}>₦{order.subtotal?.toLocaleString()}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform fee</Text>
              <Text style={styles.priceVal}>₦{order.platformFee?.toLocaleString()}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery fee</Text>
              <Text style={styles.priceVal}>
                {order.deliveryFee > 0 ? `₦${order.deliveryFee.toLocaleString()}` : 'Arranged with seller'}
              </Text>
            </View>
            <View style={[styles.priceRow, styles.priceTotal]}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalVal}>₦{order.total?.toLocaleString()}</Text>
            </View>
            <View style={styles.paymentStatusRow}>
              <Text style={styles.priceLabel}>Payment status</Text>
              <Badge
                label={order.paymentStatus}
                variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                size="sm"
              />
            </View>

            {/* Pay Now — only for buyer when payment not yet done */}
            {isBuyer && ['PENDING', 'PROCESSING'].includes(order.paymentStatus) && (
              <View style={styles.payNowWrap}>
                <Button
                  title={payMutation.isPending ? 'Opening payment…' : '💳 Pay Now with Paystack'}
                  onPress={handlePayNow}
                  disabled={payMutation.isPending}
                  variant="gold"
                  size="lg"
                />
                <Text style={styles.payNowNote}>
                  🔒 Secure payment via Paystack. You'll return here after completing payment.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Delivery info */}
        {(order.deliveryAddress || order.deliveryState) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.card}>
              <Text style={styles.addressText}>
                📍 {[order.deliveryAddress, order.deliveryState].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </View>
        )}

        {/* Contact card */}
        {contact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{contactRole}</Text>
            <View style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>
                  {contact.firstName?.[0]}{contact.lastName?.[0]}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                  {contact.firstName} {contact.lastName}
                </Text>
                {contact.phone && (
                  <Text style={styles.contactPhone}>{formatPhone(contact.phone)}</Text>
                )}
              </View>
              <View style={styles.contactBtns}>
                {contact.phone && (
                  <>
                    <TouchableOpacity
                      style={[styles.contactBtn, styles.contactBtnCall]}
                      onPress={() => callContact(contact.phone)}
                    >
                      <Text style={styles.contactBtnText}>📞</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.contactBtn, styles.contactBtnWa]}
                      onPress={() => whatsappContact(contact.phone, contact.firstName)}
                    >
                      <Text style={styles.contactBtnText}>💬</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.card}>
            {[
              { label: 'Order placed',  value: fmt(order.createdAt) },
              { label: 'Confirmed',     value: fmt(order.confirmedAt) },
              { label: 'Completed',     value: fmt(order.completedAt) },
              { label: 'Cancelled',     value: fmt(order.cancelledAt) },
            ].filter(r => r.value).map(row => (
              <View key={row.label} style={styles.tsRow}>
                <Text style={styles.tsLabel}>{row.label}</Text>
                <Text style={styles.tsVal}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Seller / buyer action buttons */}
        {actions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsWrap}>
              {actions.map(action => (
                <Button
                  key={action.next}
                  title={statusMutation.isPending ? 'Updating…' : action.label}
                  variant={action.variant}
                  onPress={() => handleStatusAction(action.next, action.label)}
                  disabled={statusMutation.isPending}
                  style={styles.actionBtn}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header:       { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { width: 40 },
  backText:     { fontSize: 22, color: Colors.textSecondary },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { ...Typography.titleLarge, color: Colors.textPrimary },
  headerSub:    { ...Typography.bodySmall, color: Colors.textMuted },

  /* Status card */
  statusCard:   { backgroundColor: Colors.white, margin: Spacing[4], borderRadius: Radius.xl, padding: Spacing[5], borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  statusTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], marginBottom: Spacing[5] },
  statusEmoji:  { fontSize: 36 },
  statusInfo:   { gap: Spacing[2] },
  statusDate:   { ...Typography.bodySmall, color: Colors.textMuted },

  /* Timeline */
  timeline:       { flexDirection: 'row', alignItems: 'flex-start' },
  timelineStep:   { flex: 1, alignItems: 'center' },
  timelineTrack:  { flexDirection: 'row', alignItems: 'center', width: '100%' },
  timelineDot:    { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.gray[200], borderWidth: 2, borderColor: Colors.gray[300], alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineDotDone:    { backgroundColor: Colors.green[700], borderColor: Colors.green[700] },
  timelineDotCurrent: { backgroundColor: Colors.green[500], borderColor: Colors.green[700], width: 22, height: 22, borderRadius: 11 },
  timelineDotCheck:   { fontSize: 9, color: Colors.white, fontWeight: '900' },
  timelineLine:       { flex: 1, height: 2, backgroundColor: Colors.gray[200] },
  timelineLineDone:   { backgroundColor: Colors.green[700] },
  timelineLabel:      { ...Typography.caption, color: Colors.gray[400], marginTop: Spacing[1], textAlign: 'center', fontSize: 9 },
  timelineLabelDone:  { color: Colors.green[700], fontWeight: '700' },

  /* Sections */
  section:      { paddingHorizontal: Spacing[4], marginBottom: Spacing[4] },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing[3] },
  card:         { backgroundColor: Colors.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  /* Order items */
  orderItem:             { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[3] },
  orderItemBorder:       { borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  orderItemImageWrap:    { width: 52, height: 52, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.green[50] },
  orderItemImage:        { width: 52, height: 52 },
  orderItemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  orderItemInfo:         { flex: 1 },
  orderItemName:         { ...Typography.titleMedium, color: Colors.textPrimary, marginBottom: 2 },
  orderItemQty:          { ...Typography.bodySmall, color: Colors.textMuted },
  orderItemSubtotal:     { ...Typography.titleMedium, color: Colors.textPrimary },

  /* Price rows */
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  priceLabel:     { ...Typography.bodyMedium, color: Colors.textSecondary },
  priceVal:       { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '600' },
  priceTotal:     { borderBottomWidth: 0 },
  priceTotalLabel:{ ...Typography.titleLarge, color: Colors.textPrimary },
  priceTotalVal:  { ...Typography.headingSmall, color: Colors.green[700] },
  paymentStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[4], borderTopWidth: 1, borderTopColor: Colors.gray[100] },

  /* Address / notes */
  addressText:  { ...Typography.bodyLarge, color: Colors.textSecondary, padding: Spacing[4] },
  notesText:    { ...Typography.bodyLarge, color: Colors.textSecondary, padding: Spacing[4], fontStyle: 'italic' },

  /* Contact */
  contactCard:       { backgroundColor: Colors.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[3] },
  contactAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { ...Typography.titleLarge, color: Colors.white },
  contactInfo:       { flex: 1 },
  contactName:       { ...Typography.titleMedium, color: Colors.textPrimary },
  contactPhone:      { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  contactBtns:       { flexDirection: 'row', gap: Spacing[2] },
  contactBtn:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactBtnCall:    { backgroundColor: Colors.green[50], borderWidth: 1, borderColor: Colors.green[200] },
  contactBtnWa:      { backgroundColor: '#e8faf0', borderWidth: 1, borderColor: '#25d36640' },
  contactBtnText:    { fontSize: 18 },

  /* Timestamps */
  tsRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  tsLabel: { ...Typography.bodyMedium, color: Colors.textSecondary },
  tsVal:   { ...Typography.bodySmall, color: Colors.textMuted },

  /* Actions */
  actionsWrap: { gap: Spacing[3] },
  actionBtn:   {},

  /* Pay Now */
  payNowWrap: { padding: Spacing[4], borderTopWidth: 1, borderTopColor: Colors.gray[100], gap: Spacing[3] },
  payNowNote: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
});
