import { createClient } from '@base44/sdk';

// Use the production keys provided by the user
const APP_ID = "69c61dda06ecec47f8753dd9";
const API_KEY = "cbd0d0ccb86f475d8b3bd5acb118f50f";

export const base44 = createClient({
  appId: APP_ID,
  serverUrl: 'https://base44.app',
  requiresAuth: false,
  appBaseUrl: 'https://aletefaq-f8753dd9.base44.app',
  headers: {
    "api_key": API_KEY
  }
});