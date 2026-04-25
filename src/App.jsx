import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext.jsx";
import { LanguageProvider } from "./lib/LanguageContext.jsx";

// Import Pages with Exact Paths
import Splash from "./pages/Splash.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LawyerDashboard from "./pages/LawyerDashboard.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import LawyerLayout from "./components/layout/LawyerLayout.jsx";

// simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-red-900 text-white p-10 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-4">حدث خطأ في النظام</h1>
            <p className="text-sm opacity-80">{this.state.error?.toString()}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 px-6 py-2 bg-white text-red-900 rounded-lg"
            >
              إعادة تحميل
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <Route path="*" element={<Login />} />
    </Routes>
  );

  const role = profile?.role || 'client';
  const isLawyer = role === 'lawyer' || role === 'admin';

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
export default App;