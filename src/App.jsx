import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { LanguageProvider } from "./lib/LanguageContext";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import AppLayout from "./components/layout/AppLayout.jsx";
import LawyerLayout from "./components/layout/LawyerLayout";

const FullScreenLoader = ({ onLogout }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#001F3F] z-[9999]">
    <div className="flex flex-col items-center gap-6">
      <div className="w-20 h-20 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin" />
      <button onClick={onLogout} className="mt-4 px-8 py-3 bg-red-600 text-white rounded-full font-bold shadow-lg"> خروج </button>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isAuthenticated, profile, isLoadingAuth, logout } = useAuth();

  if (isLoadingAuth) return <FullScreenLoader onLogout={logout} />;

  if (!isAuthenticated) return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  const isLawyer = profile?.role === 'lawyer' || profile?.role === 'admin';

  return (
    <Routes>
      <Route element={isLawyer ? <LawyerLayout /> : <AppLayout />}>
        <Route path="/" element={<Navigate to={isLawyer ? "/lawyer-dashboard" : "/dashboard"} replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
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