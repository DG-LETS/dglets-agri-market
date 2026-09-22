import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useThemeColors, Typography, Spacing, Radius } from '@theme/index';
import { SearchBar, ProductCard, LoadingState, EmptyState } from '@components/ui';
import { marketplaceApi, categoriesApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { MarketStackParamList } from '@navigation/MainNavigator';

const SELLER_ROLES = ['FARMER','TRADER','AGGREGATOR','PROCESSOR','EXPORTER','HAULAGE'];
type GeoCoords = { lat: number; lng: number } | null;
type Props = {
  navigation: StackNavigationProp<MarketStackParamList, 'MarketHome'>;
  route:      RouteProp<MarketStackParamList, 'MarketHome'>;
};

export function MarketScreen({ navigation, route }: Props) {
  const insets       = useSafeAreaInsets();
  const { user }     = useAuthStore();
  const C            = useThemeColors();
  const isSeller     = SELLER_ROLES.includes(user?.role ?? '');
  const initialCatId = route.params?.initialCatId;

  const [search,     setSearch]     = useState('');
  const [catId,      setCatId]      = useState<string | undefined>(initialCatId);
  const [query,      setQuery]      = useState('');
  const [nearMe,     setNearMe]     = useState(false);
  const [userCoords, setUserCoords] = useState<GeoCoords>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [radiusKm,   setRadiusKm]   = useState(50);

  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll().then(r => r.data) });

  const { data, isLoading } = useQuery({
    queryKey: ['products', query, catId, nearMe, userCoords, radiusKm],
    queryFn:  () => marketplaceApi.search({
      keyword: query || undefined, categoryId: catId,
      ...(nearMe && userCoords ? { lat: userCoords.lat, lng: userCoords.lng, radiusKm } : {}),
    }).then(r => r.data),
  });

  const products = data?.data ?? [];
  const RADIUS_OPTIONS = [10, 25, 50, 100, 200];
  const cycleRadius = () => {
    const idx = RADIUS_OPTIONS.indexOf(radiusKm);
    setRadiusKm(RADIUS_OPTIONS[(idx + 1) % RADIUS_OPTIONS.length]);
  };

  const handleNearMeToggle = useCallback(async () => {
    if (nearMe) { setNearMe(false); setUserCoords(null); return; }
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('📍 Location Permission', 'Allow location access in Settings.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setNearMe(true);
    } catch { Alert.alert('Location Error', 'Could not get your location.'); }
    finally { setLocLoading(false); }
  }, [nearMe]);

  const s = makeStyles(C);

  return (
    <View style={[s.flex, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <Text style={s.title}>Marketplace</Text>
          <View style={s.titleActions}>
            <TouchableOpacity style={[s.nearMeBtn, nearMe && s.nearMeBtnActive]} onPress={handleNearMeToggle} disabled={locLoading} activeOpacity={0.8}>
              <Text style={[s.nearMeBtnText, nearMe && s.nearMeBtnTextActive]}>{locLoading ? '📍…' : nearMe ? `📍 ${radiusKm}km` : '📍 Near Me'}</Text>
            </TouchableOpacity>
            {nearMe && <TouchableOpacity style={s.radiusBtn} onPress={cycleRadius}><Text style={s.radiusBtnText}>⇄</Text></TouchableOpacity>}
            {isSeller && <TouchableOpacity style={s.listBtn} onPress={() => navigation.navigate('CreateListing')}><Text style={s.listBtnText}>+ List</Text></TouchableOpacity>}
          </View>
        </View>
        <SearchBar value={search} onChangeText={setSearch} onSubmit={() => setQuery(search)} onClear={() => { setSearch(''); setQuery(''); }} style={s.search} />
      </View>
      {nearMe && (
        <View style={s.nearMeBanner}>
          <Text style={s.nearMeBannerText}>📍 Showing farms & sellers within {radiusKm}km · Sorted by distance</Text>
          <TouchableOpacity onPress={() => { setNearMe(false); setUserCoords(null); }}><Text style={s.nearMeBannerClose}>✕</Text></TouchableOpacity>
        </View>
      )}
      {cats && (
        <FlatList horizontal data={[{ id: undefined, name: 'All', icon: '🌾' }, ...cats] as any[]}
          keyExtractor={(_item, i) => String(i)} showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catList}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.catChip, catId === item.id && s.catChipActive]} onPress={() => setCatId(item.id)}>
              <Text style={s.catIcon}>{item.icon || '📦'}</Text>
              <Text style={[s.catName, catId === item.id && s.catNameActive]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      {isLoading ? <LoadingState message={nearMe ? 'Finding nearby farmers…' : 'Loading products…'} /> : products.length === 0 ? (
        <EmptyState icon={nearMe ? '📍' : '🔍'}
          title={nearMe ? `No farms within ${radiusKm}km` : 'No products found'}
          description={nearMe ? `Try increasing the radius by tapping ⇄.` : 'Try a different search or category.'}
          actionLabel={nearMe ? `Expand to ${RADIUS_OPTIONS[Math.min(RADIUS_OPTIONS.indexOf(radiusKm) + 1, RADIUS_OPTIONS.length - 1)]}km` : 'Clear search'}
          onAction={nearMe ? cycleRadius : () => { setSearch(''); setQuery(''); setCatId(undefined); }} />
      ) : (
        <FlatList data={products} keyExtractor={item => item.id} numColumns={2}
          columnWrapperStyle={s.row} contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.cardWrap}>
              <ProductCard {...item} sellerName={`${item.seller?.firstName || ''} ${item.seller?.lastName || ''}`.trim()}
                isVerified={item.seller?.isVerified === true} distanceKm={item.distanceKm ?? undefined}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:               { flex: 1, backgroundColor: C.background },
    header:             { backgroundColor: C.white, paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[3], borderBottomWidth: 1, borderBottomColor: C.border },
    titleRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
    title:              { ...Typography.headingMedium, color: C.textPrimary },
    titleActions:       { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    nearMeBtn:          { backgroundColor: C.gray[100], borderRadius: 50, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: C.border },
    nearMeBtnActive:    { backgroundColor: C.green[700], borderColor: C.green[700] },
    nearMeBtnText:      { ...Typography.labelMedium, color: C.textSecondary },
    nearMeBtnTextActive:{ color: '#ffffff', fontWeight: '700' },
    radiusBtn:          { backgroundColor: C.green[50], borderRadius: 50, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.green[200] },
    radiusBtnText:      { fontSize: 16, color: C.green[700] },
    listBtn:            { backgroundColor: C.green[700], borderRadius: 20, paddingVertical: Spacing[2], paddingHorizontal: Spacing[4] },
    listBtnText:        { ...Typography.labelLarge, color: '#ffffff' },
    search:             {},
    nearMeBanner:       { backgroundColor: C.green[50], borderBottomWidth: 1, borderBottomColor: C.green[100], paddingHorizontal: Spacing[5], paddingVertical: Spacing[2], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    nearMeBannerText:   { ...Typography.bodySmall, color: C.green[700], flex: 1 },
    nearMeBannerClose:  { fontSize: 16, color: C.green[700], paddingLeft: Spacing[3] },
    catList:            { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[2] },
    catChip:            { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.white, borderRadius: 50, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: C.border },
    catChipActive:      { borderColor: C.green[700], backgroundColor: C.green[50] },
    catIcon:            { fontSize: 16 },
    catName:            { ...Typography.labelMedium, color: C.textSecondary },
    catNameActive:      { color: C.green[700], fontWeight: '700' },
    list:               { padding: Spacing[3] },
    row:                { gap: Spacing[3], marginBottom: Spacing[3] },
    cardWrap:           { flex: 1 },
  });
}
