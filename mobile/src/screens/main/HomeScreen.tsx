import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '@theme/index';
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
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [search, setSearch]     = useState('');
  const [refreshing, setRefresh] = useState(false);

  /* ── Data fetches ── */
  const { data: categories, refetch: refetchCats } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.getAll().then(r => r.data),
  });

  const { data: featuredData, refetch: refetchFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn:  () => marketplaceApi.search({ limit: 8, page: 1 }).then(r => r.data),
  });

  const { data: pricesData } = useQuery({
    queryKey: ['market-prices'],
    queryFn:  () => marketplaceApi.getMarketPrices().then(r => r.data),
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications-meta'],
    queryFn:  () => notificationsApi.getAll({ limit: 1 }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const unread      = notifData?.meta?.unread ?? 0;
  const featured    = featuredData?.data ?? [];
  const prices      = pricesData ?? [];
  const isFarmer    = ['FARMER','TRADER','AGGREGATOR','PROCESSOR','EXPORTER','HAULAGE'].includes(user?.role ?? '');

  const onRefresh = async () => {
    setRefresh(true);
    await Promise.all([refetchCats(), refetchFeatured()]);
    setRefresh(false);
  };

  const goToProduct = (productId: string) => {
    (navigation as any).navigate('MarketTab', {
      screen: 'ProductDetail',
      params: { productId },
    });
  };

  const goToMarket = (catId?: string) => {
    (navigation as any).navigate('MarketTab', {
      screen: 'MarketHome',
      params: catId ? { initialCatId: catId } : undefined,
    });
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: Spacing[10] }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green[700]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[4] }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greetingText()}</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <Badge label={user?.role ?? 'User'} variant="green" size="sm" style={styles.roleBadge} />
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => (navigation as any).navigate('ProfileTab')}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            {unread > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search ginger, maize, yam…"
          onSubmit={() => goToMarket()}
          style={styles.searchBar}
        />
      </View>

      {/* ── Seller CTA (farmers/traders only) ── */}
      {isFarmer && (
        <TouchableOpacity
          style={styles.sellerBanner}
          activeOpacity={0.85}
          onPress={() => (navigation as any).navigate('MarketTab', { screen: 'CreateListing' })}
        >
          <Text style={styles.sellerBannerEmoji}>🌾</Text>
          <View style={styles.sellerBannerText}>
            <Text style={styles.sellerBannerTitle}>List Your Produce</Text>
            <Text style={styles.sellerBannerSub}>Reach buyers across Nigeria →</Text>
          </View>
          <View style={styles.sellerBannerArrow}>
            <Text style={styles.sellerBannerArrowText}>+</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Quick actions ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {[
            { emoji: '🔍', label: 'Browse All',   action: () => goToMarket() },
            { emoji: '🗺️', label: 'Smart Map',    action: () => (navigation as any).navigate('SmartMap') },
            { emoji: '📦', label: 'My Orders',    action: () => (navigation as any).navigate('OrdersTab') },
            { emoji: '👤', label: 'My Profile',   action: () => (navigation as any).navigate('ProfileTab') },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.quickCard} onPress={item.action} activeOpacity={0.8}>
              <Text style={styles.quickEmoji}>{item.emoji}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Categories ── */}
      {categories && categories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity onPress={() => goToMarket()}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={categories.slice(0, 10)}
            keyExtractor={i => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.catCard}
                onPress={() => goToMarket(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.catIcon}><Text style={styles.catIconText}>{item.icon || '📦'}</Text></View>
                <Text style={styles.catName} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── Market prices ticker ── */}
      {prices.length > 0 && (
        <View style={styles.pricesBanner}>
          <Text style={styles.pricesBannerLabel}>📊 Today's Prices</Text>
          <FlatList
            horizontal
            data={prices.slice(0, 8)}
            keyExtractor={i => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pricesList}
            renderItem={({ item }) => (
              <View style={styles.priceChip}>
                <Text style={styles.priceProduct}>{item.product}</Text>
                <Text style={styles.priceVal}>₦{item.priceAvg?.toLocaleString()}/{item.unit}</Text>
                <Text style={styles.priceState}>📍 {item.state}</Text>
              </View>
            )}
          />
        </View>
      )}

      {/* ── Featured products ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fresh Listings</Text>
          <TouchableOpacity onPress={() => goToMarket()}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {featured.length === 0 ? (
          <View style={styles.emptyFeatured}>
            <Text style={styles.emptyFeaturedIcon}>🌱</Text>
            <Text style={styles.emptyFeaturedText}>No listings yet. Be the first to list!</Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={featured}
            keyExtractor={i => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            renderItem={({ item }) => (
              <View style={styles.featuredCard}>
                <ProductCard
                  {...item}
                  sellerName={`${item.seller?.firstName ?? ''} ${item.seller?.lastName ?? ''}`.trim()}
                  onPress={() => goToProduct(item.id)}
                />
              </View>
            )}
          />
        )}
      </View>

      {/* ── Trust banner ── */}
      <View style={styles.trustBanner}>
        <View style={styles.trustItem}>
          <Text style={styles.trustEmoji}>✅</Text>
          <Text style={styles.trustText}>Verified Sellers</Text>
        </View>
        <View style={styles.trustDiv} />
        <View style={styles.trustItem}>
          <Text style={styles.trustEmoji}>🔒</Text>
          <Text style={styles.trustText}>Secure Orders</Text>
        </View>
        <View style={styles.trustDiv} />
        <View style={styles.trustItem}>
          <Text style={styles.trustEmoji}>🚚</Text>
          <Text style={styles.trustText}>Fast Delivery</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header:        { backgroundColor: Colors.green[700], paddingHorizontal: Spacing[5], paddingBottom: Spacing[5] },
  headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[4] },
  greeting:      { ...Typography.bodyMedium, color: 'rgba(255,255,255,.8)' },
  userName:      { ...Typography.headingSmall, color: Colors.white },
  roleBadge:     { marginTop: Spacing[1] },
  notifBtn:      { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifIcon:     { fontSize: 20 },
  notifBadge:    { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  searchBar:     { backgroundColor: 'rgba(255,255,255,.95)' },

  /* Seller CTA */
  sellerBanner:  { margin: Spacing[4], backgroundColor: Colors.gold[600], borderRadius: Radius.xl, padding: Spacing[4], flexDirection: 'row', alignItems: 'center', gap: Spacing[3], ...Shadow.green },
  sellerBannerEmoji:   { fontSize: 32 },
  sellerBannerText:    { flex: 1 },
  sellerBannerTitle:   { ...Typography.titleLarge, color: Colors.white },
  sellerBannerSub:     { ...Typography.bodySmall, color: 'rgba(255,255,255,.85)', marginTop: 2 },
  sellerBannerArrow:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.25)', alignItems: 'center', justifyContent: 'center' },
  sellerBannerArrowText: { fontSize: 22, color: Colors.white, fontWeight: '700' },

  /* Sections */
  section:       { padding: Spacing[5] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
  sectionTitle:  { ...Typography.titleLarge, color: Colors.textPrimary },
  seeAll:        { ...Typography.labelLarge, color: Colors.green[600] },

  /* Quick actions */
  quickGrid:     { flexDirection: 'row', gap: Spacing[3] },
  quickCard:     { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing[4], alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  quickEmoji:    { fontSize: 26, marginBottom: Spacing[2] },
  quickLabel:    { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700', textAlign: 'center' },

  /* Categories */
  catList:       { paddingLeft: 0, paddingRight: Spacing[2], gap: Spacing[3] },
  catCard:       { alignItems: 'center', width: 70 },
  catIcon:       { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.green[50], alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2], borderWidth: 1, borderColor: Colors.green[200] },
  catIconText:   { fontSize: 26 },
  catName:       { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },

  /* Market prices */
  pricesBanner:  { backgroundColor: Colors.green[900], paddingVertical: Spacing[4], marginBottom: Spacing[2] },
  pricesBannerLabel: { ...Typography.labelLarge, color: 'rgba(255,255,255,.7)', paddingHorizontal: Spacing[5], marginBottom: Spacing[3] },
  pricesList:    { paddingHorizontal: Spacing[4], gap: Spacing[3] },
  priceChip:     { backgroundColor: 'rgba(255,255,255,.08)', borderRadius: Radius.lg, padding: Spacing[3], borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', minWidth: 110 },
  priceProduct:  { ...Typography.labelLarge, color: Colors.white, marginBottom: 2 },
  priceVal:      { ...Typography.titleMedium, color: Colors.green[300] },
  priceState:    { ...Typography.caption, color: 'rgba(255,255,255,.5)', marginTop: 2 },

  /* Featured */
  featuredList:  { paddingRight: Spacing[2], gap: Spacing[3] },
  featuredCard:  { width: 200 },
  emptyFeatured: { alignItems: 'center', padding: Spacing[8], backgroundColor: Colors.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  emptyFeaturedIcon: { fontSize: 40, marginBottom: Spacing[3] },
  emptyFeaturedText: { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center' },

  /* Trust */
  trustBanner:   { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing[5], borderRadius: Radius.xl, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border },
  trustItem:     { flex: 1, alignItems: 'center', gap: Spacing[1] },
  trustEmoji:    { fontSize: 20 },
  trustText:     { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  trustDiv:      { width: 1, backgroundColor: Colors.border },
});
