import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Button, Badge, LoadingState } from '@components/ui';
import { marketplaceApi, ordersApi, messagesApi } from '@services/api';
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
  const C             = useThemeColors();
  const { addItem, items, sellerId: cartSellerId } = useCartStore();
  const queryClient   = useQueryClient();

  const [imageIdx,  setImageIdx]  = useState(0);
  const [qty,       setQty]       = useState(1);
  const [saved,     setSaved]     = useState(false);
  const [messaging, setMessaging] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn:  () => marketplaceApi.getProduct(productId).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => marketplaceApi.toggleSave(productId).then(r => r.data),
    onSuccess:  (data) => setSaved(data.saved),
  });

  const orderMutation = useMutation({
    mutationFn: () => ordersApi.create({ items: [{ productId, quantity: qty }] }).then(r => r.data),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('🎉 Order Placed!', `Order ${order.orderNumber} created. Total: ₦${order.total?.toLocaleString()}`, [
        { text: 'View Order', onPress: () => (navigation as any).navigate('OrdersTab', { screen: 'OrderDetail', params: { orderId: order.id } }) },
        { text: 'OK' },
      ]);
    },
    onError: (e: any) => Alert.alert('Order Failed', e?.response?.data?.message || 'Could not place order.'),
  });

  const handleAddToCart = () => {
    if (!product) return;
    if (cartSellerId && cartSellerId !== product.sellerId) {
      Alert.alert('Different Seller', 'Adding this item will clear the current cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace Cart', style: 'destructive', onPress: () => { addItem(product, qty, true); navigation.navigate('Cart'); } },
      ]);
      return;
    }
    addItem(product, qty);
    Alert.alert('Added to Cart ✓', `${qty} × ${product.name} added.`, [
      { text: 'Keep Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  const handleQuickOrder = () => {
    Alert.alert('Confirm Order', `Place order for ${qty} ${product?.priceUnit} of ${product?.name}?\nTotal: ₦${((product?.price || 0) * qty * 1.0205).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Place Order', onPress: () => orderMutation.mutate() },
    ]);
  };

  const handleAskSeller = async () => {
    if (!product) return;
    setMessaging(true);
    try {
      const res = await messagesApi.getOrCreateConversation(product.sellerId, product.id, undefined);
      const conv = res.data;
      (navigation as any).navigate('MessagesTab', { screen: 'Chat', params: {
        conversationId: conv.id, recipientId: product.sellerId,
        recipientName: `${product.seller?.firstName ?? ''} ${product.seller?.lastName ?? ''}`.trim(),
        recipientRole: product.seller?.role ?? 'FARMER', productId: product.id, productName: product.name,
      }});
    } catch { Alert.alert('Error', 'Could not open conversation. Please try again.'); }
    finally { setMessaging(false); }
  };

  if (isLoading) return <LoadingState fullScreen message="Loading product…" />;
  if (!product)  return null;

  const isMine  = product.sellerId === user?.id;
  const images  = product.images?.length ? product.images : [];
  const cartQty = items.find(i => i.productId === productId)?.quantity || 0;
  const s       = makeStyles(C);

  return (
    <View style={s.flex}>
      <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={s.imageContainer}>
          {images.length > 0
            ? <Image source={{ uri: images[imageIdx] }} style={s.mainImage} resizeMode="cover" />
            : <View style={[s.mainImage, s.noImage]}><Text style={s.noImageIcon}>🌾</Text></View>
          }
          <View style={[s.imageHeader, { paddingTop: insets.top + Spacing[2] }]}>
            <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}><Text style={s.headerBtnText}>←</Text></TouchableOpacity>
            <TouchableOpacity style={s.headerBtn} onPress={() => saveMutation.mutate()}><Text style={s.headerBtnText}>{saved ? '❤️' : '🤍'}</Text></TouchableOpacity>
          </View>
          {images.length > 1 && (
            <View style={s.thumbRow}>
              {images.map((uri, i) => (
                <TouchableOpacity key={i} onPress={() => setImageIdx(i)}>
                  <Image source={{ uri }} style={[s.thumb, i === imageIdx && s.thumbActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={s.body}>
          <View style={s.titleRow}>
            <Text style={s.name}>{product.name}</Text>
            <View style={s.badgeRow}>
              {product.status === 'PUBLISHED' && <Badge label="Available" variant="success" />}
              {product.deliveryAvailable && <Badge label="🚚 Delivery" variant="info" />}
              {product.qualityGrade && <Badge label={product.qualityGrade} variant="green" />}
            </View>
          </View>
          <Text style={s.price}>₦{product.price.toLocaleString()}<Text style={s.priceUnit}> / {product.priceUnit}</Text></Text>
          <Text style={s.moq}>Min. order: {product.moq} {product.quantityUnit}</Text>
          <View style={s.statsRow}>
            <View style={s.stat}><Text style={s.statVal}>{product.quantity.toLocaleString()}</Text><Text style={s.statLabel}>Qty ({product.quantityUnit})</Text></View>
            <View style={s.statDiv} />
            <View style={s.stat}><Text style={s.statVal}>{product.viewCount ?? 0}</Text><Text style={s.statLabel}>Views</Text></View>
            <View style={s.statDiv} />
            <View style={s.stat}><Text style={s.statVal}>📍 {product.state}</Text><Text style={s.statLabel}>{product.lga || 'Nigeria'}</Text></View>
          </View>
          {product.description ? (
            <View style={s.section}><Text style={s.sectionTitle}>Description</Text><Text style={s.desc}>{product.description}</Text></View>
          ) : null}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Product Details</Text>
            <View style={s.detailGrid}>
              {product.harvestDate && <View style={s.detailItem}><Text style={s.detailLabel}>Harvest Date</Text><Text style={s.detailVal}>{new Date(product.harvestDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text></View>}
              {product.processingStatus && <View style={s.detailItem}><Text style={s.detailLabel}>Processing</Text><Text style={s.detailVal}>{product.processingStatus}</Text></View>}
              <View style={s.detailItem}><Text style={s.detailLabel}>MOQ</Text><Text style={s.detailVal}>{product.moq} {product.quantityUnit}</Text></View>
              <View style={s.detailItem}><Text style={s.detailLabel}>Delivery</Text><Text style={s.detailVal}>{product.deliveryAvailable ? '✓ Available' : 'Pickup only'}</Text></View>
            </View>
          </View>
          {product.seller && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Seller</Text>
              <View style={s.sellerCard}>
                <View style={s.sellerAvatar}><Text style={s.sellerAvatarText}>{product.seller.firstName?.[0]}{product.seller.lastName?.[0]}</Text></View>
                <View style={s.sellerInfo}>
                  <Text style={s.sellerName}>{product.seller.firstName} {product.seller.lastName}</Text>
                  {product.seller.farmerProfile?.state && <Text style={s.sellerLoc}>📍 {product.seller.farmerProfile.state}</Text>}
                  {product.seller.verification?.phoneVerified && <Text style={s.sellerVerified}>✓ Verified seller</Text>}
                </View>
                {!isMine && (
                  <TouchableOpacity style={[s.waBtn, messaging && { opacity: 0.6 }]} onPress={handleAskSeller} disabled={messaging}>
                    <Text style={s.waBtnText}>{messaging ? '⏳' : '💬'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          {!isMine && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Quantity ({product.quantityUnit})</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity style={[s.qtyBtn, qty <= product.moq && s.qtyBtnDisabled]} onPress={() => setQty(q => Math.max(product.moq, q - 1))} disabled={qty <= product.moq}>
                  <Text style={s.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyVal}>{qty}</Text>
                <TouchableOpacity style={[s.qtyBtn, qty >= product.quantity && s.qtyBtnDisabled]} onPress={() => setQty(q => Math.min(product.quantity, q + 1))} disabled={qty >= product.quantity}>
                  <Text style={s.qtyBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={s.qtyTotal}>= ₦{(product.price * qty).toLocaleString()}</Text>
              </View>
              {cartQty > 0 && <Text style={s.inCartNote}>Already {cartQty} {product.quantityUnit} in cart</Text>}
            </View>
          )}
          {isMine && <View style={s.section}><Button title="Edit Listing" variant="outline" onPress={() => {}} /></View>}
        </View>
      </ScrollView>
      {!isMine && (
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + Spacing[3] }]}>
          <Button title={messaging ? '⏳' : '💬 Ask'} variant="outline" fullWidth={false} style={s.askBtn} onPress={handleAskSeller} disabled={messaging} />
          <Button title="Add to Cart" variant="outline" fullWidth={false} style={s.cartBtn} onPress={handleAddToCart} />
          <Button title={orderMutation.isPending ? 'Placing…' : 'Order Now'} variant="primary" fullWidth={false} style={s.orderBtn} onPress={handleQuickOrder} disabled={orderMutation.isPending} />
        </View>
      )}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:             { flex: 1, backgroundColor: C.background },
    imageContainer:   { position: 'relative' },
    mainImage:        { width: '100%', height: 280 },
    noImage:          { backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center' },
    noImageIcon:      { fontSize: 72 },
    imageHeader:      { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing[4] },
    headerBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,.35)', alignItems: 'center', justifyContent: 'center' },
    headerBtnText:    { color: '#ffffff', fontSize: 18, fontWeight: '700' },
    thumbRow:         { flexDirection: 'row', padding: Spacing[3], gap: Spacing[2], backgroundColor: C.white },
    thumb:            { width: 56, height: 56, borderRadius: Radius.md, borderWidth: 2, borderColor: C.transparent },
    thumbActive:      { borderColor: C.green[700] },
    body:             { padding: Spacing[5] },
    titleRow:         { marginBottom: Spacing[2] },
    name:             { ...Typography.headingMedium, color: C.textPrimary, marginBottom: Spacing[2] },
    badgeRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
    price:            { ...Typography.displaySmall, color: C.green[700], marginBottom: Spacing[1] },
    priceUnit:        { ...Typography.bodyLarge, color: C.textMuted, fontWeight: '400' },
    moq:              { ...Typography.bodySmall, color: C.textMuted, marginBottom: Spacing[5] },
    statsRow:         { flexDirection: 'row', backgroundColor: C.white, borderRadius: Radius.xl, padding: Spacing[4], marginBottom: Spacing[5], borderWidth: 1, borderColor: C.border },
    stat:             { flex: 1, alignItems: 'center' },
    statVal:          { ...Typography.titleLarge, color: C.textPrimary },
    statLabel:        { ...Typography.caption, color: C.textMuted, marginTop: 2 },
    statDiv:          { width: 1, backgroundColor: C.border },
    section:          { marginBottom: Spacing[5] },
    sectionTitle:     { ...Typography.labelLarge, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing[3] },
    desc:             { ...Typography.bodyLarge, color: C.textSecondary, lineHeight: 24 },
    detailGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
    detailItem:       { width: '47%', backgroundColor: C.white, borderRadius: Radius.lg, padding: Spacing[3], borderWidth: 1, borderColor: C.border },
    detailLabel:      { ...Typography.caption, color: C.textMuted, marginBottom: 4 },
    detailVal:        { ...Typography.titleMedium, color: C.textPrimary },
    sellerCard:       { backgroundColor: C.white, borderRadius: Radius.xl, padding: Spacing[4], flexDirection: 'row', alignItems: 'center', gap: Spacing[3], borderWidth: 1, borderColor: C.border },
    sellerAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: C.green[700], alignItems: 'center', justifyContent: 'center' },
    sellerAvatarText: { ...Typography.titleLarge, color: '#ffffff' },
    sellerInfo:       { flex: 1 },
    sellerName:       { ...Typography.titleMedium, color: C.textPrimary },
    sellerLoc:        { ...Typography.bodySmall, color: C.textMuted },
    sellerVerified:   { ...Typography.bodySmall, color: C.green[600], fontWeight: '700' },
    waBtn:            { width: 40, height: 40, borderRadius: 20, backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.green[200] },
    waBtnText:        { fontSize: 20 },
    qtyRow:           { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
    qtyBtn:           { width: 44, height: 44, borderRadius: 22, backgroundColor: C.green[700], alignItems: 'center', justifyContent: 'center' },
    qtyBtnDisabled:   { backgroundColor: C.gray[200] },
    qtyBtnText:       { fontSize: 22, color: '#ffffff', fontWeight: '700', lineHeight: 28 },
    qtyVal:           { ...Typography.headingMedium, color: C.textPrimary, minWidth: 40, textAlign: 'center' },
    qtyTotal:         { ...Typography.titleLarge, color: C.green[700] },
    inCartNote:       { ...Typography.bodySmall, color: C.green[600], marginTop: Spacing[2] },
    bottomBar:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', gap: Spacing[3], paddingHorizontal: Spacing[5], paddingTop: Spacing[3], ...Shadow.lg },
    cartBtn:          { flex: 1 },
    orderBtn:         { flex: 2 },
    askBtn:           { flex: 1 },
  });
}
