import { useEffect, useState } from "react";
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
import Dashboard from "./pages/Dashboard";
import Matters from "./pages/Matters";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail.jsx";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Vault from "./pages/Vault";
import Billing from "./pages/Billing";
import Appointments from "./pages/Appointments";
import AIAssistant from "./pages/AIAssistant";
import Profile from "./pages/Profile";
import Courts from "./pages/Courts";
import CourtDetail from "./pages/CourtDetail";
import ServiceRequests from "./pages/ServiceRequests";
import Analytics from "./pages/Analytics";
import NotificationSettings from "./pages/NotificationSettings";
import SecuritySettings from "./pages/SecuritySettings";
import SupportSettings from "./pages/SupportSettings";
import AppLayout from "./components/layout/AppLayout.jsx";
import LawyerLayout from "./components/layout/LawyerLayout";
import ClientReports from "./pages/ClientReports";
import ClientHearings from "./pages/ClientHearings";
import DocumentSigning from "./pages/DocumentSigning";
import OfficeAnalytics from "./pages/OfficeAnalytics";
import FinanceDashboard from "./pages/FinanceDashboard";
import MeetingScheduler from "./pages/MeetingScheduler";
import Clients from "./pages/Clients";
import Hearings from "./pages/Hearings";
import FollowUps from "./pages/FollowUps";
import LawyerProfile from "./pages/LawyerProfile";
import Parties from "./pages/Parties";
import LawyerDashboard from "./pages/LawyerDashboard";
import LawyerMonitoring from "./pages/LawyerMonitoring";
import LawyerReports from "./pages/LawyerReports";
import ClientCasesPortal from "./pages/ClientCasesPortal";
import NotificationCenter from "./pages/NotificationCenter";
import LawyerNotificationManager from "./pages/LawyerNotificationManager";
import ClientProfile from "./pages/ClientProfile";
import ClientVault from "./pages/ClientVault";
import LawyerServiceRequests from "./pages/LawyerServiceRequests";
import LawyerSendForSignature from "./components/signature/LawyerSendForSignature";
import CaseTracking from "./pages/CaseTracking";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";

const FullScreenLoader = ({ onLogout }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#001F3F] z-[9999]">
    <div className="flex flex-col items-center gap-6">
      <div className="w-16 h-16 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin" />
      <div className="text-center">
        <p className="text-lg font-medium text-white mb-2">جاري تأمين اتصالك...</p>
        <p className="text-sm text-gray-400">يرجى الانتظار لحظات</p>
      </div>
      <button onClick={onLogout} className="mt-4 px-6 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition-colors">
        تسجيل الخروج
      </button>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, profile, isLoadingAuth, logout } = useAuth();
  if (isLoadingAuth) return <FullScreenLoader onLogout={logout} />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!profile) return <FullScreenLoader onLogout={logout} />;
  const role = profile.role;
  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to={role === "lawyer" || role === "admin" ? "/lawyer-dashboard" : "/dashboard"} replace />;
  }
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, profile, isLoadingAuth, logout } = useAuth();
  if (isLoadingAuth) return <FullScreenLoader onLogout={logout} />;
  if (!isAuthenticated) return children;
  if (!profile) return <FullScreenLoader onLogout={logout} />;
  const role = profile.role;
  return <Navigate to={role === "lawyer" || role === "admin" ? "/lawyer-dashboard" : "/dashboard"} replace />;
};

const AuthenticatedApp = () => {
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (isAuthenticated) initPushNotifications();
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><Splash /></PublicOnlyRoute>} />
      <Route path="/splash" element={<PublicOnlyRoute><Splash /></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPanel /></ProtectedRoute>} />
      <Route element={<ProtectedRoute allowedRoles={["client"]}><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/matters" element={<Matters />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/courts" element={<Courts />} />
        <Route path="/courts/:id" element={<CourtDetail />} />
        <Route path="/services" element={<ServiceRequests />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<ClientReports />} />
        <Route path="/my-hearings" element={<ClientHearings />} />
        <Route path="/signing" element={<DocumentSigning />} />
        <Route path="/notification-settings" element={<NotificationSettings />} />
        <Route path="/security-settings" element={<SecuritySettings />} />
        <Route path="/support-settings" element={<SupportSettings />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/my-cases" element={<ClientCasesPortal />} />
        <Route path="/case-tracking/:id" element={<CaseTracking />} />
        <Route path="/my-vault" element={<ClientVault />} />
        <Route path="/notifications-center" element={<NotificationCenter />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["lawyer", "admin"]}><LawyerLayout /></ProtectedRoute>}>
        <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/office-analytics" element={<OfficeAnalytics />} />
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/meetings" element={<MeetingScheduler />} />
        <Route path="/hearings" element={<Hearings />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/followups" element={<FollowUps />} />
        <Route path="/lawyer-profile" element={<LawyerProfile />} />
        <Route path="/monitoring" element={<LawyerMonitoring />} />
        <Route path="/reports" element={<LawyerReports />} />
        <Route path="/parties" element={<Parties />} />
        <Route path="/notification-manager" element={<LawyerNotificationManager />} />
        <Route path="/court-requests" element={<LawyerServiceRequests />} />
        <Route path="/client-profile" element={<ClientProfile />} />
        <Route path="/signature-requests" element={<LawyerSendForSignature />} />
      </Route>
      <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  if (!isConfigured) return <div>Config Missing</div>;
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