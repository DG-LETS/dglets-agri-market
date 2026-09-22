import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors, Typography, Radius, Spacing, Shadow } from '@theme/index';

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
  distanceKm?:  number;
  onPress:      () => void;
  onSave?:      () => void;
  saved?:       boolean;
}

export function ProductCard({
  name, price, priceUnit, quantity, quantityUnit,
  images, sellerName, state, isVerified, rating,
  distance, distanceKm, onPress, onSave, saved,
}: ProductCardProps) {
  const C        = useThemeColors();
  const imageUri = images?.[0];

  const displayDistance = distance ?? (
    distanceKm != null
      ? distanceKm < 1
        ? `${(distanceKm * 1000).toFixed(0)}m away`
        : `${distanceKm.toFixed(1)}km away`
      : undefined
  );

  const s = makeStyles(C);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={s.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={[s.image, s.imagePlaceholder]}>
            <Text style={s.imagePlaceholderIcon}>🌾</Text>
          </View>
        )}
        {onSave && (
          <TouchableOpacity style={s.saveBtn} onPress={onSave} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Text style={s.saveIcon}>{saved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
        {isVerified && (
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedText}>✓ Verified</Text>
          </View>
        )}
      </View>
      <View style={s.content}>
        <Text style={s.name} numberOfLines={1}>{name}</Text>
        <Text style={s.price}>
          ₦{price.toLocaleString()}
          <Text style={s.priceUnit}>/{priceUnit}</Text>
        </Text>
        <View style={s.meta}>
          <Text style={s.metaText}>📦 {quantity.toLocaleString()}{quantityUnit} avail.</Text>
        </View>
        <View style={s.footer}>
          <View style={s.sellerRow}>
            <Text style={s.sellerIcon}>🌾</Text>
            <Text style={s.sellerName} numberOfLines={1}>{sellerName}</Text>
          </View>
          <View style={s.right}>
            {displayDistance && <Text style={s.distance}>📍 {displayDistance}</Text>}
            {rating && <Text style={s.rating}>⭐ {rating.toFixed(1)}</Text>}
          </View>
        </View>
        <Text style={s.location}>📍 {state}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card:                 { backgroundColor: C.white, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...Shadow.sm },
    imageWrap:            { position: 'relative', height: 160, backgroundColor: C.green[50] },
    image:                { width: '100%', height: '100%' },
    imagePlaceholder:     { alignItems: 'center', justifyContent: 'center' },
    imagePlaceholderIcon: { fontSize: 40 },
    saveBtn:              { position: 'absolute', top: Spacing[2], right: Spacing[2], backgroundColor: 'rgba(0,0,0,.25)', borderRadius: Radius.full, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    saveIcon:             { fontSize: 16 },
    verifiedBadge:        { position: 'absolute', bottom: Spacing[2], left: Spacing[2], backgroundColor: C.green[700], borderRadius: Radius.full, paddingHorizontal: Spacing[2], paddingVertical: 2 },
    verifiedText:         { ...Typography.caption, color: '#ffffff', fontWeight: '700' },
    content:              { padding: Spacing[3] },
    name:                 { ...Typography.titleMedium, color: C.textPrimary, marginBottom: Spacing[1] },
    price:                { ...Typography.headingSmall, color: C.green[700], marginBottom: Spacing[1] },
    priceUnit:            { ...Typography.bodyMedium, color: C.textMuted, fontWeight: '400' },
    meta:                 { marginBottom: Spacing[2] },
    metaText:             { ...Typography.bodySmall, color: C.textMuted },
    footer:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[1] },
    sellerRow:            { flexDirection: 'row', alignItems: 'center', flex: 1 },
    sellerIcon:           { fontSize: 12, marginRight: 4 },
    sellerName:           { ...Typography.bodySmall, color: C.textSecondary, flex: 1 },
    right:                { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    distance:             { ...Typography.caption, color: C.textMuted },
    rating:               { ...Typography.caption, color: C.textSecondary, fontWeight: '600' },
    location:             { ...Typography.caption, color: C.textMuted },
  });
}
