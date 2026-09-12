import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing } from '@theme/index';
import { SearchBar, ProductCard, LoadingState, EmptyState } from '@components/ui';
import { marketplaceApi, categoriesApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { MarketStackParamList } from '@navigation/MainNavigator';

const SELLER_ROLES = ['FARMER','TRADER','AGGREGATOR','PROCESSOR','EXPORTER','HAULAGE'];

type Props = {
  navigation: StackNavigationProp<MarketStackParamList, 'MarketHome'>;
  route:      RouteProp<MarketStackParamList, 'MarketHome'>;
};

export function MarketScreen({ navigation, route }: Props) {
  const insets  = useSafeAreaInsets();
  const { user } = useAuthStore();
  const isSeller = SELLER_ROLES.includes(user?.role ?? '');
  const initialCatId = route.params?.initialCatId;
  const [search, setSearch]   = useState('');
  const [catId,  setCatId]    = useState<string | undefined>(initialCatId);
  const [query,  setQuery]    = useState('');

  const { data: cats } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.getAll().then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', query, catId],
    queryFn:  () => marketplaceApi.search({ keyword: query || undefined, categoryId: catId }).then(r => r.data),
  });

  const products = data?.data || [];

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Marketplace</Text>
          {isSeller && (
            <TouchableOpacity
              style={styles.listBtn}
              onPress={() => navigation.navigate('CreateListing')}
            >
              <Text style={styles.listBtnText}>+ List</Text>
            </TouchableOpacity>
          )}
        </View>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onSubmit={() => setQuery(search)}
          onClear={() => { setSearch(''); setQuery(''); }}
          style={styles.search}
        />
      </View>

      {/* Category chips */}
      {cats && (
        <FlatList
          horizontal
          data={[{ id: undefined, name: 'All', icon: '🌾' }, ...cats] as any[]}
          keyExtractor={(_item, i) => String(i)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, catId === item.id && styles.catChipActive]}
              onPress={() => setCatId(item.id)}
            >
              <Text style={styles.catIcon}>{item.icon || '📦'}</Text>
              <Text style={[styles.catName, catId === item.id && styles.catNameActive]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Product grid */}
      {isLoading ? (
        <LoadingState message="Loading products…" />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No products found"
          description="Try a different search or category."
          actionLabel="Clear search"
          onAction={() => { setSearch(''); setQuery(''); setCatId(undefined); }}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ProductCard
                {...item}
                sellerName={`${item.seller?.firstName || ''} ${item.seller?.lastName || ''}`.trim()}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.background },
  header:     { backgroundColor: Colors.white, paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border },
  titleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  title:      { ...Typography.headingMedium, color: Colors.textPrimary },
  listBtn:    { backgroundColor: Colors.green[700], borderRadius: 20, paddingVertical: Spacing[2], paddingHorizontal: Spacing[4] },
  listBtnText:{ ...Typography.labelLarge, color: Colors.white },
  search:     {},
  catList:    { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[2] },
  catChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.white, borderRadius: 50, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: Colors.border },
  catChipActive: { borderColor: Colors.green[700], backgroundColor: Colors.green[50] },
  catIcon:    { fontSize: 16 },
  catName:    { ...Typography.labelMedium, color: Colors.textSecondary },
  catNameActive: { color: Colors.green[700], fontWeight: '700' },
  list:       { padding: Spacing[3] },
  row:        { gap: Spacing[3], marginBottom: Spacing[3] },
  cardWrap:   { flex: 1 },
});
