import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const savedRole = localStorage.getItem("app_role");

    if (isAuthenticated) {
      if (savedRole === "admin" || savedRole === "lawyer") {
        navigate("/lawyer-dashboard", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
      return;
    }

    localStorage.setItem("app_role", "lawyer");
    navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      dir="rtl"
      style={{ background: "linear-gradient(160deg, #0D2F5F 0%, #123E7C 40%, #1E4E95 70%, #2A5FA8 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-5"
      >
        <img
          src="https://media.base44.com/images/public/69c61dda06ecec47f8753dd9/38e3c9f1b_WhatsAppImage2026-03-31at90804AM.png"
          alt="الاتفاق"
          className="w-24 h-24 object-contain"
          style={{ borderRadius: "22px" }}
        />

        <div className="text-center">
          <p
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            الاتفاق
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: "#C8A96B", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            جارٍ التوجيه إلى تسجيل الدخول
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: "#C8A96B" }} />
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.45)", animationDelay: "0.15s" }} />
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.25)", animationDelay: "0.3s" }} />
        </div>
      </motion.div>
    </div>
  );
}
