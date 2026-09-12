import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Radius, Spacing, Shadow } from '@theme/index';
import { Badge } from './Badge';

interface ProductCardProps {
  id:           string;
  name:         string;
  price:        number;
  priceUnit:    string;
  quantity:     number;
  quantityUnit: string;
  images:       string[];
  sellerName:   string;
  state:        string;
  isVerified?:  boolean;
  rating?:      number;
  distance?:    string;
  onPress:      () => void;
  onSave?:      () => void;
  saved?:       boolean;
}

export function ProductCard({
  name, price, priceUnit, quantity, quantityUnit,
  images, sellerName, state, isVerified, rating,
  distance, onPress, onSave, saved,
}: ProductCardProps) {
  const imageUri = images?.[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image */}
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>🌾</Text>
          </View>
        )}
        {onSave && (
          <TouchableOpacity style={styles.saveBtn} onPress={onSave} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Text style={styles.saveIcon}>{saved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>

        <Text style={styles.price}>
          ₦{price.toLocaleString()}<Text style={styles.priceUnit}>/{priceUnit}</Text>
        </Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>📦 {quantity.toLocaleString()}{quantityUnit} avail.</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.sellerRow}>
            <Text style={styles.sellerIcon}>🌾</Text>
            <Text style={styles.sellerName} numberOfLines={1}>{sellerName}</Text>
          </View>
          <View style={styles.right}>
            {distance && <Text style={styles.distance}>{distance}</Text>}
            {rating && <Text style={styles.rating}>⭐ {rating.toFixed(1)}</Text>}
          </View>
        </View>

        <Text style={styles.location}>📍 {state}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.xl,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     Colors.border,
    ...Shadow.sm,
  },
  imageWrap:           { position: 'relative', height: 160, backgroundColor: Colors.green[50] },
  image:               { width: '100%', height: '100%' },
  imagePlaceholder:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderIcon: { fontSize: 40 },
  saveBtn:             { position: 'absolute', top: Spacing[2], right: Spacing[2], backgroundColor: 'rgba(255,255,255,.85)', borderRadius: Radius.full, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  saveIcon:            { fontSize: 16 },
  verifiedBadge:       { position: 'absolute', bottom: Spacing[2], left: Spacing[2], backgroundColor: Colors.green[700], borderRadius: Radius.full, paddingHorizontal: Spacing[2], paddingVertical: 2 },
  verifiedText:        { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  content:             { padding: Spacing[3] },
  name:                { ...Typography.titleMedium, color: Colors.textPrimary, marginBottom: Spacing[1] },
  price:               { ...Typography.headingSmall, color: Colors.green[700], marginBottom: Spacing[1] },
  priceUnit:           { ...Typography.bodyMedium, color: Colors.textMuted, fontWeight: '400' },
  meta:                { marginBottom: Spacing[2] },
  metaText:            { ...Typography.bodySmall, color: Colors.textMuted },
  footer:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[1] },
  sellerRow:           { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sellerIcon:          { fontSize: 12, marginRight: 4 },
  sellerName:          { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  right:               { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  distance:            { ...Typography.caption, color: Colors.textMuted },
  rating:              { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  location:            { ...Typography.caption, color: Colors.textMuted },
});
