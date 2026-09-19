import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { RootNavigator } from '@navigation/RootNavigator';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { useSettingsStore } from '@store/settingsStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries:   { retry: 0, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

function AppInner() {
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  usePushNotifications();

  return (
    <>
      <RootNavigator />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppInner />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
