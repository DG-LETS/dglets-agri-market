import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { LoadingState, EmptyState, ProductCard } from '@components/ui';
import { marketplaceApi } from '@services/api';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'SavedProducts'>;
};

export function SavedProductsScreen({ navigation }: Props) {
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['saved-products'],
    queryFn:  () => marketplaceApi.getSaved().then(r => r.data),
    retry:    0,
  });

  const unsaveMutation = useMutation({
    mutationFn: (productId: string) => marketplaceApi.toggleSave(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-products'] }),
  });

  const saved = data ?? [];

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Products</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <LoadingState message="Loading saved products…" />
      ) : saved.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="No saved products"
          description="Products you save will appear here. Browse the marketplace and tap the heart icon to save."
        />
      ) : (
        <FlatList
          data={saved}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ProductCard
                {...item.product}
                sellerName={`${item.product?.seller?.firstName ?? ''} ${item.product?.seller?.lastName ?? ''}`.trim()}
                onPress={() => (navigation as any).navigate('MarketTab', {
                  screen: 'ProductDetail',
                  params: { productId: item.product.id },
                })}
              />
              <TouchableOpacity
                style={styles.unsaveBtn}
                onPress={() => unsaveMutation.mutate(item.product.id)}
              >
                <Text style={styles.unsaveBtnText}>❤️ Saved</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.background },
  header:     { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:    { width: 40 },
  backText:   { fontSize: 22, color: Colors.textSecondary },
  headerTitle:{ ...Typography.titleLarge, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  list:       { padding: Spacing[4] },
  row:        { gap: Spacing[3], marginBottom: Spacing[3] },
  cardWrap:   { flex: 1 },
  unsaveBtn:  { backgroundColor: '#fff0f0', borderWidth: 1, borderColor: '#ffcccc', borderRadius: Radius.lg, paddingVertical: Spacing[2], alignItems: 'center', marginTop: Spacing[2] },
  unsaveBtnText: { ...Typography.caption, color: '#e53e3e', fontWeight: '700' },
});
