import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const role = localStorage.getItem("app_role") || "client";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("status, role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        setError("لم يتم العثور على ملفك الشخصي — تواصل مع الإدارة");
        await supabase.auth.signOut();
        return;
      }

      if (profile.status === "pending") {
        localStorage.setItem("app_role", profile.role || role);
        navigate("/pending", { replace: true });
        return;
      }

      if (profile.status === "rejected") {
        setError("تم رفض حسابك — تواصل مع الإدارة للمزيد");
        await supabase.auth.signOut();
        localStorage.removeItem("app_role");
        return;
      }

      const resolvedRole = profile.role || role;
      localStorage.setItem("app_role", resolvedRole);

      if (resolvedRole === "lawyer") {
        navigate("/lawyer-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.message?.includes("Invalid login")) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("الرجاء تأكيد بريدك الإلكتروني أولاً");
      } else {
        setError(err.message || "حدث خطأ — حاول مرة أخرى");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" dir="rtl"
      style={{ background: "linear-gradient(160deg, #0D2F5F 0%, #123E7C 40%, #1E4E95 70%, #2A5FA8 100%)" }}>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => { localStorage.removeItem("app_role"); navigate("/splash"); }}
        className="absolute top-14 right-6 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        <ArrowRight className="w-5 h-5 text-white" />
      </motion.button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-3 mb-8">
        <img src="https://media.base44.com/images/public/69c61dda06ecec47f8753dd9/38e3c9f1b_WhatsAppImage2026-03-31at90804AM.png"
          alt="الاتفاق" className="w-20 h-20 object-contain" style={{ borderRadius: "18px" }} />
        <div className="text-center">
          <p className="text-xl font-bold text-white" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>الاتفاق</p>
          <p className="text-xs mt-0.5" style={{ color: "#C8A96B" }}>
            {role === "lawyer" ? "بوابة المحامي" : "بوابة العميل"}
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="w-full max-w-sm rounded-3xl p-6 border"
        style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>

        <h2 className="text-lg font-bold text-white text-center mb-6" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
          تسجيل الدخول
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><Mail className="w-5 h-5" style={{ color: "rgba(255,255,255,0.5)" }} /></div>
            <input type="email" placeholder="البريد الإلكتروني" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              className="w-full rounded-xl py-3 pr-11 pl-4 text-sm text-white placeholder:text-white/40 outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }} />
          </div>

          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><Lock className="w-5 h-5" style={{ color: "rgba(255,255,255,0.5)" }} /></div>
            <input type={showPassword ? "text" : "password"} placeholder="كلمة المرور" value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              className="w-full rounded-xl py-3 pr-11 pl-11 text-sm text-white placeholder:text-white/40 outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              {showPassword ? <EyeOff className="w-5 h-5" style={{ color: "rgba(255,255,255,0.5)" }} /> : <Eye className="w-5 h-5" style={{ color: "rgba(255,255,255,0.5)" }} />}
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
              <p className="text-xs text-red-200" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{error}</p>
            </motion.div>
          )}

          <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={isLoading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white relative overflow-hidden"
            style={{
              background: isLoading ? "rgba(200,169,107,0.5)" : "linear-gradient(135deg, #C8A96B 0%, #A8893B 100%)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            }}>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جارٍ الدخول...</span>
              </div>
            ) : "دخول"}
          </motion.button>
        </form>

        <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
          ما عندك حساب؟{" "}
          <button onClick={() => navigate("/register")} className="underline" style={{ color: "#C8A96B" }}>
            إنشاء حساب جديد
          </button>
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>آمنة • دقيقة • سرية</p>
        <div className="flex items-center justify-center gap-3 text-xs mt-2 flex-wrap">
          <a href="/privacy-policy" className="underline" style={{ color: "rgba(200,169,107,0.8)" }}>سياسة الخصوصية</a>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
          <a href="/terms-of-service" className="underline" style={{ color: "rgba(200,169,107,0.8)" }}>شروط الخدمة</a>
        </div>
      </motion.div>
    </div>
  );
}
**تم Login.jsx**
