import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Detect if running inside Capacitor (native app)
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;

// In Capacitor, API calls need the full Base44 server URL
// In browser (iframe), relative URLs work fine
const serverUrl = isCapacitor ? 'https://base44.app' : '';

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl: appBaseUrl || `https://aletefaq-f8753dd9.base44.app`
});
