import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAVY = "#001F3F";
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#E8C967";
const GOLD_DIM = "rgba(212,175,55,0.15)";

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-4">
      <div className="h-px w-8" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
      <div className="w-1 h-1 rotate-45" style={{ backgroundColor: GOLD }} />
      <div className="h-px w-8" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Credentials, 2: Security Question
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempUserId, setTempUserId] = useState(null);
  const [question, setQuestion] = useState("ما هو رمز التوثيق المعتمد لمكتب الاتفاق؟");

  const selectedPortal = localStorage.getItem("app_role") || "lawyer";

  const handleNextStep = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Attempt login
      const { data: { user: authUser }, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) throw authError;

      // Check if security question is set for this profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("security_question, security_answer")
        .eq("id", authUser.id)
        .single();

      if (profile?.security_answer) {
        setQuestion(profile.security_question || "ما هو رمز التوثيق المعتمد لمكتب الاتفاق؟");
        setTempUserId(authUser.id);
        setStep(2);
      } else {
        // No security question set, bypass for now as per "Luxe" standards
        // Routing handled by App.jsx auth listener
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.message?.includes("Invalid login")) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        setError(err.message || "حدث خطأ - حاول مرة أخرى");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySecurity = async (e) => {
    e.preventDefault();
    setError("");

    if (!securityAnswer.trim()) {
      setError("الرجاء إدخال إجابة سؤال الأمان");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("security_answer")
        .eq("id", tempUserId)
        .single();

      if (profile?.security_answer?.toLowerCase() === securityAnswer.trim().toLowerCase()) {
        // Verification success - routing handled by App.jsx
      } else {
        setError("إجابة سؤال الأمان غير صحيحة - يرجى التحقق من هويتك");
      }
    } catch (err) {
      setError("فشل التحقق من الهوية");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      dir="rtl"
      style={{ backgroundColor: NAVY }}
    >
      {/* Background radial glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }}
      />

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => navigate("/splash")}
        className="absolute top-12 right-6 w-10 h-10 rounded-full flex items-center justify-center z-20"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", border: `1px solid ${GOLD_DIM}` }}
      >
        <ArrowRight className="w-5 h-5 text-white" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 mb-10 z-10"
      >
        <div className="relative">
          <img
            src="https://media.base44.com/images/public/69c61dda06ecec47f8753dd9/38e3c9f1b_WhatsAppImage2026-03-31at90804AM.png"
            alt="الاتفاق"
            className="w-24 h-24 object-contain rounded-2xl"
            style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }}
          />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center bg-green-500 border-4 border-[#001F3F]">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="text-center mt-2">
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            مكتب الاتفاق للمحاماة
          </h1>
          <GoldDivider />
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: GOLD, opacity: 0.8 }}>
            {selectedPortal === "lawyer" ? "Lawyer Access" : "Client Access"}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 z-10"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(212,175,55,0.15)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                  تسجيل الدخول
                </h2>
                <p className="text-sm text-white/40">يرجى إدخال بيانات الاعتماد الخاصة بك</p>
              </div>

              <form onSubmit={handleNextStep} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] mr-3 font-semibold uppercase tracking-wider text-white/30">البريد الإلكتروني</label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                      <Mail className="w-5 h-5 text-white/20 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@aletefaq.com"
                      className="w-full rounded-2xl py-4 pr-12 pl-4 text-sm text-white bg-white/5 border border-white/10 focus:border-amber-500/50 outline-none transition-all"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] mr-3 font-semibold uppercase tracking-wider text-white/30">كلمة المرور</label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                      <Lock className="w-5 h-5 text-white/20 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl py-4 pr-12 pl-12 text-sm text-white bg-white/5 border border-white/10 focus:border-amber-500/50 outline-none transition-all"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/20 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300 font-medium leading-relaxed">{error}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl py-4 text-sm font-bold text-white relative overflow-hidden mt-2"
                  style={{
                    background: isLoading 
                      ? "rgba(212,175,55,0.4)" 
                      : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
                    color: NAVY,
                    boxShadow: "0 10px 30px rgba(212,175,55,0.25)",
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                      <span>جاري المعالجة...</span>
                    </div>
                  ) : (
                    "متابعة"
                  )}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
                  <HelpCircle className="w-6 h-6 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                  تحقق الهوية الإضافي
                </h2>
                <p className="text-sm text-white/40 leading-relaxed">
                  بناءً على بروتوكول الأمن المعتمد في البرزنتيشن، يرجى الإجابة على سؤال الأمان.
                </p>
              </div>

              <form onSubmit={handleVerifySecurity} className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-bold text-amber-500/90 leading-relaxed pr-2">
                    {question}
                  </p>
                  <input
                    type="text"
                    autoFocus
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="الإجابة هنا..."
                    className="w-full rounded-2xl py-4 px-6 text-sm text-white bg-white/5 border border-white/10 focus:border-amber-500/50 outline-none transition-all"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300 font-medium">{error}</p>
                  </motion.div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-2xl py-4 text-sm font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
                      color: NAVY,
                      boxShadow: "0 10px 30px rgba(212,175,55,0.25)",
                      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}
                  >
                    {isLoading ? "جاري التحقق..." : "تأكيد الهوية والدخول"}
                  </motion.button>
                  
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors py-2"
                  >
                    العودة لبيانات الاعتماد
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-center z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/20">Secure Encryption</p>
          <div className="w-1 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-center gap-6 text-xs mt-2">
          <a href="/privacy-policy" className="text-white/40 hover:text-amber-500 transition-colors">
            سياسة الخصوصية
          </a>
          <a href="/terms-of-service" className="text-white/40 hover:text-amber-500 transition-colors">
            شروط الخدمة
          </a>
        </div>
      </motion.div>
    </div>
  );
}
