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

export function RootNavigator() {
  const { isAuthenticated, isInitialized, initialize, logout } = useAuthStore();

  /* Boot — restore session from SecureStore */
  useEffect(() => { initialize(); }, []);

  /* When the Axios interceptor clears tokens after a failed refresh,
     fire logout() so Zustand state resets and the navigator re-renders
     to the Auth stack automatically. */
  useEffect(() => {
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
