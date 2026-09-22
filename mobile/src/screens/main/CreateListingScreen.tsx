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
import { useThemeColors, Typography, Spacing, Radius } from '@theme/index';
import { Input, Button } from '@components/ui';
import { marketplaceApi, categoriesApi } from '@services/api';
import { useImageUpload } from '@hooks/useImageUpload';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { MarketStackParamList } from '@navigation/MainNavigator';

/* â”€â”€ Validation schema â”€â”€ */
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
  const s = makeStyles(C);
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
  const C = useThemeColors();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);

  /* â”€â”€ Image upload â”€â”€ */
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

  /* â”€â”€ Categories â”€â”€ */
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.getAll().then(r => r.data),
  });
  const catId = watch('categoryId');

  /* â”€â”€ Submit mutation â”€â”€ */
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
        'âœ… Listing Published!',
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

  const s = makeStyles(C);
  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.header, { paddingTop: insets.top + Spacing[2] }]}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>â†</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Listing</Text>
        {/* Step indicator */}
        <View style={s.stepRow}>
          <View style={[s.stepDot, step >= 1 && styles.stepDotOn]} />
          <View style={s.stepLine} />
          <View style={[s.stepDot, step >= 2 && styles.stepDotOn]} />
        </View>
      </View>

      <ScrollView
        style={s.flex}
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + Spacing[12] }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
             STEP 1 â€” Product basics
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
          <>
            <Text style={s.stepTitle}>ðŸ“¦ Product Information</Text>

            <Controller control={control} name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Product Name" placeholder="e.g. Fresh Ginger Root" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} required />
              )}
            />

            <Controller control={control} name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Description (optional)" placeholder="Describe your product â€” quality, origin, notesâ€¦" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={3} containerStyle={s.textArea} />
              )}
            />

            {/* â”€â”€ Product photos â”€â”€ */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Product Photos <Text style={s.optional}>(optional, up to 5)</Text></Text>
              <View style={s.photoGrid}>
                {productImages.map((img, i) => (
                  <View key={i} style={s.photoThumb}>
                    <Image source={{ uri: img.uri }} style={s.photoThumbImg} />
                    <TouchableOpacity style={s.photoRemove} onPress={() => removeImage(i)}>
                      <Text style={s.photoRemoveText}>âœ•</Text>
                    </TouchableOpacity>
                    {img.uploaded && (
                      <View style={s.photoUploaded}>
                        <Text style={s.photoUploadedText}>âœ“</Text>
                      </View>
                    )}
                  </View>
                ))}
                {productImages.length < 5 && (
                  <TouchableOpacity style={s.photoAdd} onPress={pickImages}>
                    <Text style={s.photoAddIcon}>ðŸ“·</Text>
                    <Text style={s.photoAddText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Category */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Category <Text style={s.required}>*</Text></Text>
              {categories ? (
                <View style={s.catGrid}>
                  {categories.map((cat: any) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.catChip, catId === cat.id && styles.catChipActive]}
                      onPress={() => setValue('categoryId', cat.id)}
                    >
                      <Text style={s.catIcon}>{cat.icon || 'ðŸ“¦'}</Text>
                      <Text style={[s.catText, catId === cat.id && styles.catTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {errors.categoryId && <Text style={s.errText}>{errors.categoryId.message}</Text>}
            </View>

            {/* Price */}
            <View style={s.rowFields}>
              <View style={s.halfField}>
                <Controller control={control} name="price"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input label="Price (â‚¦)" placeholder="e.g. 1150" value={String(value ?? '')} onChangeText={onChange} onBlur={onBlur} keyboardType="numeric" error={errors.price?.message} leftIcon={<Text>â‚¦</Text>} required />
                  )}
                />
              </View>
              <View style={s.halfField}>
                <UnitPicker label="Per" value={priceUnit} options={PRICE_UNITS} onSelect={v => setValue('priceUnit', v)} />
              </View>
            </View>

            {/* Quantity */}
            <View style={s.rowFields}>
              <View style={s.halfField}>
                <Controller control={control} name="quantity"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input label="Available Qty" placeholder="e.g. 500" value={String(value ?? '')} onChangeText={onChange} onBlur={onBlur} keyboardType="numeric" error={errors.quantity?.message} required />
                  )}
                />
              </View>
              <View style={s.halfField}>
                <UnitPicker label="Unit" value={quantityUnit} options={QUANTITY_UNITS} onSelect={v => setValue('quantityUnit', v)} />
              </View>
            </View>

            <Controller control={control} name="moq"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Minimum Order Qty (MOQ)" placeholder="e.g. 10" value={String(value ?? '')} onChangeText={onChange} onBlur={onBlur} keyboardType="numeric" error={errors.moq?.message} hint={`Smallest amount a buyer can order (in ${quantityUnit})`} required />
              )}
            />

            <Button title="Next: Location & Details â†’" onPress={goNext} size="lg" />
          </>
        ) : (
          /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
             STEP 2 â€” Location & details
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
          <>
            <Text style={s.stepTitle}>ðŸ“ Location & Details</Text>

            {/* State */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>State <Text style={s.required}>*</Text></Text>
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
              {errors.state && <Text style={s.errText}>{errors.state.message}</Text>}
            </View>

            <Controller control={control} name="lga"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="LGA / Nearest Town (optional)" placeholder="e.g. Chikun" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>ðŸ˜ï¸</Text>} />
              )}
            />

            {/* Quality grade */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Quality Grade (optional)</Text>
              <View style={s.gradeRow}>
                {QUALITY_GRADES.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[s.gradeChip, qualityGrade === g && styles.gradeChipActive]}
                    onPress={() => setValue('qualityGrade', qualityGrade === g ? undefined : g)}
                  >
                    <Text style={[s.gradeText, qualityGrade === g && styles.gradeTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Delivery toggle */}
            <View style={s.fieldWrap}>
              <TouchableOpacity
                style={s.toggleRow}
                onPress={() => setValue('deliveryAvailable', !deliveryAvail)}
                activeOpacity={0.8}
              >
                <View style={s.toggleInfo}>
                  <Text style={s.toggleLabel}>ðŸšš Delivery Available</Text>
                  <Text style={s.toggleHint}>Can you arrange delivery to the buyer?</Text>
                </View>
                <View style={[s.toggle, deliveryAvail && styles.toggleOn]}>
                  <View style={[s.toggleThumb, deliveryAvail && styles.toggleThumbOn]} />
                </View>
              </TouchableOpacity>
            </View>

            <Button
              title={createMutation.isPending || imgUploading ? (imgUploading ? 'Uploading photosâ€¦' : 'Publishingâ€¦') : 'ðŸŒ¾ Publish Listing'}
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

function makeStyles(C: any) { return StyleSheet.create({
  flex:        { flex: 1, backgroundColor: C.white },
  header:      { backgroundColor: C.white, paddingHorizontal: Spacing[5], paddingBottom: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { marginBottom: Spacing[2] },
  backText:    { fontSize: 22, color: C.textSecondary },
  headerTitle: { ...Typography.headingMedium, color: C.textPrimary, marginBottom: Spacing[3] },
  stepRow:     { flexDirection: 'row', alignItems: 'center' },
  stepDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gray[200] },
  stepDotOn:   { backgroundColor: C.green[700] },
  stepLine:    { flex: 1, height: 2, backgroundColor: C.gray[200], marginHorizontal: Spacing[2] },
  body:        { padding: Spacing[5] },
  stepTitle:   { ...Typography.headingSmall, color: C.textPrimary, marginBottom: Spacing[5] },
  fieldWrap:   { marginBottom: Spacing[4] },
  fieldLabel:  { ...Typography.labelLarge, color: C.gray[700], marginBottom: Spacing[2] },
  required:    { color: C.error },
  errText:     { ...Typography.bodySmall, color: C.error, marginTop: Spacing[1] },
  rowFields:   { flexDirection: 'row', gap: Spacing[3] },
  halfField:   { flex: 1 },
  textArea:    { marginBottom: Spacing[4] },
  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  catChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.gray[100], borderRadius: Radius.lg, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: C.border },
  catChipActive: { borderColor: C.green[700], backgroundColor: C.green[50] },
  catIcon:     { fontSize: 14 },
  catText:     { ...Typography.labelMedium, color: C.textSecondary },
  catTextActive: { color: C.green[700], fontWeight: '700' },
  gradeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  gradeChip:   { backgroundColor: C.gray[100], borderRadius: Radius.full, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: C.border },
  gradeChipActive: { borderColor: C.green[700], backgroundColor: C.green[50] },
  gradeText:   { ...Typography.labelMedium, color: C.textSecondary },
  gradeTextActive: { color: C.green[700], fontWeight: '700' },
  optional:    { fontWeight: '400', color: C.textMuted },
  photoGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  photoThumb:  { width: 80, height: 80, borderRadius: Radius.lg, overflow: 'hidden', position: 'relative' },
  photoThumbImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center' },
  photoRemoveText: { color: C.white, fontSize: 10, fontWeight: '800' },
  photoUploaded: { position: 'absolute', bottom: 4, left: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: C.green[700], alignItems: 'center', justifyContent: 'center' },
  photoUploadedText: { color: C.white, fontSize: 9, fontWeight: '800' },
  photoAdd:    { width: 80, height: 80, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray[50], gap: 4 },
  photoAddIcon:{ fontSize: 22 },
  photoAddText:{ ...Typography.caption, color: C.textMuted, textAlign: 'center' },
  toggleInfo:  { flex: 1 },
  toggleLabel: { ...Typography.titleMedium, color: C.textPrimary },
  toggleHint:  { ...Typography.bodySmall, color: C.textMuted, marginTop: 2 },
  toggle:      { width: 48, height: 28, borderRadius: 14, backgroundColor: C.gray[300], padding: 2, justifyContent: 'center' },
  toggleOn:    { backgroundColor: C.green[700] },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
});

const pickerStyles = StyleSheet.create({
  wrap:        { marginBottom: Spacing[4] },
  label:       { ...Typography.labelLarge, color: C.gray[700], marginBottom: Spacing[2] },
  row:         { flexDirection: 'row', gap: Spacing[2], paddingVertical: 2 },
  chip:        { backgroundColor: C.gray[100], borderRadius: Radius.full, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: C.border },
  chipActive:  { borderColor: C.green[700], backgroundColor: C.green[50] },
  chipText:    { ...Typography.labelMedium, color: C.textSecondary },
  chipTextActive: { color: C.green[700], fontWeight: '700' },
});
}
