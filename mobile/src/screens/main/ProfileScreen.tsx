import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Badge } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { useSettingsStore } from '@store/settingsStore';
import { usersApi } from '@services/api';
import { useImageUpload } from '@hooks/useImageUpload';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '@navigation/MainNavigator';

type Props = { navigation: StackNavigationProp<ProfileStackParamList, 'ProfileHome'> };

const roleLabels: Record<string, string> = {
  FARMER:'Farmer', BUYER:'Buyer', TRADER:'Trader', AGGREGATOR:'Aggregator',
  HAULAGE:'Haulage Partner', PROCESSOR:'Processor', EXPORTER:'Exporter', ADMIN:'Admin',
};

export function ProfileScreen({ navigation }: Props) {
  const insets     = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuthStore();
  const { darkMode, notificationsEnabled, toggleDarkMode, toggleNotifications } = useSettingsStore();
  const C          = useThemeColors();

  const { images: pickedImages, uploading, pickImages, uploadAll } = useImageUpload({ mode: 'single', folder: 'profile' });

  const updateAvatarMutation = useMutation({
    mutationFn: async () => {
      const urls = await uploadAll();
      if (!urls[0]) throw new Error('Upload failed');
      return usersApi.updateMe({ profileImage: urls[0] }).then(r => r.data);
    },
    onSuccess: () => { refreshUser(); Alert.alert('✓ Profile photo updated!'); },
    onError: (e: any) => Alert.alert('Update Failed', e?.response?.data?.message ?? 'Could not update photo.'),
  });

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
  const s = makeStyles(C);

  const MenuItem = ({ emoji, label, onPress, danger }: { emoji: string; label: string; onPress: () => void; danger?: boolean }) => (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.menuEmoji}>{emoji}</Text>
      <Text style={[s.menuLabel, danger && s.menuLabelDanger]}>{label}</Text>
      <Text style={s.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: Spacing[10] }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing[4] }]}>
        <TouchableOpacity style={s.avatar} onPress={pickImages} activeOpacity={0.8}>
          {(pickedImages[0]?.uri || user?.profileImage) ? (
            <Image source={{ uri: pickedImages[0]?.uri ?? user?.profileImage }} style={s.avatarImage} />
          ) : (
            <Text style={s.avatarText}>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</Text>
          )}
          <View style={s.avatarEditBadge}>
            <Text style={s.avatarEditIcon}>{uploading ? '⏳' : '📷'}</Text>
          </View>
        </TouchableOpacity>
        <Text style={s.name}>{user.firstName} {user.lastName}</Text>
        <Text style={s.phone}>{user.phone}</Text>
        <View style={s.badges}>
          <Badge label={roleLabels[user.role] || user.role} variant="green" />
          <Badge label={user.status === 'ACTIVE' ? '✓ Active' : user.status} variant={user.status === 'ACTIVE' ? 'success' : 'warning'} />
        </View>
      </View>

      {/* Verification */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Verification Status</Text>
        <View style={s.card}>
          {[
            { label: 'Phone & Email',        status: 'verified',   icon: '📱' },
            { label: 'Identity Document',     status: 'pending',    icon: '🪪' },
            { label: 'Farm / Business Info',  status: 'unverified', icon: '🌾' },
          ].map(item => (
            <View key={item.label} style={s.verifyRow}>
              <Text style={s.verifyIcon}>{item.icon}</Text>
              <Text style={s.verifyLabel}>{item.label}</Text>
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
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.card}>
          {isSeller && user.role !== 'HAULAGE' && (
            <MenuItem emoji="📊" label="Seller Dashboard" onPress={() => navigation.navigate('SellerDashboard')} />
          )}
          {user.role === 'HAULAGE' && (
            <MenuItem emoji="🚛" label="My Haulage Dashboard" onPress={() => navigation.navigate('HaulageProviderDashboard')} />
          )}
          <MenuItem emoji="👤" label="Edit Profile"            onPress={() => navigation.navigate('EditProfile', { section: 'basic' })} />
          <MenuItem emoji="🌾" label="Farm / Business Profile" onPress={() => navigation.navigate('EditProfile', { section: isSeller ? 'farmer' : 'buyer' })} />
          <MenuItem emoji="❤️" label="Saved Products"          onPress={() => navigation.navigate('SavedProducts')} />
          <MenuItem emoji="💳" label="Payout Details"          onPress={() => Alert.alert('Coming Soon', 'Payout details will be available soon.')} />

          <View style={s.menuItem}>
            <Text style={s.menuEmoji}>🌙</Text>
            <Text style={s.menuLabel}>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={toggleDarkMode}
              trackColor={{ false: C.gray[300], true: C.green[600] }}
              thumbColor={darkMode ? C.green[200] : '#ffffff'} />
          </View>

          <View style={s.menuItem}>
            <Text style={s.menuEmoji}>🔔</Text>
            <Text style={s.menuLabel}>Notifications</Text>
            <Switch value={notificationsEnabled} onValueChange={toggleNotifications}
              trackColor={{ false: C.gray[300], true: C.green[600] }}
              thumbColor={notificationsEnabled ? C.green[200] : '#ffffff'} />
          </View>

          <MenuItem emoji="🌍" label="Language — English" onPress={() => Alert.alert('Coming Soon', 'More languages coming soon.')} />
        </View>
      </View>

      {/* Rewards */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Rewards</Text>
        <TouchableOpacity style={s.rewardCard} activeOpacity={0.8}>
          <View>
            <Text style={s.rewardBalance}>0 DGR</Text>
            <Text style={s.rewardLabel}>Reward Balance · 🌱 Seed Level</Text>
          </View>
          <Text style={s.rewardArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <View style={[s.section, { marginTop: Spacing[2] }]}>
        <View style={s.card}>
          <MenuItem emoji="🚪" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={s.version}>DG-LETS Agri Market v0.1.0</Text>
    </ScrollView>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:            { flex: 1, backgroundColor: C.background },
    header:          { backgroundColor: C.green[700], alignItems: 'center', paddingHorizontal: Spacing[5], paddingBottom: Spacing[6] },
    avatar:          { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3], borderWidth: 3, borderColor: 'rgba(255,255,255,.3)', overflow: 'hidden' },
    avatarImage:     { width: 80, height: 80, borderRadius: 40 },
    avatarText:      { ...Typography.headingLarge, color: '#ffffff' },
    avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold[600], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
    avatarEditIcon:  { fontSize: 11 },
    name:            { ...Typography.headingSmall, color: '#ffffff', marginBottom: Spacing[1] },
    phone:           { ...Typography.bodyMedium, color: 'rgba(255,255,255,.75)', marginBottom: Spacing[3] },
    badges:          { flexDirection: 'row', gap: Spacing[2] },
    section:         { paddingHorizontal: Spacing[5], marginTop: Spacing[5] },
    sectionTitle:    { ...Typography.labelLarge, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing[3] },
    card:            { backgroundColor: C.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    verifyRow:       { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.border },
    verifyIcon:      { fontSize: 20, marginRight: Spacing[3] },
    verifyLabel:     { ...Typography.bodyMedium, color: C.textSecondary, flex: 1 },
    menuItem:        { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.gray[200] },
    menuEmoji:       { fontSize: 18, marginRight: Spacing[3] },
    menuLabel:       { ...Typography.bodyLarge, color: C.textSecondary, flex: 1 },
    menuLabelDanger: { color: C.error },
    menuArrow:       { ...Typography.headingSmall, color: C.gray[300] },
    rewardCard:      { backgroundColor: C.green[700], borderRadius: Radius.xl, padding: Spacing[5], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadow.green },
    rewardBalance:   { ...Typography.headingMedium, color: '#ffffff' },
    rewardLabel:     { ...Typography.bodyMedium, color: 'rgba(255,255,255,.75)', marginTop: 2 },
    rewardArrow:     { ...Typography.headingLarge, color: 'rgba(255,255,255,.6)' },
    version:         { ...Typography.caption, color: C.textMuted, textAlign: 'center', marginTop: Spacing[8] },
  });
}
