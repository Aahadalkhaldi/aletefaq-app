import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { initPushNotifications } from "@/lib/push-notifications";

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
import Notifications from "./pages/Notifications";
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
import Register from "./pages/Register";
import PendingApproval from "./pages/PendingApproval";
import AdminPanel from "./pages/AdminPanel";

const PUBLIC_PATHS = ["/", "/splash", "/login", "/register", "/pending", "/privacy-policy", "/terms-of-service"];

const FullScreenLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#123E7C" }}>
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm" style={{ color: "#6B7280", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
        جارٍ التحميل...
      </p>
    </div>
  </div>
);

const getTrustedRole = (profile) => profile?.role || null;

const redirectByRole = (role) => {
  if (role === "admin") return "/admin";
  if (role === "lawyer") return "/lawyer-dashboard";
  if (role === "client") return "/dashboard";
  return "/splash";
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, profile, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/splash" replace />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.status === "pending") {
    return <Navigate to="/pending" replace />;
  }

  if (profile.status === "rejected") {
    return <Navigate to="/login" replace />;
  }

  const role = getTrustedRole(profile);

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to={redirectByRole(role)} replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, profile, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return children;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.status === "pending") {
    return <Navigate to="/pending" replace />;
  }

  if (profile.status === "rejected") {
    return children;
  }

  return <Navigate to={redirectByRole(getTrustedRole(profile))} replace />;
};

const PendingRoute = () => {
  const { isAuthenticated, profile, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.status === "pending") {
    return <PendingApproval />;
  }

  if (profile.status === "rejected") {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={redirectByRole(getTrustedRole(profile))} replace />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError, profile } = useAuth();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initPushNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const waitingForProfile = false;
  const isLoading = ((isLoadingPublicSettings || isLoadingAuth) && !loadingTimedOut) || waitingForProfile;

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    }

    if (authError.type === "auth_required") {
      const path = window.location.pathname;
      const isPublicPath = PUBLIC_PATHS.includes(path);
      if (!isPublicPath) {
        return (
          <Routes>
            <Route path="*" element={<Navigate to="/splash" replace />} />
          </Routes>
        );
      }
    }
  }

  return (
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><Splash /></PublicOnlyRoute>} />
      <Route path="/splash" element={<PublicOnlyRoute><Splash /></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/pending" element={<PendingRoute />} />
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
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (e) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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
