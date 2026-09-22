import React, { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore }     from '@store/authStore';
import { useSettingsStore } from '@store/settingsStore';
import { onSessionExpired } from '@services/api';
import { AuthNavigator }    from './AuthNavigator';
import { MainNavigator }    from './MainNavigator';
import { LoadingState }     from '@components/ui';
import { Colors }           from '@theme/colors';

const DGLetsDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary:      Colors.green[700],
    background:   '#0f1a14',
    card:         '#1a2d20',
    text:         '#f0f7f1',
    border:       '#2d4a35',
    notification: Colors.green[400],
  },
};

const DGLetsLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary:      Colors.green[700],
    background:   '#f9fafb',
    card:         '#ffffff',
    text:         '#111827',
    border:       '#e5e7eb',
    notification: Colors.green[700],
  },
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

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
  const { darkMode, loadSettings } = useSettingsStore();

  useEffect(() => {
    if (DEMO_MODE) {
      setDemoUser(MOCK_USER);
    } else {
      initialize();
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onSessionExpired(() => logout());
    return unsub;
  }, [logout]);

  if (!isInitialized) return <LoadingState fullScreen message="Loading DG-LETS…" />;

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#0f1a14' : '#f9fafb' }}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={darkMode ? '#0f1a14' : Colors.green[700]}
      />
      <NavigationContainer theme={darkMode ? DGLetsDarkTheme : DGLetsLightTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
