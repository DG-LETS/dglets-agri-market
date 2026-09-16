import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { Button, Input } from '@components/ui';
import { haulageApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
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
  const insets    = useSafeAreaInsets();
  const { user }  = useAuthStore();

  const [vehicleType,      setVehicleType]      = useState('');
  const [vehicleCapacity,  setVehicleCapacity]  = useState('');
  const [licensePlate,     setLicensePlate]     = useState('');
  const [yearsExperience,  setYearsExperience]  = useState('');
  const [companyName,      setCompanyName]      = useState('');
  const [coverageRoutes,   setCoverageRoutes]   = useState('');
  const [selectedStates,   setSelectedStates]   = useState<string[]>([]);
  const [showStateList,    setShowStateList]     = useState(false);

  const profileMutation = useMutation({
    mutationFn: () => haulageApi.createProfile({
      companyName:    companyName || undefined,
      vehicleType,
      vehicleCapacity: parseFloat(vehicleCapacity) || 1,
      licensePlate:   licensePlate || undefined,
      yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : undefined,
      coverageStates:  selectedStates,
      coverageRoutes:  coverageRoutes || undefined,
    }),
    onSuccess: () => {
      navigation.navigate('RegistrationFee');
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not save profile. Please try again.');
    },
  });

  const toggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state],
    );
  };

  const handleSubmit = () => {
    if (!vehicleType) {
      Alert.alert('Required', 'Please select your vehicle type.');
      return;
    }
    if (selectedStates.length === 0) {
      Alert.alert('Required', 'Please select at least one coverage state.');
      return;
    }
    profileMutation.mutate();
  };

  const selectedVehicle = VEHICLE_TYPES.find(v => v.id === vehicleType);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing[4], paddingBottom: insets.bottom + Spacing[10] }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}><Text style={styles.icon}>🚛</Text></View>
        <Text style={styles.heading}>Set Up Your Haulage Profile</Text>
        <Text style={styles.subheading}>
          Tell buyers and sellers about your logistics service so they can find and trust you.
        </Text>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressBar}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotDone]}><Text style={styles.progressCheck}>✓</Text></View>
          <Text style={styles.progressLabel}>Account</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <Text style={[styles.progressLabel, { color: Colors.green[700] }]}>Profile</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={styles.progressDot} />
          <Text style={styles.progressLabel}>Activation</Text>
        </View>
      </View>

      {/* Company name (optional) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Details</Text>
        <Input
          label="Company / Business Name (optional)"
          placeholder="e.g. Musa Haulage Services"
          value={companyName}
          onChangeText={setCompanyName}
          leftIcon={<Text>🏢</Text>}
        />
      </View>

      {/* Vehicle type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Type *</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map(v => (
            <TouchableOpacity
              key={v.id}
              style={[styles.vehicleCard, vehicleType === v.id && styles.vehicleCardActive]}
              onPress={() => {
                setVehicleType(v.id);
                if (v.capacity > 0) setVehicleCapacity(v.capacity.toString());
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
              <Text style={[styles.vehicleLabel, vehicleType === v.id && styles.vehicleLabelActive]}>
                {v.label}
              </Text>
              {v.capacity > 0 && (
                <Text style={styles.vehicleCap}>~{v.capacity}t</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Capacity + plate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <Input
          label="Maximum Capacity (tonnes per trip) *"
          placeholder={selectedVehicle ? `e.g. ${selectedVehicle.capacity}` : 'e.g. 5'}
          value={vehicleCapacity}
          onChangeText={setVehicleCapacity}
          keyboardType="decimal-pad"
          leftIcon={<Text>⚖️</Text>}
        />
        <Input
          label="License Plate (optional)"
          placeholder="e.g. ABJ-123-KJ"
          value={licensePlate}
          onChangeText={setLicensePlate}
          leftIcon={<Text>🪪</Text>}
          style={{ marginTop: Spacing[3] }}
        />
        <Input
          label="Years of Experience (optional)"
          placeholder="e.g. 5"
          value={yearsExperience}
          onChangeText={setYearsExperience}
          keyboardType="number-pad"
          leftIcon={<Text>📅</Text>}
          style={{ marginTop: Spacing[3] }}
        />
      </View>

      {/* Coverage states */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Coverage States * ({selectedStates.length} selected)</Text>
          <TouchableOpacity onPress={() => setShowStateList(v => !v)}>
            <Text style={styles.toggleLink}>{showStateList ? 'Done' : 'Select States'}</Text>
          </TouchableOpacity>
        </View>

        {/* Selected state chips */}
        {selectedStates.length > 0 && !showStateList && (
          <View style={styles.statePills}>
            {selectedStates.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.statePill}
                onPress={() => toggleState(s)}
              >
                <Text style={styles.statePillText}>{s} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Full state selector */}
        {showStateList && (
          <View style={styles.stateList}>
            <TouchableOpacity
              style={styles.selectAllBtn}
              onPress={() => setSelectedStates(
                selectedStates.length === ALL_STATES.length ? [] : [...ALL_STATES]
              )}
            >
              <Text style={styles.selectAllText}>
                {selectedStates.length === ALL_STATES.length ? '✕ Deselect All' : '✓ Select All Nigeria'}
              </Text>
            </TouchableOpacity>
            <View style={styles.stateGrid}>
              {ALL_STATES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.stateChip, selectedStates.includes(s) && styles.stateChipActive]}
                  onPress={() => toggleState(s)}
                >
                  <Text style={[styles.stateChipText, selectedStates.includes(s) && styles.stateChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Coverage routes */}
      <View style={styles.section}>
        <Input
          label="Main Routes / Coverage Description (optional)"
          placeholder="e.g. Lagos - Abuja - Kano corridor, inter-state deliveries"
          value={coverageRoutes}
          onChangeText={setCoverageRoutes}
          leftIcon={<Text>🗺️</Text>}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerTitle}>📋 What happens next?</Text>
        <Text style={styles.infoBannerText}>
          After completing your profile, you'll pay a one-time activation fee of ₦3,000. 
          This keeps the platform trusted and ensures only serious logistics providers are listed.
        </Text>
      </View>

      <Button
        title={profileMutation.isPending ? 'Saving Profile…' : 'Save Profile & Continue →'}
        onPress={handleSubmit}
        loading={profileMutation.isPending}
        size="lg"
        style={styles.submitBtn}
      />

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => navigation.navigate('RegistrationFee')}
      >
        <Text style={styles.skipText}>Skip for now (complete profile later)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: Colors.white },
  container:   { paddingHorizontal: Spacing[5] },

  /* Header */
  header:      { alignItems: 'center', marginBottom: Spacing[6] },
  iconWrap:    { width: 80, height: 80, backgroundColor: Colors.green[50], borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4] },
  icon:        { fontSize: 40 },
  heading:     { ...Typography.headingLarge, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing[2] },
  subheading:  { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  /* Progress */
  progressBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[7] },
  progressStep:     { alignItems: 'center', gap: Spacing[1] },
  progressDot:      { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.gray[200], borderWidth: 2, borderColor: Colors.gray[300], alignItems: 'center', justifyContent: 'center' },
  progressDotDone:  { backgroundColor: Colors.green[700], borderColor: Colors.green[700] },
  progressDotActive:{ backgroundColor: Colors.green[500], borderColor: Colors.green[700], width: 28, height: 28, borderRadius: 14 },
  progressCheck:    { fontSize: 11, color: Colors.white, fontWeight: '900' },
  progressLine:     { width: 48, height: 2, backgroundColor: Colors.gray[200], marginHorizontal: Spacing[2] },
  progressLabel:    { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },

  /* Sections */
  section:       { marginBottom: Spacing[5] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sectionTitle:  { ...Typography.titleLarge, color: Colors.textPrimary, marginBottom: Spacing[3] },
  toggleLink:    { ...Typography.labelLarge, color: Colors.green[700] },

  /* Vehicle grid */
  vehicleGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  vehicleCard:       { width: '30%', backgroundColor: Colors.gray[50], borderRadius: Radius.lg, padding: Spacing[3], alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  vehicleCardActive: { borderColor: Colors.green[700], backgroundColor: Colors.green[50] },
  vehicleEmoji:      { fontSize: 26, marginBottom: Spacing[1] },
  vehicleLabel:      { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontWeight: '700' },
  vehicleLabelActive:{ color: Colors.green[700] },
  vehicleCap:        { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

  /* State pills */
  statePills:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[3] },
  statePill:         { backgroundColor: Colors.green[700], borderRadius: 50, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  statePillText:     { ...Typography.caption, color: Colors.white, fontWeight: '700' },

  /* State selector */
  stateList:         { backgroundColor: Colors.gray[50], borderRadius: Radius.xl, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border },
  selectAllBtn:      { alignItems: 'center', paddingVertical: Spacing[3], marginBottom: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectAllText:     { ...Typography.labelLarge, color: Colors.green[700] },
  stateGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  stateChip:         { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], backgroundColor: Colors.white, borderRadius: 50, borderWidth: 1, borderColor: Colors.border },
  stateChipActive:   { backgroundColor: Colors.green[700], borderColor: Colors.green[700] },
  stateChipText:     { ...Typography.caption, color: Colors.textSecondary },
  stateChipTextActive: { color: Colors.white, fontWeight: '700' },

  /* Info banner */
  infoBanner:      { backgroundColor: Colors.gold[100], borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[5], borderWidth: 1, borderColor: Colors.gold[400] },
  infoBannerTitle: { ...Typography.titleMedium, color: Colors.gold[700], marginBottom: Spacing[2] },
  infoBannerText:  { ...Typography.bodySmall, color: Colors.gray[700], lineHeight: 20 },

  submitBtn: { marginBottom: Spacing[3] },
  skipBtn:   { alignItems: 'center', paddingVertical: Spacing[3] },
  skipText:  { ...Typography.bodySmall, color: Colors.textMuted },
});
