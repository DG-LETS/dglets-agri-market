/**
 * usePushNotifications
 *
 * Registers the device Expo push token with the backend once the user
 * is authenticated. Also sets up a listener for incoming notifications
 * while the app is in the foreground.
 *
 * Usage: call inside a component that's always mounted when authenticated
 * (e.g. the root of MainNavigator or App.tsx after auth).
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@store/authStore';
import { useSettingsStore } from '@store/settingsStore';
import { usersApi } from '@services/api';

/* Configure how notifications appear when app is foregrounded */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export function usePushNotifications() {
  const { isAuthenticated } = useAuthStore();
  const { notificationsEnabled } = useSettingsStore();
  const registered = useRef(false);
  const listenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated || registered.current) return;
    if (Platform.OS === 'web') return;

    /* If notifications disabled by user, remove listener */
    if (!notificationsEnabled) {
      listenerRef.current?.remove();
      return;
    }

    let cancelled = false;

    async function register() {
      try {
        /* Request permission */
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.info('[Push] Permission not granted');
          return;
        }

        /* Get Expo push token */
        const tokenData = await Notifications.getExpoPushTokenAsync();
        if (cancelled) return;

        /* Register with backend */
        await usersApi.registerPushToken(tokenData.data, Platform.OS);
        registered.current = true;
        console.info('[Push] Token registered:', tokenData.data.slice(0, 20) + '…');

        /* Android notification channel */
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name:       'DG-LETS Notifications',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
          });
        }
      } catch (err) {
        console.warn('[Push] Registration failed:', err);
      }
    }

    register();

    /* Foreground notification listener */
    listenerRef.current = Notifications.addNotificationReceivedListener(notification => {
      console.info('[Push] Foreground notification:', notification.request.content.title);
    });

    return () => {
      cancelled = true;
      listenerRef.current?.remove();
    };
  }, [isAuthenticated, notificationsEnabled]);
}
