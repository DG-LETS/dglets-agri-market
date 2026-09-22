import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius } from '@theme/index';
import { LoadingState, EmptyState, ProductCard } from '@components/ui';
import { marketplaceApi } from '@services/api';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '@navigation/MainNavigator';

type Props = { navigation: StackNavigationProp<ProfileStackParamList, 'SavedProducts'> };

export function SavedProductsScreen({ navigation }: Props) {
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const C           = useThemeColors();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-products'],
    queryFn:  () => marketplaceApi.getSaved().then(r => r.data),
    retry: 0,
  });

  const unsaveMutation = useMutation({
    mutationFn: (productId: string) => marketplaceApi.toggleSave(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-products'] }),
  });

  const saved = data ?? [];
  const s     = makeStyles(C);

  return (
    <View style={[s.flex, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Saved Products</Text>
        <View style={s.backBtn} />
      </View>
      {isLoading ? <LoadingState message="Loading saved products…" /> : saved.length === 0 ? (
        <EmptyState icon="❤️" title="No saved products" description="Products you save will appear here. Browse the marketplace and tap the heart icon to save." />
      ) : (
        <FlatList
          data={saved} keyExtractor={item => item.id} numColumns={2}
          contentContainerStyle={s.list} columnWrapperStyle={s.row}
          renderItem={({ item }) => (
            <View style={s.cardWrap}>
              <ProductCard
                {...item.product}
                sellerName={`${item.product?.seller?.firstName ?? ''} ${item.product?.seller?.lastName ?? ''}`.trim()}
                onPress={() => (navigation as any).navigate('MarketTab', { screen: 'ProductDetail', params: { productId: item.product.id } })}
              />
              <TouchableOpacity style={s.unsaveBtn} onPress={() => unsaveMutation.mutate(item.product.id)}>
                <Text style={s.unsaveBtnText}>❤️ Saved</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:        { flex: 1, backgroundColor: C.background },
    header:      { backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn:     { width: 40 },
    backText:    { fontSize: 22, color: C.textSecondary },
    headerTitle: { ...Typography.titleLarge, color: C.textPrimary, flex: 1, textAlign: 'center' },
    list:        { padding: Spacing[4] },
    row:         { gap: Spacing[3], marginBottom: Spacing[3] },
    cardWrap:    { flex: 1 },
    unsaveBtn:   { backgroundColor: C.errorLight, borderWidth: 1, borderColor: C.error, borderRadius: Radius.lg, paddingVertical: Spacing[2], alignItems: 'center', marginTop: Spacing[2] },
    unsaveBtnText: { ...Typography.caption, color: C.error, fontWeight: '700' },
  });
}
