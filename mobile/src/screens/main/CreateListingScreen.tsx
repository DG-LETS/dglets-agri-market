import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { Input, Button } from '@components/ui';
import { marketplaceApi, categoriesApi } from '@services/api';
import { useImageUpload } from '@hooks/useImageUpload';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { MarketStackParamList } from '@navigation/MainNavigator';

/* ── Validation schema ── */
const schema = z.object({
  name:        z.string().min(2, 'Product name is required'),
  description: z.string().optional(),
  price:       z.coerce.number().positive('Enter a valid price'),
  priceUnit:   z.string().min(1, 'Select a price unit'),
  quantity:    z.coerce.number().positive('Enter available quantity'),
  quantityUnit:z.string().min(1, 'Select a unit'),
  moq:         z.coerce.number().min(1, 'Enter minimum order quantity'),
  state:       z.string().min(2, 'Select your state'),
  lga:         z.string().optional(),
  qualityGrade:z.string().optional(),
  categoryId:  z.string().min(1, 'Select a category'),
  deliveryAvailable: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const PRICE_UNITS    = ['kg', 'tonne', 'bag', 'crate', 'litre', 'bunch', 'unit', 'carton'];
const QUANTITY_UNITS = ['kg', 'tonne', 'bag', 'crate', 'litre', 'bunch', 'unit', 'carton'];
const QUALITY_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Premium', 'Standard', 'Export Quality'];

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

type Props = {
  navigation: StackNavigationProp<MarketStackParamList, 'CreateListing'>;
};

function UnitPicker({
  label, value, options, onSelect,
}: { label: string; value: string; options: string[]; onSelect: (v: string) => void }) {
  return (
    <View style={pickerStyles.wrap}>
      <Text style={pickerStyles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.row}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[pickerStyles.chip, value === opt && pickerStyles.chipActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[pickerStyles.chipText, value === opt && pickerStyles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export function CreateListingScreen({ navigation }: Props) {
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);

  /* ── Image upload ── */
  const {
    images: productImages, uploading: imgUploading,
    pickImages, removeImage, uploadAll,
  } = useImageUpload({ mode: 'multiple', maxCount: 5, folder: 'products' });

  const { control, handleSubmit, formState: { errors }, trigger, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      priceUnit:    'kg',
      quantityUnit: 'kg',
      moq:          1,
      deliveryAvailable: false,
    },
  });

  const priceUnit    = watch('priceUnit');
  const quantityUnit = watch('quantityUnit');
  const qualityGrade = watch('qualityGrade');
  const deliveryAvail = watch('deliveryAvailable');

  /* ── Categories ── */
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.getAll().then(r => r.data),
  });
  const catId = watch('categoryId');

  /* ── Submit mutation ── */
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      /* Upload any picked images first */
      const imageUrls = productImages.length > 0 ? await uploadAll() : [];
      return marketplaceApi.createProduct({
        ...data,
        images: imageUrls,
        status: 'PUBLISHED',
      }).then(r => r.data);
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
      Alert.alert(
        '✅ Listing Published!',
        `"${product.name}" is now live on the marketplace.`,
        [{ text: 'View Listing', onPress: () => navigation.replace('ProductDetail', { productId: product.id }) }],
      );
    },
    onError: (e: any) => {
      Alert.alert('Failed', e?.response?.data?.message || 'Could not create listing. Try again.');
    },
  });

  const goNext = async () => {
    const valid = await trigger(['name', 'price', 'priceUnit', 'quantity', 'quantityUnit', 'moq', 'categoryId']);
    if (valid) setStep(2);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2] }]}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Listing</Text>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotOn]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotOn]} />
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + Spacing[12] }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          /* ════════════════════════
             STEP 1 — Product basics
          ════════════════════════ */
          <>
            <Text style={styles.stepTitle}>📦 Product Information</Text>

            <Controller control={control} name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Product Name" placeholder="e.g. Fresh Ginger Root" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} required />
              )}
            />

            <Controller control={control} name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Description (optional)" placeholder="Describe your product — quality, origin, notes…" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={3} containerStyle={styles.textArea} />
              )}
            />

            {/* ── Product photos ── */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Product Photos <Text style={styles.optional}>(optional, up to 5)</Text></Text>
              <View style={styles.photoGrid}>
                {productImages.map((img, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri: img.uri }} style={styles.photoThumbImg} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => removeImage(i)}>
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                    {img.uploaded && (
                      <View style={styles.photoUploaded}>
                        <Text style={styles.photoUploadedText}>✓</Text>
                      </View>
                    )}
                  </View>
                ))}
                {productImages.length < 5 && (
                  <TouchableOpacity style={styles.photoAdd} onPress={pickImages}>
                    <Text style={styles.photoAddIcon}>📷</Text>
                    <Text style={styles.photoAddText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Category */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Category <Text style={styles.required}>*</Text></Text>
              {categories ? (
                <View style={styles.catGrid}>
                  {categories.map((cat: any) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, catId === cat.id && styles.catChipActive]}
                      onPress={() => setValue('categoryId', cat.id)}
                    >
                      <Text style={styles.catIcon}>{cat.icon || '📦'}</Text>
                      <Text style={[styles.catText, catId === cat.id && styles.catTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {errors.categoryId && <Text style={styles.errText}>{errors.categoryId.message}</Text>}
            </View>

            {/* Price */}
            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <Controller control={control} name="price"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input label="Price (₦)" placeholder="e.g. 1150" value={String(value ?? '')} onChangeText={onChange} onBlur={onBlur} keyboardType="numeric" error={errors.price?.message} leftIcon={<Text>₦</Text>} required />
                  )}
                />
              </View>
              <View style={styles.halfField}>
                <UnitPicker label="Per" value={priceUnit} options={PRICE_UNITS} onSelect={v => setValue('priceUnit', v)} />
              </View>
            </View>

            {/* Quantity */}
            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <Controller control={control} name="quantity"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input label="Available Qty" placeholder="e.g. 500" value={String(value ?? '')} onChangeText={onChange} onBlur={onBlur} keyboardType="numeric" error={errors.quantity?.message} required />
                  )}
                />
              </View>
              <View style={styles.halfField}>
                <UnitPicker label="Unit" value={quantityUnit} options={QUANTITY_UNITS} onSelect={v => setValue('quantityUnit', v)} />
              </View>
            </View>

            <Controller control={control} name="moq"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Minimum Order Qty (MOQ)" placeholder="e.g. 10" value={String(value ?? '')} onChangeText={onChange} onBlur={onBlur} keyboardType="numeric" error={errors.moq?.message} hint={`Smallest amount a buyer can order (in ${quantityUnit})`} required />
              )}
            />

            <Button title="Next: Location & Details →" onPress={goNext} size="lg" />
          </>
        ) : (
          /* ═════════════════════════════
             STEP 2 — Location & details
          ═════════════════════════════ */
          <>
            <Text style={styles.stepTitle}>📍 Location & Details</Text>

            {/* State */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>State <Text style={styles.required}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.row}>
                {NIGERIAN_STATES.map(st => {
                  const stateVal = watch('state');
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[pickerStyles.chip, stateVal === st && pickerStyles.chipActive]}
                      onPress={() => setValue('state', st)}
                    >
                      <Text style={[pickerStyles.chipText, stateVal === st && pickerStyles.chipTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {errors.state && <Text style={styles.errText}>{errors.state.message}</Text>}
            </View>

            <Controller control={control} name="lga"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="LGA / Nearest Town (optional)" placeholder="e.g. Chikun" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>🏘️</Text>} />
              )}
            />

            {/* Quality grade */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Quality Grade (optional)</Text>
              <View style={styles.gradeRow}>
                {QUALITY_GRADES.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.gradeChip, qualityGrade === g && styles.gradeChipActive]}
                    onPress={() => setValue('qualityGrade', qualityGrade === g ? undefined : g)}
                  >
                    <Text style={[styles.gradeText, qualityGrade === g && styles.gradeTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Delivery toggle */}
            <View style={styles.fieldWrap}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setValue('deliveryAvailable', !deliveryAvail)}
                activeOpacity={0.8}
              >
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>🚚 Delivery Available</Text>
                  <Text style={styles.toggleHint}>Can you arrange delivery to the buyer?</Text>
                </View>
                <View style={[styles.toggle, deliveryAvail && styles.toggleOn]}>
                  <View style={[styles.toggleThumb, deliveryAvail && styles.toggleThumbOn]} />
                </View>
              </TouchableOpacity>
            </View>

            <Button
              title={createMutation.isPending || imgUploading ? (imgUploading ? 'Uploading photos…' : 'Publishing…') : '🌾 Publish Listing'}
              onPress={handleSubmit(data => createMutation.mutate(data))}
              disabled={createMutation.isPending || imgUploading}
              size="lg"
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: Colors.white },
  header:      { backgroundColor: Colors.white, paddingHorizontal: Spacing[5], paddingBottom: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { marginBottom: Spacing[2] },
  backText:    { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { ...Typography.headingMedium, color: Colors.textPrimary, marginBottom: Spacing[3] },
  stepRow:     { flexDirection: 'row', alignItems: 'center' },
  stepDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gray[200] },
  stepDotOn:   { backgroundColor: Colors.green[700] },
  stepLine:    { flex: 1, height: 2, backgroundColor: Colors.gray[200], marginHorizontal: Spacing[2] },
  body:        { padding: Spacing[5] },
  stepTitle:   { ...Typography.headingSmall, color: Colors.textPrimary, marginBottom: Spacing[5] },
  fieldWrap:   { marginBottom: Spacing[4] },
  fieldLabel:  { ...Typography.labelLarge, color: Colors.gray[700], marginBottom: Spacing[2] },
  required:    { color: Colors.error },
  errText:     { ...Typography.bodySmall, color: Colors.error, marginTop: Spacing[1] },
  rowFields:   { flexDirection: 'row', gap: Spacing[3] },
  halfField:   { flex: 1 },
  textArea:    { marginBottom: Spacing[4] },
  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  catChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.gray[100], borderRadius: Radius.lg, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: Colors.border },
  catChipActive: { borderColor: Colors.green[700], backgroundColor: Colors.green[50] },
  catIcon:     { fontSize: 14 },
  catText:     { ...Typography.labelMedium, color: Colors.textSecondary },
  catTextActive: { color: Colors.green[700], fontWeight: '700' },
  gradeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  gradeChip:   { backgroundColor: Colors.gray[100], borderRadius: Radius.full, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: Colors.border },
  gradeChipActive: { borderColor: Colors.green[700], backgroundColor: Colors.green[50] },
  gradeText:   { ...Typography.labelMedium, color: Colors.textSecondary },
  gradeTextActive: { color: Colors.green[700], fontWeight: '700' },
  optional:    { fontWeight: '400', color: Colors.textMuted },
  photoGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  photoThumb:  { width: 80, height: 80, borderRadius: Radius.lg, overflow: 'hidden', position: 'relative' },
  photoThumbImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center' },
  photoRemoveText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  photoUploaded: { position: 'absolute', bottom: 4, left: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center' },
  photoUploadedText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  photoAdd:    { width: 80, height: 80, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray[50], gap: 4 },
  photoAddIcon:{ fontSize: 22 },
  photoAddText:{ ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  toggleInfo:  { flex: 1 },
  toggleLabel: { ...Typography.titleMedium, color: Colors.textPrimary },
  toggleHint:  { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  toggle:      { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.gray[300], padding: 2, justifyContent: 'center' },
  toggleOn:    { backgroundColor: Colors.green[700] },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
});

const pickerStyles = StyleSheet.create({
  wrap:        { marginBottom: Spacing[4] },
  label:       { ...Typography.labelLarge, color: Colors.gray[700], marginBottom: Spacing[2] },
  row:         { flexDirection: 'row', gap: Spacing[2], paddingVertical: 2 },
  chip:        { backgroundColor: Colors.gray[100], borderRadius: Radius.full, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: Colors.border },
  chipActive:  { borderColor: Colors.green[700], backgroundColor: Colors.green[50] },
  chipText:    { ...Typography.labelMedium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.green[700], fontWeight: '700' },
});
