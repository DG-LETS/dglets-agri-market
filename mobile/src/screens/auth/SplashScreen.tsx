import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '@theme/index';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'Splash'> };

/* Splash is always full-screen green — dark mode doesn't apply here */
export function SplashScreen({ navigation }: Props) {
  const opacity    = new Animated.Value(0);
  const translateY = new Animated.Value(20);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => navigation.replace('Onboarding'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🌾</Text>
        </View>
        <Text style={styles.appName}>DG-LETS</Text>
        <Text style={styles.appSub}>AGRI MARKET</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>From Farm to Phone.</Text>
        <Text style={styles.tagline}>Market to the World.</Text>
      </Animated.View>
      <Text style={styles.company}>DG-LETS Agri &amp; Tech Nig Ltd</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center' },
  content:   { alignItems: 'center' },
  logoWrap:  { width: 100, height: 100, backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[5], borderWidth: 2, borderColor: 'rgba(255,255,255,.25)' },
  logoEmoji: { fontSize: 52 },
  appName:   { ...Typography.displayMedium, color: '#ffffff', letterSpacing: 2 },
  appSub:    { ...Typography.titleLarge, color: 'rgba(255,255,255,.8)', letterSpacing: 4, marginTop: 4, marginBottom: Spacing[5] },
  divider:   { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,.3)', marginBottom: Spacing[5] },
  tagline:   { ...Typography.bodyLarge, color: 'rgba(255,255,255,.85)', textAlign: 'center' },
  company:   { position: 'absolute', bottom: Spacing[10], ...Typography.bodySmall, color: 'rgba(255,255,255,.5)' },
});
