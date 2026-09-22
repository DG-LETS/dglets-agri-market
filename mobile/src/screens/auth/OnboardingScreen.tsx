import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { Button } from '@components/ui';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

const { width } = Dimensions.get('window');

/* Onboarding is always full-screen coloured — dark mode doesn't apply */
const slides = [
  { id: '1', emoji: '🌾', title: 'Connect Farmers\nto Buyers',       description: 'Find verified farmers and fresh produce directly. No middlemen, fair prices, real inventory.', bg: Colors.green[700] },
  { id: '2', emoji: '🗺️', title: 'Smart Map\nDiscovery',             description: 'Find the cheapest, nearest, highest-rated suppliers using our intelligent Smart Map.',           bg: Colors.green[800] },
  { id: '3', emoji: '🚛', title: 'Integrated\nHaulage',              description: 'Approved logistics partners bid on your delivery. Track in real-time from farm to doorstep.',    bg: Colors.green[600] },
  { id: '4', emoji: '🏆', title: 'Earn DGR\nRewards',               description: 'Every purchase, review and referral earns you DGR reward tokens.',                               bg: Colors.green[700] },
];

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Onboarding'> };

export function OnboardingScreen({ navigation }: Props) {
  const insets  = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const isLast  = current === slides.length - 1;

  const handleNext = () => {
    if (isLast) { navigation.replace('Login'); return; }
    const next = current + 1;
    flatRef.current?.scrollToIndex({ index: next });
    setCurrent(next);
  };

  return (
    <View style={[styles.container, { backgroundColor: slides[current].bg }]}>
      <FlatList
        ref={flatRef} data={slides} horizontal pagingEnabled
        showsHorizontalScrollIndicator={false} scrollEnabled={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, backgroundColor: item.bg }]}>
            <View style={styles.emojiWrap}><Text style={styles.emoji}>{item.emoji}</Text></View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
        ))}
      </View>
      <View style={[styles.actions, { paddingBottom: insets.bottom + Spacing[4] }]}>
        <Button title={isLast ? 'Get Started' : 'Next'} onPress={handleNext} size="lg" style={styles.nextBtn} />
        {!isLast && (
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide:     { alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  emojiWrap: { width: 120, height: 120, backgroundColor: 'rgba(255,255,255,.15)', borderRadius: Radius['3xl'], alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[10], borderWidth: 2, borderColor: 'rgba(255,255,255,.2)' },
  emoji:     { fontSize: 60 },
  title:     { ...Typography.displayMedium, color: '#ffffff', textAlign: 'center', marginBottom: Spacing[5] },
  desc:      { ...Typography.bodyLarge, color: 'rgba(255,255,255,.8)', textAlign: 'center', lineHeight: 26, maxWidth: 300 },
  dots:      { flexDirection: 'row', justifyContent: 'center', gap: Spacing[2], marginBottom: Spacing[6] },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.35)' },
  dotActive: { width: 24, backgroundColor: '#ffffff' },
  actions:   { paddingHorizontal: Spacing[6], gap: Spacing[3] },
  nextBtn:   { backgroundColor: 'rgba(255,255,255,.2)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.4)' },
  skipBtn:   { alignItems: 'center', padding: Spacing[2] },
  skipText:  { ...Typography.bodyLarge, color: 'rgba(255,255,255,.6)', fontWeight: '600' },
});
