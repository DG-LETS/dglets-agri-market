import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Button, Badge, LoadingState } from '@components/ui';
import { marketplaceApi, ordersApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import { useCartStore } from '@store/cartStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { MarketStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<MarketStackParamList, 'ProductDetail'>;
  route:      RouteProp<MarketStackParamList, 'ProductDetail'>;
};

export function ProductDetailScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const insets        = useSafeAreaInsets();
  const { user }      = useAuthStore();
  const { addItem, items, sellerId: cartSellerId } = useCartStore();
  const queryClient   = useQueryClient();

  const [imageIdx,  setImageIdx]  = useState(0);
  const [qty,       setQty]       = useState(1);
  const [saved,     setSaved]     = useState(false);

  /* ── Fetch product ── */
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn:  () => marketplaceApi.getProduct(productId).then(r => r.data),
  });

  /* ── Toggle save ── */
  const saveMutation = useMutation({
    mutationFn: () => marketplaceApi.toggleSave(productId).then(r => r.data),
    onSuccess:  (data) => setSaved(data.saved),
  });

  /* ── Place order directly (single-item quick order) ── */
  const orderMutation = useMutation({
    mutationFn: () => ordersApi.create({
      items: [{ productId, quantity: qty }],
    }).then(r => r.data),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert(
        '🎉 Order Placed!',
        `Order ${order.orderNumber} created. Total: ₦${order.total?.toLocaleString()}`,
        [
          {
            text: 'View Order',
            onPress: () => (navigation as any).navigate('OrdersTab', {
              screen: 'OrderDetail',
              params: { orderId: order.id },
            }),
          },
          { text: 'OK' },
        ],
      );
    },
    onError: (e: any) => {
      Alert.alert('Order Failed', e?.response?.data?.message || 'Could not place order.');
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    /* Warn if cart already has items from a different seller */
    if (cartSellerId && cartSellerId !== product.sellerId) {
      Alert.alert(
        'Different Seller',
        'Your cart has items from another seller. Adding this item will clear the current cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace Cart', style: 'destructive', onPress: () => {
            addItem(product, qty, true);
            navigation.navigate('Cart');
          }},
        ],
      );
      return;
    }
    addItem(product, qty);
    Alert.alert(
      'Added to Cart ✓',
      `${qty} × ${product.name} added.`,
      [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ],
    );
  };

  const handleQuickOrder = () => {
    Alert.alert(
      'Confirm Order',
      `Place order for ${qty} ${product?.priceUnit} of ${product?.name}?\nTotal: ₦${((product?.price || 0) * qty * 1.0205).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Place Order', onPress: () => orderMutation.mutate() },
      ],
    );
  };

  if (isLoading) return <LoadingState fullScreen message="Loading product…" />;
  if (!product)  return null;

  const isMine      = product.sellerId === user?.id;
  const images      = product.images?.length ? product.images : [];
  const cartQty     = items.find(i => i.productId === productId)?.quantity || 0;

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image carousel */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <Image source={{ uri: images[imageIdx] }} style={styles.mainImage} resizeMode="cover" />
          ) : (
            <View style={[styles.mainImage, styles.noImage]}>
              <Text style={styles.noImageIcon}>🌾</Text>
            </View>
          )}

          {/* Back + Save header overlay */}
          <View style={[styles.imageHeader, { paddingTop: insets.top + Spacing[2] }]}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.headerBtnText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => saveMutation.mutate()}>
              <Text style={styles.headerBtnText}>{saved ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <View style={styles.thumbRow}>
              {images.map((uri, i) => (
                <TouchableOpacity key={i} onPress={() => setImageIdx(i)}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumb, i === imageIdx && styles.thumbActive]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Title + badges */}
          <View style={styles.titleRow}>
            <Text style={styles.name}>{product.name}</Text>
            <View style={styles.badgeRow}>
              {product.status === 'PUBLISHED' && <Badge label="Available" variant="success" />}
              {product.deliveryAvailable && <Badge label="🚚 Delivery" variant="info" />}
              {product.qualityGrade && <Badge label={product.qualityGrade} variant="green" />}
            </View>
          </View>

          {/* Price */}
          <Text style={styles.price}>
            ₦{product.price.toLocaleString()}
            <Text style={styles.priceUnit}> / {product.priceUnit}</Text>
          </Text>
          <Text style={styles.moq}>Min. order: {product.moq} {product.quantityUnit}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{product.quantity.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Qty ({product.quantityUnit})</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{product.viewCount ?? 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>📍 {product.state}</Text>
              <Text style={styles.statLabel}>{product.lga || 'Nigeria'}</Text>
            </View>
          </View>

          {/* Description */}
          {product.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          ) : null}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailGrid}>
              {product.harvestDate && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Harvest Date</Text>
                  <Text style={styles.detailVal}>
                    {new Date(product.harvestDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              )}
              {product.processingStatus && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Processing</Text>
                  <Text style={styles.detailVal}>{product.processingStatus}</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>MOQ</Text>
                <Text style={styles.detailVal}>{product.moq} {product.quantityUnit}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Delivery</Text>
                <Text style={styles.detailVal}>{product.deliveryAvailable ? '✓ Available' : 'Pickup only'}</Text>
              </View>
            </View>
          </View>

          {/* Seller card */}
          {product.seller && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seller</Text>
              <View style={styles.sellerCard}>
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerAvatarText}>
                    {product.seller.firstName?.[0]}{product.seller.lastName?.[0]}
                  </Text>
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>
                    {product.seller.firstName} {product.seller.lastName}
                  </Text>
                  {product.seller.farmerProfile?.state && (
                    <Text style={styles.sellerLoc}>📍 {product.seller.farmerProfile.state}</Text>
                  )}
                  {product.seller.verification?.phoneVerified && (
                    <Text style={styles.sellerVerified}>✓ Verified seller</Text>
                  )}
                </View>
                {!isMine && (
                  <TouchableOpacity style={styles.waBtn}>
                    <Text style={styles.waBtnText}>💬</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Quantity selector (non-owner) */}
          {!isMine && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantity ({product.quantityUnit})</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, qty <= product.moq && styles.qtyBtnDisabled]}
                  onPress={() => setQty(q => Math.max(product.moq, q - 1))}
                  disabled={qty <= product.moq}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, qty >= product.quantity && styles.qtyBtnDisabled]}
                  onPress={() => setQty(q => Math.min(product.quantity, q + 1))}
                  disabled={qty >= product.quantity}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.qtyTotal}>
                  = ₦{(product.price * qty).toLocaleString()}
                </Text>
              </View>
              {cartQty > 0 && (
                <Text style={styles.inCartNote}>Already {cartQty} {product.quantityUnit} in cart</Text>
              )}
            </View>
          )}

          {/* Owner actions */}
          {isMine && (
            <View style={styles.section}>
              <Button
                title="Edit Listing"
                variant="outline"
                onPress={() => {/* TODO: navigate to EditListing */}}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      {!isMine && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing[3] }]}>
          <Button
            title="Add to Cart"
            variant="outline"
            fullWidth={false}
            style={styles.cartBtn}
            onPress={handleAddToCart}
          />
          <Button
            title={orderMutation.isPending ? 'Placing…' : 'Order Now'}
            variant="primary"
            fullWidth={false}
            style={styles.orderBtn}
            onPress={handleQuickOrder}
            disabled={orderMutation.isPending}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: Colors.background },

  /* Image area */
  imageContainer: { position: 'relative' },
  mainImage:      { width: '100%', height: 280 },
  noImage:        { backgroundColor: Colors.green[50], alignItems: 'center', justifyContent: 'center' },
  noImageIcon:    { fontSize: 72 },
  imageHeader:    { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing[4] },
  headerBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,.35)', alignItems: 'center', justifyContent: 'center' },
  headerBtnText:  { color: Colors.white, fontSize: 18, fontWeight: '700' },
  thumbRow:       { flexDirection: 'row', padding: Spacing[3], gap: Spacing[2], backgroundColor: Colors.white },
  thumb:          { width: 56, height: 56, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.transparent },
  thumbActive:    { borderColor: Colors.green[700] },

  /* Body */
  body:       { padding: Spacing[5] },
  titleRow:   { marginBottom: Spacing[2] },
  name:       { ...Typography.headingMedium, color: Colors.textPrimary, marginBottom: Spacing[2] },
  badgeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  price:      { ...Typography.displaySmall, color: Colors.green[700], marginBottom: Spacing[1] },
  priceUnit:  { ...Typography.bodyLarge, color: Colors.textMuted, fontWeight: '400' },
  moq:        { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing[5] },

  /* Stats */
  statsRow:   { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing[4], marginBottom: Spacing[5], borderWidth: 1, borderColor: Colors.border },
  stat:       { flex: 1, alignItems: 'center' },
  statVal:    { ...Typography.titleLarge, color: Colors.textPrimary },
  statLabel:  { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  statDiv:    { width: 1, backgroundColor: Colors.border },

  /* Sections */
  section:      { marginBottom: Spacing[5] },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing[3] },
  desc:         { ...Typography.bodyLarge, color: Colors.textSecondary, lineHeight: 24 },

  /* Details */
  detailGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  detailItem:  { width: '47%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing[3], borderWidth: 1, borderColor: Colors.border },
  detailLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  detailVal:   { ...Typography.titleMedium, color: Colors.textPrimary },

  /* Seller */
  sellerCard:       { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing[4], flexDirection: 'row', alignItems: 'center', gap: Spacing[3], borderWidth: 1, borderColor: Colors.border },
  sellerAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center' },
  sellerAvatarText: { ...Typography.titleLarge, color: Colors.white },
  sellerInfo:       { flex: 1 },
  sellerName:       { ...Typography.titleMedium, color: Colors.textPrimary },
  sellerLoc:        { ...Typography.bodySmall, color: Colors.textMuted },
  sellerVerified:   { ...Typography.bodySmall, color: Colors.green[600], fontWeight: '700' },
  waBtn:            { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.green[50], alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.green[200] },
  waBtnText:        { fontSize: 20 },

  /* Qty */
  qtyRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  qtyBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { backgroundColor: Colors.gray[200] },
  qtyBtnText:   { fontSize: 22, color: Colors.white, fontWeight: '700', lineHeight: 28 },
  qtyVal:       { ...Typography.headingMedium, color: Colors.textPrimary, minWidth: 40, textAlign: 'center' },
  qtyTotal:     { ...Typography.titleLarge, color: Colors.green[700] },
  inCartNote:   { ...Typography.bodySmall, color: Colors.green[600], marginTop: Spacing[2] },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
    flexDirection: 'row', gap: Spacing[3],
    paddingHorizontal: Spacing[5], paddingTop: Spacing[3],
    ...Shadow.lg,
  },
  cartBtn:  { flex: 1 },
  orderBtn: { flex: 2 },
});
