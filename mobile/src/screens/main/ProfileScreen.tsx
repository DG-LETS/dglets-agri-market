import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Badge } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { usersApi } from '@services/api';
import { useImageUpload } from '@hooks/useImageUpload';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;
};

const roleLabels: Record<string, string> = {
  FARMER:     'Farmer',
  BUYER:      'Buyer',
  TRADER:     'Trader',
  AGGREGATOR: 'Aggregator',
  HAULAGE:    'Haulage Partner',
  PROCESSOR:  'Processor',
  EXPORTER:   'Exporter',
  ADMIN:      'Admin',
};

interface MenuItemProps { emoji: string; label: string; onPress: () => void; danger?: boolean; }
function MenuItem({ emoji, label, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuthStore();
  const queryClient = useQueryClient();

  /* ── Profile image upload ── */
  const { images: pickedImages, uploading, pickImages, uploadAll } = useImageUpload({
    mode: 'single', folder: 'profile',
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async () => {
      const urls = await uploadAll();
      if (!urls[0]) throw new Error('Upload failed');
      return usersApi.updateMe({ profileImage: urls[0] }).then(r => r.data);
    },
    onSuccess: () => {
      refreshUser();
      Alert.alert('✓ Profile photo updated!');
    },
    onError: (e: any) => {
      Alert.alert('Update Failed', e?.response?.data?.message ?? 'Could not update photo.');
    },
  });

  /* Pick and immediately upload */
  const handleAvatarPress = async () => {
    await pickImages();
    /* Upload triggered by useEffect watching pickedImages */
  };

  /* When a new image is picked, upload it straight away */
  React.useEffect(() => {
    if (pickedImages.length > 0 && !pickedImages[0].uploaded && !uploading) {
      updateAvatarMutation.mutate();
    }
  }, [pickedImages]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  const isSeller = ['FARMER','TRADER','AGGREGATOR','PROCESSOR','EXPORTER','HAULAGE'].includes(user.role);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: Spacing[10] }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[4] }]}>
        <TouchableOpacity
          style={styles.avatar}
          onPress={handleAvatarPress}
          activeOpacity={0.8}
        >
          {(pickedImages[0]?.uri || user?.profileImage) ? (
            <Image
              source={{ uri: pickedImages[0]?.uri ?? user?.profileImage }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </Text>
          )}
          <View style={styles.avatarEditBadge}>
            <Text style={styles.avatarEditIcon}>{uploading ? '⏳' : '📷'}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
        <View style={styles.badges}>
          <Badge label={roleLabels[user.role] || user.role} variant="green" />
          <Badge label={user.status === 'ACTIVE' ? '✓ Active' : user.status} variant={user.status === 'ACTIVE' ? 'success' : 'warning'} />
        </View>
      </View>

      {/* Verification status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification Status</Text>
        <View style={styles.card}>
          {[
            { label: 'Phone & Email', status: 'verified',  icon: '📱' },
            { label: 'Identity Document', status: 'pending', icon: '🪪' },
            { label: 'Farm / Business Info', status: 'unverified', icon: '🌾' },
          ].map(item => (
            <View key={item.label} style={styles.verifyRow}>
              <Text style={styles.verifyIcon}>{item.icon}</Text>
              <Text style={styles.verifyLabel}>{item.label}</Text>
              <Badge
                label={item.status === 'verified' ? '✓ Verified' : item.status === 'pending' ? 'Pending' : 'Not started'}
                variant={item.status === 'verified' ? 'success' : item.status === 'pending' ? 'warning' : 'gray'}
                size="sm"
              />
            </View>
          ))}
        </View>
      </View>

      {/* Account menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <MenuItem emoji="👤" label="Edit Profile"        onPress={() => navigation.navigate('EditProfile', { section: 'basic' })} />
          <MenuItem emoji="🌾" label="Farm / Business Profile" onPress={() => navigation.navigate('EditProfile', { section: isSeller ? 'farmer' : 'buyer' })} />
          <MenuItem emoji="💳" label="Payout Details"      onPress={() => Alert.alert('Coming Soon', 'Payout details will be available when payments go live.')} />
          <MenuItem emoji="🔔" label="Notifications"       onPress={() => Alert.alert('Coming Soon', 'Notification preferences coming in the next update.')} />
          <MenuItem emoji="🌍" label="Language — English"  onPress={() => Alert.alert('Coming Soon', 'More languages coming soon.')} />
        </View>
      </View>

      {/* Rewards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rewards</Text>
        <TouchableOpacity style={styles.rewardCard} activeOpacity={0.8}>
          <View>
            <Text style={styles.rewardBalance}>0 DGR</Text>
            <Text style={styles.rewardLabel}>Reward Balance · 🌱 Seed Level</Text>
          </View>
          <Text style={styles.rewardArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <View style={[styles.section, { marginTop: Spacing[2] }]}>
        <View style={styles.card}>
          <MenuItem emoji="🚪" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={styles.version}>DG-LETS Agri Market v0.1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.background },
  header:     { backgroundColor: Colors.green[700], alignItems: 'center', paddingHorizontal: Spacing[5], paddingBottom: Spacing[6] },
  avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3], borderWidth: 3, borderColor: 'rgba(255,255,255,.3)', overflow: 'hidden', position: 'relative' },
  avatarImage:{ width: 80, height: 80, borderRadius: 40 },
  avatarText: { ...Typography.headingLarge, color: Colors.white },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.gold[600], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  avatarEditIcon: { fontSize: 11 },
  name:       { ...Typography.headingSmall, color: Colors.white, marginBottom: Spacing[1] },
  phone:      { ...Typography.bodyMedium, color: 'rgba(255,255,255,.75)', marginBottom: Spacing[3] },
  badges:     { flexDirection: 'row', gap: Spacing[2] },
  section:    { paddingHorizontal: Spacing[5], marginTop: Spacing[5] },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing[3] },
  card:       { backgroundColor: Colors.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  verifyRow:  { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  verifyIcon: { fontSize: 20, marginRight: Spacing[3] },
  verifyLabel:{ ...Typography.bodyMedium, color: Colors.textSecondary, flex: 1 },
  menuItem:   { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  menuEmoji:  { fontSize: 18, marginRight: Spacing[3] },
  menuLabel:  { ...Typography.bodyLarge, color: Colors.textSecondary, flex: 1 },
  menuLabelDanger: { color: Colors.error },
  menuArrow:  { ...Typography.headingSmall, color: Colors.gray[300] },
  rewardCard: { backgroundColor: Colors.green[700], borderRadius: Radius.xl, padding: Spacing[5], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.green },
  rewardBalance: { ...Typography.headingMedium, color: Colors.white },
  rewardLabel:   { ...Typography.bodyMedium, color: 'rgba(255,255,255,.75)', marginTop: 2 },
  rewardArrow:   { ...Typography.headingLarge, color: 'rgba(255,255,255,.6)' },
  version:    { ...Typography.caption, color: Colors.gray[400], textAlign: 'center', marginTop: Spacing[8] },
});
