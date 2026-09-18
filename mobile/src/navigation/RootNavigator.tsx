import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '@store/authStore';
import { onSessionExpired } from '@services/api';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { LoadingState } from '@components/ui';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

/* ─────────────────────────────────────────────────────────
   DEMO_MODE = true  → skip backend, show full app with mock user
   DEMO_MODE = false → normal auth flow (requires backend)
───────────────────────────────────────────────────────── */
const DEMO_MODE = false;

const MOCK_USER = {
  id:         'demo-001',
  firstName:  'Daniel',
  lastName:   'Osadolor',
  phone:      '08070566642',
  email:      'demo@dglets.com',
  role:       'HAULAGE' as const,
  isVerified: true,
  isActive:   true,
  createdAt:  new Date().toISOString(),
};

export function RootNavigator() {
  const { isAuthenticated, isInitialized, initialize, logout, setDemoUser } = useAuthStore();

  useEffect(() => {
    if (DEMO_MODE) {
      /* Inject mock user — no API call needed */
      setDemoUser(MOCK_USER);
    } else {
      initialize();
    }
  }, []);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSessionExpired(() => logout());
    return unsub;
  }, [logout]);

  if (!isInitialized) return <LoadingState fullScreen message="Loading DG-LETS…" />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
