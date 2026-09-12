import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { Input, Button } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { usersApi } from '@services/api';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { ProfileStackParamList } from '@navigation/MainNavigator';

type Section = 'basic' | 'farmer' | 'buyer';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'EditProfile'>;
  route:      RouteProp<ProfileStackParamList, 'EditProfile'>;
};

/* ── Schemas ── */
const basicSchema = z.object({
  firstName: z.string().min(2, 'Enter your first name'),
  lastName:  z.string().min(2, 'Enter your last name'),
  email:     z.string().email('Invalid email').optional().or(z.literal('')),
});

const farmerSchema = z.object({
  farmName:          z.string().optional(),
  farmLocation:      z.string().optional(),
  state:             z.string().min(2, 'Select your state'),
  lga:               z.string().optional(),
  bio:               z.string().optional(),
  products:          z.string().optional(),
  farmSize:          z.string().optional(),
  yearsOfFarming:    z.coerce.number().min(0).optional(),
});

const buyerSchema = z.object({
  businessName: z.string().optional(),
  buyerType:    z.string().optional(),
  state:        z.string().optional(),
  lga:          z.string().optional(),
  address:      z.string().optional(),
});

type BasicForm  = z.infer<typeof basicSchema>;
type FarmerForm = z.infer<typeof farmerSchema>;
type BuyerForm  = z.infer<typeof buyerSchema>;

const SELLER_ROLES = ['FARMER','TRADER','AGGREGATOR','PROCESSOR','EXPORTER','HAULAGE'];

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

const BUYER_TYPES = [
  { value: 'individual',  label: 'Individual / Household' },
  { value: 'restaurant',  label: 'Restaurant / Food Vendor' },
  { value: 'retailer',    label: 'Retailer / Market Seller' },
  { value: 'processor',   label: 'Processor / Manufacturer' },
  { value: 'exporter',    label: 'Exporter' },
  { value: 'other',       label: 'Other Business' },
];

/* ── Reusable tab header ── */
function SectionTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ── State picker row ── */
function StatePicker({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>State</Text>
      <TouchableOpacity
        style={styles.stateBtn}
        onPress={() => setOpen(o => !o)}
      >
        <Text style={value ? styles.stateBtnVal : styles.stateBtnPlaceholder}>
          {value || 'Select state…'}
        </Text>
        <Text style={styles.stateBtnArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <ScrollView style={styles.stateList} nestedScrollEnabled>
          {NIGERIAN_STATES.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.stateItem, value === s && styles.stateItemActive]}
              onPress={() => { onSelect(s); setOpen(false); }}
            >
              <Text style={[styles.stateItemText, value === s && styles.stateItemTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function EditProfileScreen({ navigation, route }: Props) {
  const insets      = useSafeAreaInsets();
  const { user, refreshUser } = useAuthStore();
  const queryClient = useQueryClient();
  const initialSection = route.params?.section ?? 'basic';
  const [section, setSection] = React.useState<Section>(initialSection);

  const isSeller = SELLER_ROLES.includes(user?.role ?? '');

  /* ─── Basic form ─── */
  const basicForm = useForm<BasicForm>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName:  user?.lastName  ?? '',
      email:     user?.email     ?? '',
    },
  });

  /* ─── Farmer form ─── */
  const farmerForm = useForm<FarmerForm>({
    resolver: zodResolver(farmerSchema),
    defaultValues: {
      farmName:       (user as any)?.farmerProfile?.farmName       ?? '',
      farmLocation:   (user as any)?.farmerProfile?.farmLocation   ?? '',
      state:          (user as any)?.farmerProfile?.state          ?? '',
      lga:            (user as any)?.farmerProfile?.lga            ?? '',
      bio:            (user as any)?.farmerProfile?.bio            ?? '',
      products:       (user as any)?.farmerProfile?.products?.join(', ') ?? '',
      farmSize:       (user as any)?.farmerProfile?.farmSize       ?? '',
      yearsOfFarming: (user as any)?.farmerProfile?.yearsOfFarming ?? 0,
    },
  });

  /* ─── Buyer form ─── */
  const buyerForm = useForm<BuyerForm>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      businessName: (user as any)?.buyerProfile?.businessName ?? '',
      buyerType:    (user as any)?.buyerProfile?.buyerType    ?? '',
      state:        (user as any)?.buyerProfile?.state        ?? '',
      lga:          (user as any)?.buyerProfile?.lga          ?? '',
      address:      (user as any)?.buyerProfile?.address      ?? '',
    },
  });

  /* ─── Mutations ─── */
  const basicMutation = useMutation({
    mutationFn: (data: BasicForm) =>
      usersApi.updateMe({ firstName: data.firstName, lastName: data.lastName, email: data.email || undefined })
        .then(r => r.data),
    onSuccess: () => {
      refreshUser();
      Alert.alert('✓ Profile updated!');
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Update failed'),
  });

  const farmerMutation = useMutation({
    mutationFn: (data: FarmerForm) =>
      usersApi.updateFarmerProfile({
        ...data,
        products: data.products ? data.products.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        yearsOfFarming: data.yearsOfFarming ? Number(data.yearsOfFarming) : undefined,
      }).then(r => r.data),
    onSuccess: () => { refreshUser(); Alert.alert('✓ Farm profile updated!'); },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Update failed'),
  });

  const buyerMutation = useMutation({
    mutationFn: (data: BuyerForm) =>
      usersApi.updateBuyerProfile(data).then(r => r.data),
    onSuccess: () => { refreshUser(); Alert.alert('✓ Buyer profile updated!'); },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Update failed'),
  });

  const tabs: { key: Section; label: string }[] = [
    { key: 'basic',  label: 'Personal' },
    ...(isSeller ? [{ key: 'farmer' as Section, label: 'Farm/Business' }] : []),
    ...(!isSeller ? [{ key: 'buyer'  as Section, label: 'Buyer Info' }]   : []),
  ];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Section tabs */}
      <View style={styles.tabs}>
        {tabs.map(t => (
          <SectionTab
            key={t.key}
            label={t.label}
            active={section === t.key}
            onPress={() => setSection(t.key)}
          />
        ))}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + Spacing[12] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ PERSONAL INFO ═══ */}
        {section === 'basic' && (
          <>
            <Controller control={basicForm.control} name="firstName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="First Name" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={basicForm.formState.errors.firstName?.message}
                  leftIcon={<Text>👤</Text>} required />
              )}
            />
            <Controller control={basicForm.control} name="lastName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Last Name" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={basicForm.formState.errors.lastName?.message}
                  leftIcon={<Text>👤</Text>} required />
              )}
            />
            <Controller control={basicForm.control} name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Email (optional)" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={basicForm.formState.errors.email?.message}
                  keyboardType="email-address" leftIcon={<Text>✉️</Text>} />
              )}
            />
            <View style={styles.phoneRow}>
              <Text style={styles.phoneLabel}>Phone Number</Text>
              <Text style={styles.phoneVal}>{user?.phone}</Text>
              <Text style={styles.phoneNote}>Phone cannot be changed</Text>
            </View>
            <Button
              title={basicMutation.isPending ? 'Saving…' : 'Save Changes'}
              onPress={basicForm.handleSubmit(data => basicMutation.mutate(data))}
              disabled={basicMutation.isPending}
              size="lg"
            />
          </>
        )}

        {/* ═══ FARM / BUSINESS PROFILE ═══ */}
        {section === 'farmer' && (
          <>
            <Controller control={farmerForm.control} name="farmName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Farm / Business Name" placeholder="e.g. Musa Farms" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>🌾</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="farmLocation"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Farm Location / Nearest Town" placeholder="e.g. Zaria Road, Chikun" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>📍</Text>} />
              )}
            />
            <StatePicker
              value={farmerForm.watch('state')}
              onSelect={v => farmerForm.setValue('state', v)}
            />
            <Controller control={farmerForm.control} name="lga"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="LGA" placeholder="e.g. Chikun" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>🏘️</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="products"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Products (comma separated)" placeholder="e.g. Ginger, Maize, Yam" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>🌱</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="farmSize"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Farm Size (optional)" placeholder="e.g. 5 hectares" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>📐</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="yearsOfFarming"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Years of Farming" placeholder="e.g. 10" value={String(value ?? '')} onChangeText={onChange} onBlur={onBlur} keyboardType="numeric" leftIcon={<Text>📅</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="bio"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Bio (optional)" placeholder="Tell buyers about yourself and your farm…" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={4} />
              )}
            />
            <Button
              title={farmerMutation.isPending ? 'Saving…' : 'Save Farm Profile'}
              onPress={farmerForm.handleSubmit(data => farmerMutation.mutate(data))}
              disabled={farmerMutation.isPending}
              size="lg"
            />
          </>
        )}

        {/* ═══ BUYER PROFILE ═══ */}
        {section === 'buyer' && (
          <>
            <Controller control={buyerForm.control} name="businessName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Business Name (optional)" placeholder="e.g. Mama Chidi Stores" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>🏢</Text>} />
              )}
            />
            {/* Buyer type chips */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Buyer Type</Text>
              <View style={styles.chipRow}>
                {BUYER_TYPES.map(bt => {
                  const active = buyerForm.watch('buyerType') === bt.value;
                  return (
                    <TouchableOpacity
                      key={bt.value}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => buyerForm.setValue('buyerType', bt.value)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{bt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <StatePicker
              value={buyerForm.watch('state') ?? ''}
              onSelect={v => buyerForm.setValue('state', v)}
            />
            <Controller control={buyerForm.control} name="lga"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="LGA" placeholder="e.g. Ikeja" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>🏘️</Text>} />
              )}
            />
            <Controller control={buyerForm.control} name="address"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Delivery Address (optional)" placeholder="e.g. 12 Allen Avenue, Lagos" value={value} onChangeText={onChange} onBlur={onBlur} multiline leftIcon={<Text>📦</Text>} />
              )}
            />
            <Button
              title={buyerMutation.isPending ? 'Saving…' : 'Save Buyer Profile'}
              onPress={buyerForm.handleSubmit(data => buyerMutation.mutate(data))}
              disabled={buyerMutation.isPending}
              size="lg"
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.background },
  header:     { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[5], paddingBottom: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:    { width: 40 },
  backText:   { fontSize: 22, color: Colors.textSecondary },
  headerTitle:{ ...Typography.headingSmall, color: Colors.textPrimary },
  tabs:       { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab:        { flex: 1, paddingVertical: Spacing[3], alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:  { borderBottomColor: Colors.green[700] },
  tabText:    { ...Typography.labelLarge, color: Colors.textMuted },
  tabTextActive: { color: Colors.green[700], fontWeight: '700' },
  body:       { padding: Spacing[5] },
  fieldWrap:  { marginBottom: Spacing[4] },
  fieldLabel: { ...Typography.labelLarge, color: Colors.gray[700], marginBottom: Spacing[2] },
  phoneRow:   { backgroundColor: Colors.gray[50], borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[4], borderWidth: 1, borderColor: Colors.border },
  phoneLabel: { ...Typography.labelLarge, color: Colors.textMuted, marginBottom: Spacing[1] },
  phoneVal:   { ...Typography.titleLarge, color: Colors.textPrimary },
  phoneNote:  { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing[1] },
  stateBtn:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.gray[300], borderRadius: Radius.lg, padding: Spacing[3], backgroundColor: Colors.white },
  stateBtnVal:{ ...Typography.bodyLarge, color: Colors.textPrimary },
  stateBtnPlaceholder: { ...Typography.bodyLarge, color: Colors.gray[400] },
  stateBtnArrow: { ...Typography.bodyMedium, color: Colors.gray[500] },
  stateList:  { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: Radius.lg, marginTop: Spacing[1], maxHeight: 180, backgroundColor: Colors.white },
  stateItem:  { paddingVertical: Spacing[3], paddingHorizontal: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  stateItemActive: { backgroundColor: Colors.green[50] },
  stateItemText: { ...Typography.bodyLarge, color: Colors.textSecondary },
  stateItemTextActive: { color: Colors.green[700], fontWeight: '700' },
  chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip:       { backgroundColor: Colors.gray[100], borderRadius: Radius.full, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { borderColor: Colors.green[700], backgroundColor: Colors.green[50] },
  chipText:   { ...Typography.labelMedium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.green[700], fontWeight: '700' },
});
