import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const adminPanelSource = readFileSync(new URL('../src/pages/AdminPanel.jsx', import.meta.url), 'utf8');
const supabaseSource = readFileSync(new URL('../src/lib/supabase.js', import.meta.url), 'utf8');

assert.ok(!appSource.includes('"/admin", "/privacy-policy"'), 'PUBLIC_PATHS must not include /admin');
assert.ok(appSource.includes('path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPanel /></ProtectedRoute>}'), 'Admin route must be protected for admin role only');
assert.ok(appSource.includes('const getTrustedRole = (profile) => profile?.role || null;'), 'Route authorization must not trust localStorage role');
assert.ok(adminPanelSource.includes('const { profile, isLoadingAuth } = useAuth();'), 'AdminPanel must consume trusted auth context');
assert.ok(adminPanelSource.includes('if (!isAdmin) {'), 'AdminPanel must block non-admin users before privileged actions');
assert.ok(supabaseSource.includes('import.meta.env.VITE_SUPABASE_URL'), 'Supabase URL must come from environment variables');
assert.ok(supabaseSource.includes('import.meta.env.VITE_SUPABASE_ANON_KEY'), 'Supabase anon key must come from environment variables');

console.log('Authorization smoke tests passed');
