import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const isDev = import.meta.env.DEV;
let devicePushToken = null;

const logger = {
  info: (...args) => {
    if (isDev) console.log(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
};

export function getDevicePushToken() {
  return devicePushToken;
}

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      logger.warn('[Push] Permission not granted:', permResult.receive);
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      devicePushToken = token.value;
      logger.info('[Push] Device token registered');
    });

    PushNotifications.addListener('registrationError', (error) => {
      logger.error('[Push] Registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      logger.info('[Push] Notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      logger.info('[Push] Notification action:', action);
    });
  } catch (error) {
    logger.error('[Push] Init failed:', error);
  }
}
