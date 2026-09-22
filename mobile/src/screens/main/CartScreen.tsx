import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
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
  const C = useThemeColors();
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

  /* â”€â”€ Place order mutation â”€â”€ */
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
        'ðŸŽ‰ Order Placed!',
        `Order ${order.orderNumber} placed successfully.\nTotal: â‚¦${order.total?.toLocaleString()}`,
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
      `Place order for â‚¦${total().toLocaleString()} from ${sellerName}?`,
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

  /* â”€â”€ Empty cart â”€â”€ */
  if (items.length === 0) {
    return (
      <View style={[s.flex, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>â†</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>My Cart</Text>
          <View style={s.backBtn} />
        </View>
        <EmptyState
          icon="ðŸ›’"
          title="Your cart is empty"
          description="Browse the marketplace and add products to your cart."
          actionLabel="Browse Market"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const s = makeStyles(C);
  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.flex, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>â†</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>My Cart ({items.length})</Text>
          <TouchableOpacity
            style={s.clearBtn}
            onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ])}
          >
            <Text style={s.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.flex}
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Seller info strip */}
          <View style={s.sellerStrip}>
            <Text style={s.sellerStripIcon}>ðŸŒ¾</Text>
            <Text style={s.sellerStripText}>
              All items from <Text style={s.sellerStripName}>{sellerName}</Text>
            </Text>
          </View>

          {/* Cart items */}
          <View style={s.itemsSection}>
            {items.map(item => (
              <View key={item.productId} style={s.cartItem}>
                {/* Image */}
                <View style={s.itemImageWrap}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={s.itemImage} contentFit="cover" />
                  ) : (
                    <View style={[s.itemImage, styles.itemImagePlaceholder]}>
                      <Text style={{ fontSize: 24 }}>ðŸŒ¾</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={s.itemInfo}>
                  <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.itemPrice}>
                    â‚¦{item.price.toLocaleString()}
                    <Text style={s.itemPriceUnit}>/{item.priceUnit}</Text>
                  </Text>
                  <Text style={s.itemSubtotal}>
                    Subtotal: â‚¦{(item.price * item.quantity).toLocaleString()}
                  </Text>
                </View>

                {/* Qty controls */}
                <View style={s.qtyCol}>
                  <TouchableOpacity
                    style={s.qtyBtn}
                    onPress={() => updateQty(item.productId, item.quantity - 1)}
                  >
                    <Text style={s.qtyBtnText}>âˆ’</Text>
                  </TouchableOpacity>
                  <Text style={s.qtyVal}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[s.qtyBtn, item.quantity >= item.maxQuantity && styles.qtyBtnDisabled]}
                    onPress={() => updateQty(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQuantity}
                  >
                    <Text style={s.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.removeBtn}
                    onPress={() => handleRemove(item.productId, item.name)}
                  >
                    <Text style={s.removeBtnText}>ðŸ—‘ï¸</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Delivery details */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Delivery Details (optional)</Text>

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Delivery Address</Text>
              <TextInput
                style={s.textInput}
                placeholder="e.g. 12 Murtala Lane, Kaduna"
                placeholderTextColor={C.gray[400]}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
            </View>

            {/* State picker */}
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Delivery State</Text>
              <TouchableOpacity
                style={s.statePicker}
                onPress={() => setShowStateList(v => !v)}
              >
                <Text style={deliveryState ? styles.statePickerVal : styles.statePickerPlaceholder}>
                  {deliveryState || 'Select stateâ€¦'}
                </Text>
                <Text style={s.statePickerArrow}>{showStateList ? 'â–²' : 'â–¼'}</Text>
              </TouchableOpacity>
              {showStateList && (
                <View style={s.stateList}>
                  {NIGERIAN_STATES.map(st => (
                    <TouchableOpacity
                      key={st}
                      style={[s.stateItem, deliveryState === st && styles.stateItemActive]}
                      onPress={() => { setDeliveryState(st); setShowStateList(false); }}
                    >
                      <Text style={[s.stateItemText, deliveryState === st && styles.stateItemTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Notes to Seller (optional)</Text>
              <TextInput
                style={[s.textInput, { minHeight: 70 }]}
                placeholder="Any special instructionsâ€¦"
                placeholderTextColor={C.gray[400]}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>

          {/* Order summary */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Order Summary</Text>
            <View style={s.summaryCard}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal</Text>
                <Text style={s.summaryVal}>â‚¦{subtotal().toLocaleString()}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Platform fee (2.05%)</Text>
                <Text style={s.summaryVal}>â‚¦{platformFee().toLocaleString()}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Delivery fee</Text>
                <Text style={[s.summaryVal, { color: C.green[600] }]}>Arranged with seller</Text>
              </View>
              <View style={[s.summaryRow, styles.summaryTotal]}>
                <Text style={s.summaryTotalLabel}>Total</Text>
                <Text style={s.summaryTotalVal}>â‚¦{total().toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky place order bar */}
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + Spacing[3] }]}>
          <View style={s.bottomSummary}>
            <Text style={s.bottomTotal}>â‚¦{total().toLocaleString()}</Text>
            <Text style={s.bottomItems}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
          </View>
          <Button
            title={orderMutation.isPending ? 'Placing Orderâ€¦' : 'Place Order'}
            onPress={handlePlaceOrder}
            disabled={orderMutation.isPending}
            fullWidth={false}
            style={s.placeBtn}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: any) { return StyleSheet.create({
  flex:   { flex: 1, backgroundColor: C.background },

  /* Header */
  header:      { backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 40, alignItems: 'flex-start' },
  backText:    { fontSize: 22, color: C.textSecondary },
  headerTitle: { ...Typography.headingSmall, color: C.textPrimary },
  clearBtn:    { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
  clearBtnText:{ ...Typography.labelLarge, color: C.error },

  /* Seller strip */
  sellerStrip:     { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], backgroundColor: C.green[50], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: C.green[200] },
  sellerStripIcon: { fontSize: 16 },
  sellerStripText: { ...Typography.bodyMedium, color: C.textSecondary },
  sellerStripName: { fontWeight: '700', color: C.green[700] },

  /* Cart items */
  itemsSection: { backgroundColor: C.white, marginTop: Spacing[3], borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  cartItem:     { flexDirection: 'row', padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.gray[100], gap: Spacing[3] },
  itemImageWrap:{ width: 72, height: 72, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: C.green[50] },
  itemImage:    { width: 72, height: 72 },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemInfo:     { flex: 1, justifyContent: 'space-between' },
  itemName:     { ...Typography.titleMedium, color: C.textPrimary, marginBottom: Spacing[1] },
  itemPrice:    { ...Typography.bodyMedium, color: C.green[700], fontWeight: '700' },
  itemPriceUnit:{ fontWeight: '400', color: C.textMuted },
  itemSubtotal: { ...Typography.bodySmall, color: C.textMuted },
  qtyCol:       { alignItems: 'center', justifyContent: 'space-between', gap: Spacing[2] },
  qtyBtn:       { width: 30, height: 30, borderRadius: 15, backgroundColor: C.green[700], alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { backgroundColor: C.gray[300] },
  qtyBtnText:   { color: C.white, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  qtyVal:       { ...Typography.titleMedium, color: C.textPrimary, minWidth: 24, textAlign: 'center' },
  removeBtn:    { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  removeBtnText:{ fontSize: 16 },

  /* Delivery & notes */
  section:      { backgroundColor: C.white, marginTop: Spacing[3], padding: Spacing[5], borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  sectionTitle: { ...Typography.labelLarge, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing[4] },
  inputWrap:    { marginBottom: Spacing[4] },
  inputLabel:   { ...Typography.labelLarge, color: C.gray[700], marginBottom: Spacing[2] },
  textInput:    {
    borderWidth: 1.5, borderColor: C.gray[300],
    borderRadius: Radius.lg, padding: Spacing[3],
    ...Typography.bodyLarge, color: C.textPrimary,
    backgroundColor: C.white,
  },
  statePicker:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: C.gray[300], borderRadius: Radius.lg, padding: Spacing[3], backgroundColor: C.white },
  statePickerVal:      { ...Typography.bodyLarge, color: C.textPrimary },
  statePickerPlaceholder: { ...Typography.bodyLarge, color: C.gray[400] },
  statePickerArrow:    { ...Typography.bodyMedium, color: C.gray[500] },
  stateList:           { borderWidth: 1, borderColor: C.gray[200], borderRadius: Radius.lg, marginTop: Spacing[1], maxHeight: 200, overflow: 'hidden', backgroundColor: C.white, ...Shadow.md },
  stateItem:           { paddingVertical: Spacing[3], paddingHorizontal: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.gray[100] },
  stateItemActive:     { backgroundColor: C.green[50] },
  stateItemText:       { ...Typography.bodyLarge, color: C.textSecondary },
  stateItemTextActive: { color: C.green[700], fontWeight: '700' },

  /* Summary */
  summaryCard:       { backgroundColor: C.gray[50], borderRadius: Radius.xl, padding: Spacing[4], borderWidth: 1, borderColor: C.border },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  summaryLabel:      { ...Typography.bodyMedium, color: C.textSecondary },
  summaryVal:        { ...Typography.bodyMedium, color: C.textPrimary, fontWeight: '600' },
  summaryTotal:      { borderTopWidth: 1, borderTopColor: C.border, paddingTop: Spacing[3], marginTop: Spacing[1], marginBottom: 0 },
  summaryTotalLabel: { ...Typography.titleLarge, color: C.textPrimary },
  summaryTotalVal:   { ...Typography.headingSmall, color: C.green[700] },

  /* Bottom bar */
  bottomBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[5], paddingTop: Spacing[3], ...Shadow.lg },
  bottomSummary: { gap: 2 },
  bottomTotal:   { ...Typography.headingSmall, color: C.green[700] },
  bottomItems:   { ...Typography.caption, color: C.textMuted },
  placeBtn:      { flex: 1, marginLeft: Spacing[4] },
});
}
