import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

// HARDCODED CONSTANTS AS PER USER DOCUMENTATION TO PREVENT NULL ERRORS
const APP_ID = "69c61dda06ecec47f8753dd9";
const API_KEY = "cbd0d0ccb86f475d8b3bd5acb118f50f";

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Always use full Base44 server URL since the app runs locally (not inside Base44 iframe)
const serverUrl = 'https://base44.app';

console.log("[Base44] Initializing client with App ID:", appId || APP_ID);

export const base44 = createClient({
  appId: appId || APP_ID,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl: appBaseUrl || 'https://aletefaq-f8753dd9.base44.app',
  headers: {
    "api_key": API_KEY
  }
});