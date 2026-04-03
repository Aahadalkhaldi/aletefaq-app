import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Initialize push notifications for Capacitor (iOS/Android).
 * Call this once at app startup after auth is confirmed.
 * No-op in web/browser context.
 */
export async function initPushNotifications() {
  // Only run on native platforms
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('[Push] Permission not granted:', permResult.receive);
      return;
    }

    // Register with APNs / FCM
    await PushNotifications.register();

    // Listen for registration success
    PushNotifications.addListener('registration', (token) => {
      console.log('[Push] Device token:', token.value);
      // Store the token in localStorage for later use by API calls
      localStorage.setItem('device_push_token', token.value);
      // TODO: Save token to Base44 user profile or DeviceTokens entity
      // e.g., base44.entities.DeviceToken.create({ token: token.value, platform: Capacitor.getPlatform() });
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Registration error:', error);
    });

    // Listen for push notifications received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Notification received:', notification);
      // Could show an in-app toast/banner here
    });

    // Listen for push notification action (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Notification action:', action);
      // Could navigate to relevant screen based on action.notification.data
    });

  } catch (error) {
    console.error('[Push] Init failed:', error);
  }
}
