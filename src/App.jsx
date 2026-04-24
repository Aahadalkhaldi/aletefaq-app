import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { initPushNotifications } from "@/lib/push-notifications";
import { isConfigured } from "@/lib/supabase";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import AppLayout from "./components/layout/AppLayout.jsx";
import LawyerLayout from "./components/layout/LawyerLayout";
import AdminPanel from "./pages/AdminPanel";

const FullScreenLoader = ({ onLogout }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#001F3F] z-[9999]">
    <div className="flex flex-col items-center gap-6">
      <div className="w-16 h-16 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin" />
      <div className="text-center">
        <p className="text-lg font-medium text-white mb-2">جاري تأمين اتصالك...</p>
        <button onClick={onLogout} className="mt-4 px-6 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30">
          تسجيل الخروج
        </button>
      </div>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isAuthenticated, profile, isLoadingAuth, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated) initPushNotifications();
  }, [isAuthenticated]);

  if (isLoadingAuth) return <FullScreenLoader onLogout={logout} />;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!isAuthenticated ? <Splash /> : <Navigate to={profile?.role === 'lawyer' || profile?.role === 'admin' ? '/lawyer-dashboard' : '/dashboard'} replace />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={profile?.role === 'lawyer' || profile?.role === 'admin' ? '/lawyer-dashboard' : '/dashboard'} replace />} />

      {/* Protected Lawyer/Admin Routes */}
      <Route element={isAuthenticated && (profile?.role === 'lawyer' || profile?.role === 'admin') ? <LawyerLayout /> : <Navigate to="/login" replace />}>
        <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Route>

      {/* Protected Client Routes */}
      <Route element={isAuthenticated && profile?.role === 'client' ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  if (!isConfigured) return <div className="p-20 text-center font-bold">خطأ في الإعدادات</div>;

  return (
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;