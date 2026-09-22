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
import { useThemeColors, Typography, Spacing, Radius } from '@theme/index';
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

/* â”€â”€ Schemas â”€â”€ */
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

/* â”€â”€ Reusable tab header â”€â”€ */
function SectionTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const s = makeStyles(C);
  return (
    <TouchableOpacity
      style={[s.tab, active && styles.tabActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[s.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* â”€â”€ State picker row â”€â”€ */
function StatePicker({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const s = makeStyles(C);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>State</Text>
      <TouchableOpacity
        style={s.stateBtn}
        onPress={() => setOpen(o => !o)}
      >
        <Text style={value ? styles.stateBtnVal : styles.stateBtnPlaceholder}>
          {value || 'Select stateâ€¦'}
        </Text>
        <Text style={s.stateBtnArrow}>{open ? 'â–²' : 'â–¼'}</Text>
      </TouchableOpacity>
      {open && (
        <ScrollView style={s.stateList} nestedScrollEnabled>
          {NIGERIAN_STATES.map(s => (
            <TouchableOpacity
              key={s}
              style={[s.stateItem, value === s && styles.stateItemActive]}
              onPress={() => { onSelect(s); setOpen(false); }}
            >
              <Text style={[s.stateItemText, value === s && styles.stateItemTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function EditProfileScreen({ navigation, route }: Props) {
  const insets      = useSafeAreaInsets();
  const C = useThemeColors();
  const { user, refreshUser } = useAuthStore();
  const queryClient = useQueryClient();
  const initialSection = route.params?.section ?? 'basic';
  const [section, setSection] = React.useState<Section>(initialSection);

  const isSeller = SELLER_ROLES.includes(user?.role ?? '');

  /* â”€â”€â”€ Basic form â”€â”€â”€ */
  const basicForm = useForm<BasicForm>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName:  user?.lastName  ?? '',
      email:     user?.email     ?? '',
    },
  });

  /* â”€â”€â”€ Farmer form â”€â”€â”€ */
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

  /* â”€â”€â”€ Buyer form â”€â”€â”€ */
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

  /* â”€â”€â”€ Mutations â”€â”€â”€ */
  const basicMutation = useMutation({
    mutationFn: (data: BasicForm) =>
      usersApi.updateMe({ firstName: data.firstName, lastName: data.lastName, email: data.email || undefined })
        .then(r => r.data),
    onSuccess: () => {
      refreshUser();
      Alert.alert('âœ“ Profile updated!');
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
    onSuccess: () => { refreshUser(); Alert.alert('âœ“ Farm profile updated!'); },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Update failed'),
  });

  const buyerMutation = useMutation({
    mutationFn: (data: BuyerForm) =>
      usersApi.updateBuyerProfile(data).then(r => r.data),
    onSuccess: () => { refreshUser(); Alert.alert('âœ“ Buyer profile updated!'); },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Update failed'),
  });

  const tabs: { key: Section; label: string }[] = [
    { key: 'basic',  label: 'Personal' },
    ...(isSeller ? [{ key: 'farmer' as Section, label: 'Farm/Business' }] : []),
    ...(!isSeller ? [{ key: 'buyer'  as Section, label: 'Buyer Info' }]   : []),
  ];

  const s = makeStyles(C);
  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>â†</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={s.backBtn} />
      </View>

      {/* Section tabs */}
      <View style={s.tabs}>
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
        style={s.flex}
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + Spacing[12] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* â•â•â• PERSONAL INFO â•â•â• */}
        {section === 'basic' && (
          <>
            <Controller control={basicForm.control} name="firstName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="First Name" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={basicForm.formState.errors.firstName?.message}
                  leftIcon={<Text>ðŸ‘¤</Text>} required />
              )}
            />
            <Controller control={basicForm.control} name="lastName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Last Name" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={basicForm.formState.errors.lastName?.message}
                  leftIcon={<Text>ðŸ‘¤</Text>} required />
              )}
            />
            <Controller control={basicForm.control} name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Email (optional)" value={value} onChangeText={onChange} onBlur={onBlur}
                  error={basicForm.formState.errors.email?.message}
                  keyboardType="email-address" leftIcon={<Text>âœ‰ï¸</Text>} />
              )}
            />
            <View style={s.phoneRow}>
              <Text style={s.phoneLabel}>Phone Number</Text>
              <Text style={s.phoneVal}>{user?.phone}</Text>
              <Text style={s.phoneNote}>Phone cannot be changed</Text>
            </View>
            <Button
              title={basicMutation.isPending ? 'Savingâ€¦' : 'Save Changes'}
              onPress={basicForm.handleSubmit(data => basicMutation.mutate(data))}
              disabled={basicMutation.isPending}
              size="lg"
            />
          </>
        )}

        {/* â•â•â• FARM / BUSINESS PROFILE â•â•â• */}
        {section === 'farmer' && (
          <>
            <Controller control={farmerForm.control} name="farmName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Farm / Business Name" placeholder="e.g. Musa Farms" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>ðŸŒ¾</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="farmLocation"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Farm Location / Nearest Town" placeholder="e.g. Zaria Road, Chikun" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>ðŸ“</Text>} />
              )}
            />
            <StatePicker
              value={farmerForm.watch('state')}
              onSelect={v => farmerForm.setValue('state', v)}
            />
            <Controller control={farmerForm.control} name="lga"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="LGA" placeholder="e.g. Chikun" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>ðŸ˜ï¸</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="products"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Products (comma separated)" placeholder="e.g. Ginger, Maize, Yam" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>ðŸŒ±</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="farmSize"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Farm Size (optional)" placeholder="e.g. 5 hectares" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>ðŸ“</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="yearsOfFarming"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Years of Farming" placeholder="e.g. 10" value={String(value ?? '')} onChangeText={onChange} onBlur={onBlur} keyboardType="numeric" leftIcon={<Text>ðŸ“…</Text>} />
              )}
            />
            <Controller control={farmerForm.control} name="bio"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Bio (optional)" placeholder="Tell buyers about yourself and your farmâ€¦" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={4} />
              )}
            />
            <Button
              title={farmerMutation.isPending ? 'Savingâ€¦' : 'Save Farm Profile'}
              onPress={farmerForm.handleSubmit(data => farmerMutation.mutate(data))}
              disabled={farmerMutation.isPending}
              size="lg"
            />
          </>
        )}

        {/* â•â•â• BUYER PROFILE â•â•â• */}
        {section === 'buyer' && (
          <>
            <Controller control={buyerForm.control} name="businessName"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Business Name (optional)" placeholder="e.g. Mama Chidi Stores" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>ðŸ¢</Text>} />
              )}
            />
            {/* Buyer type chips */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Buyer Type</Text>
              <View style={s.chipRow}>
                {BUYER_TYPES.map(bt => {
                  const active = buyerForm.watch('buyerType') === bt.value;
                  return (
                    <TouchableOpacity
                      key={bt.value}
                      style={[s.chip, active && styles.chipActive]}
                      onPress={() => buyerForm.setValue('buyerType', bt.value)}
                    >
                      <Text style={[s.chipText, active && styles.chipTextActive]}>{bt.label}</Text>
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
                <Input label="LGA" placeholder="e.g. Ikeja" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Text>ðŸ˜ï¸</Text>} />
              )}
            />
            <Controller control={buyerForm.control} name="address"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Delivery Address (optional)" placeholder="e.g. 12 Allen Avenue, Lagos" value={value} onChangeText={onChange} onBlur={onBlur} multiline leftIcon={<Text>ðŸ“¦</Text>} />
              )}
            />
            <Button
              title={buyerMutation.isPending ? 'Savingâ€¦' : 'Save Buyer Profile'}
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

function makeStyles(C: any) { return StyleSheet.create({
  flex:       { flex: 1, backgroundColor: C.background },
  header:     { backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[5], paddingBottom: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:    { width: 40 },
  backText:   { fontSize: 22, color: C.textSecondary },
  headerTitle:{ ...Typography.headingSmall, color: C.textPrimary },
  tabs:       { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  tab:        { flex: 1, paddingVertical: Spacing[3], alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:  { borderBottomColor: C.green[700] },
  tabText:    { ...Typography.labelLarge, color: C.textMuted },
  tabTextActive: { color: C.green[700], fontWeight: '700' },
  body:       { padding: Spacing[5] },
  fieldWrap:  { marginBottom: Spacing[4] },
  fieldLabel: { ...Typography.labelLarge, color: C.gray[700], marginBottom: Spacing[2] },
  phoneRow:   { backgroundColor: C.gray[50], borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[4], borderWidth: 1, borderColor: C.border },
  phoneLabel: { ...Typography.labelLarge, color: C.textMuted, marginBottom: Spacing[1] },
  phoneVal:   { ...Typography.titleLarge, color: C.textPrimary },
  phoneNote:  { ...Typography.caption, color: C.textMuted, marginTop: Spacing[1] },
  stateBtn:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: C.gray[300], borderRadius: Radius.lg, padding: Spacing[3], backgroundColor: C.white },
  stateBtnVal:{ ...Typography.bodyLarge, color: C.textPrimary },
  stateBtnPlaceholder: { ...Typography.bodyLarge, color: C.gray[400] },
  stateBtnArrow: { ...Typography.bodyMedium, color: C.gray[500] },
  stateList:  { borderWidth: 1, borderColor: C.gray[200], borderRadius: Radius.lg, marginTop: Spacing[1], maxHeight: 180, backgroundColor: C.white },
  stateItem:  { paddingVertical: Spacing[3], paddingHorizontal: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.gray[100] },
  stateItemActive: { backgroundColor: C.green[50] },
  stateItemText: { ...Typography.bodyLarge, color: C.textSecondary },
  stateItemTextActive: { color: C.green[700], fontWeight: '700' },
  chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip:       { backgroundColor: C.gray[100], borderRadius: Radius.full, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderWidth: 1.5, borderColor: C.border },
  chipActive: { borderColor: C.green[700], backgroundColor: C.green[50] },
  chipText:   { ...Typography.labelMedium, color: C.textSecondary },
  chipTextActive: { color: C.green[700], fontWeight: '700' },
});
}
