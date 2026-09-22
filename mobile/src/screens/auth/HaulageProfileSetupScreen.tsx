import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius } from '@theme/index';
import { Button, Input } from '@components/ui';
import { haulageApi } from '@services/api';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'HaulageProfileSetup'> };

const VEHICLE_TYPES = [
  { id: 'motorcycle',   label: 'Motorcycle / Keke', emoji: '🏍️', capacity: 0.1 },
  { id: 'pickup',       label: 'Pickup / Van',       emoji: '🚐', capacity: 1   },
  { id: 'small-truck',  label: 'Small Truck',        emoji: '🚛', capacity: 3   },
  { id: 'medium-truck', label: 'Medium Truck',       emoji: '🚚', capacity: 7   },
  { id: 'large-truck',  label: 'Large Truck',        emoji: '🏗️', capacity: 20  },
  { id: 'multiple',     label: 'Multiple Types',     emoji: '🚜', capacity: 0   },
];

const ALL_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

export function HaulageProfileSetupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const C      = useThemeColors();

  const [vehicleType,     setVehicleType]     = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [licensePlate,    setLicensePlate]    = useState('');
  const [yearsExp,        setYearsExp]        = useState('');
  const [companyName,     setCompanyName]     = useState('');
  const [coverageRoutes,  setCoverageRoutes]  = useState('');
  const [selectedStates,  setSelectedStates]  = useState<string[]>([]);
  const [showStateList,   setShowStateList]   = useState(false);

  const profileMutation = useMutation({
    mutationFn: () => haulageApi.createProfile({
      companyName:     companyName || undefined,
      vehicleType,
      vehicleCapacity: parseFloat(vehicleCapacity) || 1,
      licensePlate:    licensePlate || undefined,
      yearsExperience: yearsExp ? parseInt(yearsExp, 10) : undefined,
      coverageStates:  selectedStates,
      coverageRoutes:  coverageRoutes || undefined,
    }),
    onSuccess: () => navigation.navigate('RegistrationFee'),
    onError:   (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Could not save profile.'),
  });

  const toggleState = (state: string) =>
    setSelectedStates(prev => prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]);

  const handleSubmit = () => {
    if (!vehicleType)              { Alert.alert('Required', 'Please select your vehicle type.'); return; }
    if (selectedStates.length === 0){ Alert.alert('Required', 'Please select at least one coverage state.'); return; }
    profileMutation.mutate();
  };

  const selectedVehicle = VEHICLE_TYPES.find(v => v.id === vehicleType);
  const s = makeStyles(C);

  return (
    <ScrollView style={s.flex}
      contentContainerStyle={[s.container, { paddingTop: insets.top + Spacing[4], paddingBottom: insets.bottom + Spacing[10] }]}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

      <View style={s.header}>
        <View style={s.iconWrap}><Text style={s.icon}>🚛</Text></View>
        <Text style={s.heading}>Set Up Your Haulage Profile</Text>
        <Text style={s.subheading}>Tell buyers and sellers about your logistics service so they can find and trust you.</Text>
      </View>

      {/* Progress */}
      <View style={s.progressBar}>
        <View style={s.progressStep}>
          <View style={[s.progressDot, s.progressDotDone]}><Text style={s.progressCheck}>✓</Text></View>
          <Text style={s.progressLabel}>Account</Text>
        </View>
        <View style={s.progressLine} />
        <View style={s.progressStep}>
          <View style={[s.progressDot, s.progressDotActive]} />
          <Text style={[s.progressLabel, { color: C.green[700], fontWeight: '700' }]}>Profile</Text>
        </View>
        <View style={s.progressLine} />
        <View style={s.progressStep}>
          <View style={s.progressDot} />
          <Text style={s.progressLabel}>Activation</Text>
        </View>
      </View>

      {/* Company */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Business Details</Text>
        <Input label="Company / Business Name (optional)" placeholder="e.g. Musa Haulage Services"
          value={companyName} onChangeText={setCompanyName} leftIcon={<Text>🏢</Text>} />
      </View>

      {/* Vehicle type */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Vehicle Type *</Text>
        <View style={s.vehicleGrid}>
          {VEHICLE_TYPES.map(v => (
            <TouchableOpacity key={v.id} activeOpacity={0.8}
              style={[s.vehicleCard, vehicleType === v.id && s.vehicleCardActive]}
              onPress={() => { setVehicleType(v.id); if (v.capacity > 0) setVehicleCapacity(v.capacity.toString()); }}>
              <Text style={s.vehicleEmoji}>{v.emoji}</Text>
              <Text style={[s.vehicleLabel, vehicleType === v.id && s.vehicleLabelActive]}>{v.label}</Text>
              {v.capacity > 0 && <Text style={s.vehicleCap}>~{v.capacity}t</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Vehicle details */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Vehicle Details</Text>
        <Input label="Maximum Capacity (tonnes per trip) *"
          placeholder={selectedVehicle ? `e.g. ${selectedVehicle.capacity}` : 'e.g. 5'}
          value={vehicleCapacity} onChangeText={setVehicleCapacity} keyboardType="decimal-pad" leftIcon={<Text>⚖️</Text>} />
        <Input label="License Plate (optional)" placeholder="e.g. ABJ-123-KJ"
          value={licensePlate} onChangeText={setLicensePlate} leftIcon={<Text>🪪</Text>} />
        <Input label="Years of Experience (optional)" placeholder="e.g. 5"
          value={yearsExp} onChangeText={setYearsExp} keyboardType="number-pad" leftIcon={<Text>📅</Text>} />
      </View>

      {/* Coverage states */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Coverage States * ({selectedStates.length} selected)</Text>
          <TouchableOpacity onPress={() => setShowStateList(v => !v)}>
            <Text style={s.toggleLink}>{showStateList ? 'Done' : 'Select States'}</Text>
          </TouchableOpacity>
        </View>
        {selectedStates.length > 0 && !showStateList && (
          <View style={s.statePills}>
            {selectedStates.map(st => (
              <TouchableOpacity key={st} style={s.statePill} onPress={() => toggleState(st)}>
                <Text style={s.statePillText}>{st} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {showStateList && (
          <View style={s.stateList}>
            <TouchableOpacity style={s.selectAllBtn}
              onPress={() => setSelectedStates(selectedStates.length === ALL_STATES.length ? [] : [...ALL_STATES])}>
              <Text style={s.selectAllText}>{selectedStates.length === ALL_STATES.length ? '✕ Deselect All' : '✓ Select All Nigeria'}</Text>
            </TouchableOpacity>
            <View style={s.stateGrid}>
              {ALL_STATES.map(st => (
                <TouchableOpacity key={st}
                  style={[s.stateChip, selectedStates.includes(st) && s.stateChipActive]}
                  onPress={() => toggleState(st)}>
                  <Text style={[s.stateChipText, selectedStates.includes(st) && s.stateChipTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Routes */}
      <View style={s.section}>
        <Input label="Main Routes / Coverage Description (optional)"
          placeholder="e.g. Lagos - Abuja - Kano corridor"
          value={coverageRoutes} onChangeText={setCoverageRoutes}
          leftIcon={<Text>🗺️</Text>} multiline numberOfLines={3} />
      </View>

      {/* Info */}
      <View style={s.infoBanner}>
        <Text style={s.infoBannerTitle}>📋 What happens next?</Text>
        <Text style={s.infoBannerText}>After completing your profile, you'll pay a one-time activation fee of ₦3,000.</Text>
      </View>

      <Button title={profileMutation.isPending ? 'Saving Profile…' : 'Save Profile & Continue →'}
        onPress={handleSubmit} loading={profileMutation.isPending} size="lg" style={s.submitBtn} />
      <TouchableOpacity style={s.skipBtn} onPress={() => navigation.navigate('RegistrationFee')}>
        <Text style={s.skipText}>Skip for now (complete profile later)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:      { flex: 1, backgroundColor: C.white },
    container: { paddingHorizontal: Spacing[5] },

    header:     { alignItems: 'center', marginBottom: Spacing[6] },
    iconWrap:   { width: 80, height: 80, backgroundColor: C.green[50], borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4] },
    icon:       { fontSize: 40 },
    heading:    { ...Typography.headingLarge, color: C.textPrimary, textAlign: 'center', marginBottom: Spacing[2] },
    subheading: { ...Typography.bodyMedium, color: C.textMuted, textAlign: 'center', lineHeight: 22 },

    progressBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[7] },
    progressStep:      { alignItems: 'center', gap: Spacing[1] },
    progressDot:       { width: 24, height: 24, borderRadius: 12, backgroundColor: C.gray[200], borderWidth: 2, borderColor: C.gray[300], alignItems: 'center', justifyContent: 'center' },
    progressDotDone:   { backgroundColor: C.green[700], borderColor: C.green[700] },
    progressDotActive: { backgroundColor: C.green[500], borderColor: C.green[700], width: 28, height: 28, borderRadius: 14 },
    progressCheck:     { fontSize: 11, color: '#ffffff', fontWeight: '900' },
    progressLine:      { width: 48, height: 2, backgroundColor: C.gray[200], marginHorizontal: Spacing[2] },
    progressLabel:     { ...Typography.caption, color: C.textMuted, marginTop: 4 },

    section:       { marginBottom: Spacing[5] },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
    sectionTitle:  { ...Typography.titleLarge, color: C.textPrimary, marginBottom: Spacing[3] },
    toggleLink:    { ...Typography.labelLarge, color: C.green[700] },

    vehicleGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
    vehicleCard:        { width: '30%', backgroundColor: C.gray[100], borderRadius: Radius.lg, padding: Spacing[3], alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    vehicleCardActive:  { borderColor: C.green[700], backgroundColor: C.green[50] },
    vehicleEmoji:       { fontSize: 26, marginBottom: Spacing[1] },
    vehicleLabel:       { ...Typography.caption, color: C.textSecondary, textAlign: 'center', fontWeight: '700' },
    vehicleLabelActive: { color: C.green[700] },
    vehicleCap:         { ...Typography.caption, color: C.textMuted, marginTop: 2 },

    statePills:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[3] },
    statePill:      { backgroundColor: C.green[700], borderRadius: 50, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
    statePillText:  { ...Typography.caption, color: '#ffffff', fontWeight: '700' },

    stateList:          { backgroundColor: C.gray[100], borderRadius: Radius.xl, padding: Spacing[4], borderWidth: 1, borderColor: C.border },
    selectAllBtn:       { alignItems: 'center', paddingVertical: Spacing[3], marginBottom: Spacing[3], borderBottomWidth: 1, borderBottomColor: C.border },
    selectAllText:      { ...Typography.labelLarge, color: C.green[700] },
    stateGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
    stateChip:          { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], backgroundColor: C.white, borderRadius: 50, borderWidth: 1, borderColor: C.border },
    stateChipActive:    { backgroundColor: C.green[700], borderColor: C.green[700] },
    stateChipText:      { ...Typography.caption, color: C.textSecondary },
    stateChipTextActive:{ color: '#ffffff', fontWeight: '700' },

    infoBanner:      { backgroundColor: C.gold[100], borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[5], borderWidth: 1, borderColor: C.gold[400] },
    infoBannerTitle: { ...Typography.titleMedium, color: C.gold[700], marginBottom: Spacing[2] },
    infoBannerText:  { ...Typography.bodySmall, color: C.textSecondary, lineHeight: 20 },

    submitBtn: { marginBottom: Spacing[3] },
    skipBtn:   { alignItems: 'center', paddingVertical: Spacing[3] },
    skipText:  { ...Typography.bodySmall, color: C.textMuted },
  });
}
