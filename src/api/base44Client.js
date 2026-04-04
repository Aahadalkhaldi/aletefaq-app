import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Always use full Base44 server URL since the app runs locally (not inside Base44 iframe)
const serverUrl = 'https://base44.app';

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl: appBaseUrl || 'https://aletefaq-f8753dd9.base44.app'
});
