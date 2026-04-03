import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, User, ChevronLeft, Download } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

// Detect Capacitor environment
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
const APP_ID = import.meta.env.VITE_BASE44_APP_ID || 'f8753dd9';
const APP_BASE_URL = import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://aletefaq-f8753dd9.base44.app';

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [selected, setSelected] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  useEffect(() => {
    // Check if user has a token (authenticated)
    const hasToken = !!localStorage.getItem("base44_access_token");
    const savedRole = localStorage.getItem("app_role");

    if (hasToken && isAuthenticated && savedRole) {
      // Already authenticated with a role - go to dashboard
      if (savedRole === "lawyer") navigate("/lawyer-dashboard", { replace: true });
      else if (savedRole === "client") navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated]);

  const handleEnter = (role) => {
    setSelected(role);
    localStorage.setItem("app_role", role);

    const hasToken = !!localStorage.getItem("base44_access_token");

    if (hasToken && isAuthenticated) {
      // Already authenticated - navigate directly
      setTimeout(() => {
        if (role === "lawyer") navigate("/lawyer-dashboard");
        else navigate("/dashboard");
      }, 400);
    } else {
      // Not authenticated - redirect to Base44 login
      // The from_url tells Base44 where to redirect after login
      const redirectUrl = `${APP_BASE_URL}/splash`;
      const loginUrl = `https://base44.app/login?from_url=${encodeURIComponent(redirectUrl)}&app_id=${APP_ID}`;
      
      setTimeout(() => {
        window.location.href = loginUrl;
      }, 400);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between py-16 px-6"
      dir="rtl"
      style={{ background: "linear-gradient(160deg, #0D2F5F 0%, #123E7C 40%, #1E4E95 70%, #2A5FA8 100%)" }}
    >
      {/* Top spacer */}
      <div />

      {/* Logo + Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-5 w-full"
      >
        {/* Logo - Glass Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-col items-center gap-4"
        >
          <img
            src="https://media.base44.com/images/public/69c61dda06ecec47f8753dd9/38e3c9f1b_WhatsAppImage2026-03-31at90804AM.png"
            alt="الاتفاق"
            className="w-28 h-28 object-contain"
            style={{ borderRadius: "22px" }}
          />

          {/* Firm name */}
          <div className="text-center">
            <p className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
              الاتفاق
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#C8A96B", letterSpacing: "0.08em" }}>
              ALETEFAQ LAW FIRM
            </p>
          </div>
        </motion.div>

        {/* Role Selection Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full mt-4 space-y-3"
        >
          <p className="text-center text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            كيف تريد الدخول؟
          </p>

          {/* Lawyer Card */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            animate={selected === "lawyer" ? { scale: 0.97, opacity: 0.7 } : {}}
            onClick={() => handleEnter("lawyer")}
            className="w-full rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden border"
            style={{
              background: "linear-gradient(135deg, #C8A96B 0%, #A8893B 100%)",
              borderColor: "rgba(255,255,255,0.15)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)" }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-right relative z-10">
              <p className="text-base font-bold text-white">دخول المحامي</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                إدارة القضايا • الفواتير • لوحة التحكم
              </p>
            </div>
            <ChevronLeft className="w-5 h-5 text-white opacity-70 flex-shrink-0 relative z-10" />
          </motion.button>

          {/* Client Card */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            animate={selected === "client" ? { scale: 0.97, opacity: 0.7 } : {}}
            onClick={() => handleEnter("client")}
            className="w-full rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden border"
            style={{
              background: "rgba(255,255,255,0.1)",
              borderColor: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)" }} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-right relative z-10">
              <p className="text-base font-bold text-white">دخول العميل</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                متابعة قضاياك • المستندات • الفواتير
              </p>
            </div>
            <ChevronLeft className="w-5 h-5 text-white opacity-70 flex-shrink-0 relative z-10" />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#C8A96B" }}
            />
          ))}
        </div>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          آمنة • دقيقة • سرية
        </p>

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
          <a href="/privacy-policy" className="underline" style={{ color: "rgba(200,169,107,0.8)" }}>
            سياسة الخصوصية
          </a>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
          <a href="/terms-of-service" className="underline" style={{ color: "rgba(200,169,107,0.8)" }}>
            شروط الخدمة
          </a>
        </div>

        {/* Install Button */}
        {showInstall && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleInstall}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold"
            style={{ borderColor: "rgba(200,169,107,0.5)", color: "#C8A96B", backgroundColor: "rgba(200,169,107,0.1)" }}
          >
            <Download className="w-4 h-4" />
            أضف للشاشة الرئيسية
          </motion.button>
        )}

        {/* iOS hint */}
        {!showInstall && /iphone|ipad|ipod/i.test(navigator.userAgent) && (
          <p className="mt-3 text-xs text-center px-4" style={{ color: "rgba(200,169,107,0.7)" }}>
            iOS: اضغط <strong>Share</strong> ثم <strong>Add to Home Screen</strong>
          </p>
        )}
      </motion.div>
    </div>
  );
}