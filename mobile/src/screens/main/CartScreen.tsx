import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Button, EmptyState } from '@components/ui';
import { useCartStore } from '@store/cartStore';
import { ordersApi } from '@services/api';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { MarketStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<MarketStackParamList, 'Cart'>;
};

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

export function CartScreen({ navigation }: Props) {
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const {
    items, subtotal, platformFee, total,
    updateQty, removeItem, clearCart, toOrderPayload,
  } = useCartStore();

  const sellerName = items[0]?.sellerName ?? 'the seller';

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryState,   setDeliveryState]   = useState('');
  const [notes,           setNotes]           = useState('');
  const [showStateList,   setShowStateList]   = useState(false);

  /* ── Place order mutation ── */
  const orderMutation = useMutation({
    mutationFn: () =>
      ordersApi.create(toOrderPayload({
        deliveryAddress: deliveryAddress.trim() || undefined,
        deliveryState:   deliveryState || undefined,
        notes:           notes.trim() || undefined,
      })).then(r => r.data),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      clearCart();
      Alert.alert(
        '🎉 Order Placed!',
        `Order ${order.orderNumber} placed successfully.\nTotal: ₦${order.total?.toLocaleString()}`,
        [{
          text: 'View Order',
          onPress: () => (navigation as any).navigate('OrdersTab', {
            screen: 'OrderDetail',
            params: { orderId: order.id },
          }),
        }],
      );
    },
    onError: (e: any) => {
      Alert.alert('Order Failed', e?.response?.data?.message || 'Could not place order. Try again.');
    },
  });

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Confirm Order',
      `Place order for ₦${total().toLocaleString()} from ${sellerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Place Order', onPress: () => orderMutation.mutate() },
      ],
    );
  };

  const handleRemove = (productId: string, name: string) => {
    Alert.alert('Remove Item', `Remove "${name}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeItem(productId) },
    ]);
  };

  /* ── Empty cart ── */
  if (items.length === 0) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={styles.backBtn} />
        </View>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Browse the marketplace and add products to your cart."
          actionLabel="Browse Market"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart ({items.length})</Text>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ])}
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Seller info strip */}
          <View style={styles.sellerStrip}>
            <Text style={styles.sellerStripIcon}>🌾</Text>
            <Text style={styles.sellerStripText}>
              All items from <Text style={styles.sellerStripName}>{sellerName}</Text>
            </Text>
          </View>

          {/* Cart items */}
          <View style={styles.itemsSection}>
            {items.map(item => (
              <View key={item.productId} style={styles.cartItem}>
                {/* Image */}
                <View style={styles.itemImageWrap}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <Text style={{ fontSize: 24 }}>🌾</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    ₦{item.price.toLocaleString()}
                    <Text style={styles.itemPriceUnit}>/{item.priceUnit}</Text>
                  </Text>
                  <Text style={styles.itemSubtotal}>
                    Subtotal: ₦{(item.price * item.quantity).toLocaleString()}
                  </Text>
                </View>

                {/* Qty controls */}
                <View style={styles.qtyCol}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item.productId, item.quantity - 1)}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, item.quantity >= item.maxQuantity && styles.qtyBtnDisabled]}
                    onPress={() => updateQty(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQuantity}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(item.productId, item.name)}
                  >
                    <Text style={styles.removeBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Delivery details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Details (optional)</Text>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Delivery Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 12 Murtala Lane, Kaduna"
                placeholderTextColor={Colors.gray[400]}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
            </View>

            {/* State picker */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Delivery State</Text>
              <TouchableOpacity
                style={styles.statePicker}
                onPress={() => setShowStateList(v => !v)}
              >
                <Text style={deliveryState ? styles.statePickerVal : styles.statePickerPlaceholder}>
                  {deliveryState || 'Select state…'}
                </Text>
                <Text style={styles.statePickerArrow}>{showStateList ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showStateList && (
                <View style={styles.stateList}>
                  {NIGERIAN_STATES.map(st => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.stateItem, deliveryState === st && styles.stateItemActive]}
                      onPress={() => { setDeliveryState(st); setShowStateList(false); }}
                    >
                      <Text style={[styles.stateItemText, deliveryState === st && styles.stateItemTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Notes to Seller (optional)</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 70 }]}
                placeholder="Any special instructions…"
                placeholderTextColor={Colors.gray[400]}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>

          {/* Order summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryVal}>₦{subtotal().toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Platform fee (2.05%)</Text>
                <Text style={styles.summaryVal}>₦{platformFee().toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery fee</Text>
                <Text style={[styles.summaryVal, { color: Colors.green[600] }]}>Arranged with seller</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalVal}>₦{total().toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky place order bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing[3] }]}>
          <View style={styles.bottomSummary}>
            <Text style={styles.bottomTotal}>₦{total().toLocaleString()}</Text>
            <Text style={styles.bottomItems}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
          </View>
          <Button
            title={orderMutation.isPending ? 'Placing Order…' : 'Place Order'}
            onPress={handlePlaceOrder}
            disabled={orderMutation.isPending}
            fullWidth={false}
            style={styles.placeBtn}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header:      { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 40, alignItems: 'flex-start' },
  backText:    { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { ...Typography.headingSmall, color: Colors.textPrimary },
  clearBtn:    { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
  clearBtnText:{ ...Typography.labelLarge, color: Colors.error },

  /* Seller strip */
  sellerStrip:     { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], backgroundColor: Colors.green[50], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.green[200] },
  sellerStripIcon: { fontSize: 16 },
  sellerStripText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  sellerStripName: { fontWeight: '700', color: Colors.green[700] },

  /* Cart items */
  itemsSection: { backgroundColor: Colors.white, marginTop: Spacing[3], borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  cartItem:     { flexDirection: 'row', padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.gray[100], gap: Spacing[3] },
  itemImageWrap:{ width: 72, height: 72, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.green[50] },
  itemImage:    { width: 72, height: 72 },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemInfo:     { flex: 1, justifyContent: 'space-between' },
  itemName:     { ...Typography.titleMedium, color: Colors.textPrimary, marginBottom: Spacing[1] },
  itemPrice:    { ...Typography.bodyMedium, color: Colors.green[700], fontWeight: '700' },
  itemPriceUnit:{ fontWeight: '400', color: Colors.textMuted },
  itemSubtotal: { ...Typography.bodySmall, color: Colors.textMuted },
  qtyCol:       { alignItems: 'center', justifyContent: 'space-between', gap: Spacing[2] },
  qtyBtn:       { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { backgroundColor: Colors.gray[300] },
  qtyBtnText:   { color: Colors.white, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  qtyVal:       { ...Typography.titleMedium, color: Colors.textPrimary, minWidth: 24, textAlign: 'center' },
  removeBtn:    { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  removeBtnText:{ fontSize: 16 },

  /* Delivery & notes */
  section:      { backgroundColor: Colors.white, marginTop: Spacing[3], padding: Spacing[5], borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing[4] },
  inputWrap:    { marginBottom: Spacing[4] },
  inputLabel:   { ...Typography.labelLarge, color: Colors.gray[700], marginBottom: Spacing[2] },
  textInput:    {
    borderWidth: 1.5, borderColor: Colors.gray[300],
    borderRadius: Radius.lg, padding: Spacing[3],
    ...Typography.bodyLarge, color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  statePicker:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.gray[300], borderRadius: Radius.lg, padding: Spacing[3], backgroundColor: Colors.white },
  statePickerVal:      { ...Typography.bodyLarge, color: Colors.textPrimary },
  statePickerPlaceholder: { ...Typography.bodyLarge, color: Colors.gray[400] },
  statePickerArrow:    { ...Typography.bodyMedium, color: Colors.gray[500] },
  stateList:           { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: Radius.lg, marginTop: Spacing[1], maxHeight: 200, overflow: 'hidden', backgroundColor: Colors.white, ...Shadow.md },
  stateItem:           { paddingVertical: Spacing[3], paddingHorizontal: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  stateItemActive:     { backgroundColor: Colors.green[50] },
  stateItemText:       { ...Typography.bodyLarge, color: Colors.textSecondary },
  stateItemTextActive: { color: Colors.green[700], fontWeight: '700' },

  /* Summary */
  summaryCard:       { backgroundColor: Colors.gray[50], borderRadius: Radius.xl, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  summaryLabel:      { ...Typography.bodyMedium, color: Colors.textSecondary },
  summaryVal:        { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '600' },
  summaryTotal:      { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing[3], marginTop: Spacing[1], marginBottom: 0 },
  summaryTotalLabel: { ...Typography.titleLarge, color: Colors.textPrimary },
  summaryTotalVal:   { ...Typography.headingSmall, color: Colors.green[700] },

  /* Bottom bar */
  bottomBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[5], paddingTop: Spacing[3], ...Shadow.lg },
  bottomSummary: { gap: 2 },
  bottomTotal:   { ...Typography.headingSmall, color: Colors.green[700] },
  bottomItems:   { ...Typography.caption, color: Colors.textMuted },
  placeBtn:      { flex: 1, marginLeft: Spacing[4] },
});
