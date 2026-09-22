import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { ProductCard, SearchBar, Badge } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { marketplaceApi, categoriesApi, notificationsApi } from '@services/api';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { MainTabParamList, MarketStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
    StackNavigationProp<MarketStackParamList>
  >;
};

function greetingText() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning 👋';
  if (h < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

export function HomeScreen({ navigation }: Props) {
  const insets    = useSafeAreaInsets();
  const { user }  = useAuthStore();
  const C         = useThemeColors();
  const [search,    setSearch]    = useState('');
  const [refreshing, setRefresh]  = useState(false);

  const { data: categories, refetch: refetchCats } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.getAll().then(r => r.data),
    retry: 0,
  });

  const { data: featuredData, refetch: refetchFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn:  () => marketplaceApi.search({ limit: 8, page: 1 }).then(r => r.data),
    retry: 0,
  });

  const { data: pricesData } = useQuery({
    queryKey: ['market-prices'],
    queryFn:  () => marketplaceApi.getMarketPrices().then(r => r.data),
    retry: 0,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications-meta'],
    queryFn:  () => notificationsApi.getAll({ limit: 1 }).then(r => r.data),
    refetchInterval: false,
    retry: 0,
  });

  const unread   = notifData?.meta?.unread ?? 0;
  const featured = featuredData?.data ?? [];
  const prices   = pricesData ?? [];
  const isFarmer = ['FARMER','TRADER','AGGREGATOR','PROCESSOR','EXPORTER','HAULAGE'].includes(user?.role ?? '');

  const onRefresh = async () => {
    setRefresh(true);
    await Promise.all([refetchCats(), refetchFeatured()]);
    setRefresh(false);
  };

  const goToProduct = (productId: string) =>
    (navigation as any).navigate('MarketTab', { screen: 'ProductDetail', params: { productId } });
  const goToMarket = (catId?: string) =>
    (navigation as any).navigate('MarketTab', { screen: 'MarketHome', params: catId ? { initialCatId: catId } : undefined });

  const s = makeStyles(C);

  return (
    <ScrollView
      style={s.flex}
      contentContainerStyle={{ paddingBottom: Spacing[10] }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green[700]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing[4] }]}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>{greetingText()}</Text>
            <Text style={s.userName}>{user?.firstName} {user?.lastName}</Text>
            <Badge label={user?.role ?? 'User'} variant="green" size="sm" style={s.roleBadge} />
          </View>
          <TouchableOpacity style={s.notifBtn} onPress={() => (navigation as any).navigate('ProfileTab')}>
            <Text style={s.notifIcon}>🔔</Text>
            {unread > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search ginger, maize, yam…" onSubmit={() => goToMarket()} style={s.searchBar} />
      </View>

      {/* Seller CTA */}
      {isFarmer && (
        <TouchableOpacity style={s.sellerBanner} activeOpacity={0.85} onPress={() => (navigation as any).navigate('MarketTab', { screen: 'CreateListing' })}>
          <Text style={s.sellerBannerEmoji}>🌾</Text>
          <View style={s.sellerBannerText}>
            <Text style={s.sellerBannerTitle}>List Your Produce</Text>
            <Text style={s.sellerBannerSub}>Reach buyers across Nigeria →</Text>
          </View>
          <View style={s.sellerBannerArrow}><Text style={s.sellerBannerArrowText}>+</Text></View>
        </TouchableOpacity>
      )}

      {/* Quick actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {[
            { emoji: '🔍', label: 'Browse All',   action: () => goToMarket() },
            { emoji: '🗺️', label: 'Smart Map',    action: () => (navigation as any).navigate('SmartMap') },
            { emoji: '📦', label: 'My Orders',    action: () => (navigation as any).navigate('OrdersTab') },
            { emoji: '👤', label: 'My Profile',   action: () => (navigation as any).navigate('ProfileTab') },
          ].map(item => (
            <TouchableOpacity key={item.label} style={s.quickCard} onPress={item.action} activeOpacity={0.8}>
              <Text style={s.quickEmoji}>{item.emoji}</Text>
              <Text style={s.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Categories</Text>
            <TouchableOpacity onPress={() => goToMarket()}><Text style={s.seeAll}>See all →</Text></TouchableOpacity>
          </View>
          <FlatList
            horizontal data={categories.slice(0, 10)} keyExtractor={i => i.id}
            showsHorizontalScrollIndicator={false} contentContainerStyle={s.catList}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.catCard} onPress={() => goToMarket(item.id)} activeOpacity={0.8}>
                <View style={s.catIcon}><Text style={s.catIconText}>{item.icon || '📦'}</Text></View>
                <Text style={s.catName} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Prices ticker */}
      {prices.length > 0 && (
        <View style={s.pricesBanner}>
          <Text style={s.pricesBannerLabel}>📊 Today's Prices</Text>
          <FlatList
            horizontal data={prices.slice(0, 8)} keyExtractor={i => i.id}
            showsHorizontalScrollIndicator={false} contentContainerStyle={s.pricesList}
            renderItem={({ item }) => (
              <View style={s.priceChip}>
                <Text style={s.priceProduct}>{item.product}</Text>
                <Text style={s.priceVal}>₦{item.priceAvg?.toLocaleString()}/{item.unit}</Text>
                <Text style={s.priceState}>📍 {item.state}</Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Featured products */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Fresh Listings</Text>
          <TouchableOpacity onPress={() => goToMarket()}><Text style={s.seeAll}>See all →</Text></TouchableOpacity>
        </View>
        {featured.length === 0 ? (
          <View style={s.emptyFeatured}>
            <Text style={s.emptyFeaturedIcon}>🌱</Text>
            <Text style={s.emptyFeaturedText}>No listings yet. Be the first to list!</Text>
          </View>
        ) : (
          <FlatList
            horizontal data={featured} keyExtractor={i => i.id}
            showsHorizontalScrollIndicator={false} contentContainerStyle={s.featuredList}
            renderItem={({ item }) => (
              <View style={s.featuredCard}>
                <ProductCard {...item} sellerName={`${item.seller?.firstName ?? ''} ${item.seller?.lastName ?? ''}`.trim()} onPress={() => goToProduct(item.id)} />
              </View>
            )}
          />
        )}
      </View>

      {/* Trust banner */}
      <View style={s.trustBanner}>
        {[
          { emoji: '✅', text: 'Verified Sellers' },
          { emoji: '🔒', text: 'Secure Orders' },
          { emoji: '🚚', text: 'Fast Delivery' },
        ].map((item, i) => (
          <React.Fragment key={item.text}>
            {i > 0 && <View style={s.trustDiv} />}
            <View style={s.trustItem}>
              <Text style={s.trustEmoji}>{item.emoji}</Text>
              <Text style={s.trustText}>{item.text}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:          { flex: 1, backgroundColor: C.background },
    header:        { backgroundColor: C.green[700], paddingHorizontal: Spacing[5], paddingBottom: Spacing[5] },
    headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[4] },
    greeting:      { ...Typography.bodyMedium, color: 'rgba(255,255,255,.8)' },
    userName:      { ...Typography.headingSmall, color: '#ffffff' },
    roleBadge:     { marginTop: Spacing[1] },
    notifBtn:      { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    notifIcon:     { fontSize: 20 },
    notifBadge:    { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    notifBadgeText:{ fontSize: 10, fontWeight: '800', color: '#ffffff' },
    searchBar:     { backgroundColor: 'rgba(255,255,255,.95)' },
    sellerBanner:  { margin: Spacing[4], backgroundColor: C.gold[600], borderRadius: Radius.xl, padding: Spacing[4], flexDirection: 'row', alignItems: 'center', gap: Spacing[3], ...Shadow.green },
    sellerBannerEmoji:    { fontSize: 32 },
    sellerBannerText:     { flex: 1 },
    sellerBannerTitle:    { ...Typography.titleLarge, color: '#ffffff' },
    sellerBannerSub:      { ...Typography.bodySmall, color: 'rgba(255,255,255,.85)', marginTop: 2 },
    sellerBannerArrow:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.25)', alignItems: 'center', justifyContent: 'center' },
    sellerBannerArrowText:{ fontSize: 22, color: '#ffffff', fontWeight: '700' },
    section:       { padding: Spacing[5] },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
    sectionTitle:  { ...Typography.titleLarge, color: C.textPrimary },
    seeAll:        { ...Typography.labelLarge, color: C.green[600] },
    quickGrid:     { flexDirection: 'row', gap: Spacing[3] },
    quickCard:     { flex: 1, backgroundColor: C.white, borderRadius: Radius.xl, padding: Spacing[4], alignItems: 'center', borderWidth: 1, borderColor: C.border, ...Shadow.sm },
    quickEmoji:    { fontSize: 26, marginBottom: Spacing[2] },
    quickLabel:    { ...Typography.caption, color: C.textSecondary, fontWeight: '700', textAlign: 'center' },
    catList:       { paddingLeft: 0, paddingRight: Spacing[2], gap: Spacing[3] },
    catCard:       { alignItems: 'center', width: 70 },
    catIcon:       { width: 54, height: 54, borderRadius: 27, backgroundColor: C.green[50], alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2], borderWidth: 1, borderColor: C.green[200] },
    catIconText:   { fontSize: 26 },
    catName:       { ...Typography.caption, color: C.textSecondary, textAlign: 'center', fontWeight: '600' },
    pricesBanner:  { backgroundColor: C.green[900], paddingVertical: Spacing[4], marginBottom: Spacing[2] },
    pricesBannerLabel: { ...Typography.labelLarge, color: 'rgba(255,255,255,.7)', paddingHorizontal: Spacing[5], marginBottom: Spacing[3] },
    pricesList:    { paddingHorizontal: Spacing[4], gap: Spacing[3] },
    priceChip:     { backgroundColor: 'rgba(255,255,255,.08)', borderRadius: Radius.lg, padding: Spacing[3], borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', minWidth: 110 },
    priceProduct:  { ...Typography.labelLarge, color: '#ffffff', marginBottom: 2 },
    priceVal:      { ...Typography.titleMedium, color: C.green[300] },
    priceState:    { ...Typography.caption, color: 'rgba(255,255,255,.5)', marginTop: 2 },
    featuredList:  { paddingRight: Spacing[2], gap: Spacing[3] },
    featuredCard:  { width: 200 },
    emptyFeatured: { alignItems: 'center', padding: Spacing[8], backgroundColor: C.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: C.border },
    emptyFeaturedIcon: { fontSize: 40, marginBottom: Spacing[3] },
    emptyFeaturedText: { ...Typography.bodyMedium, color: C.textMuted, textAlign: 'center' },
    trustBanner:   { flexDirection: 'row', backgroundColor: C.white, marginHorizontal: Spacing[5], borderRadius: Radius.xl, padding: Spacing[4], borderWidth: 1, borderColor: C.border },
    trustItem:     { flex: 1, alignItems: 'center', gap: Spacing[1] },
    trustEmoji:    { fontSize: 20 },
    trustText:     { ...Typography.caption, color: C.textSecondary, fontWeight: '600', textAlign: 'center' },
    trustDiv:      { width: 1, backgroundColor: C.border },
  });
}
