import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Phone, Building2, FileText, Camera, ArrowRight, AlertCircle, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "+974", password: "", confirmPassword: "",
    accountType: "personal", companyName: "", commercialRegister: "",
    agreeTerms: false,
  });
  const [idPhoto, setIdPhoto] = useState(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");

  // Request location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("المتصفح لا يدعم تحديد الموقع");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      (err) => {
        console.error('Location error:', err);
        setLocationError("يجب السماح بتحديد الموقع للتسجيل");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  const role = localStorage.getItem("app_role") || "client";

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handlePhotoSelect = (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { setError("حجم الصورة كبير — الحد الأقصى 10 ميجابايت"); return; }
      setIdPhoto(file);
      // Use FileReader instead of URL.createObjectURL for better Capacitor compatibility
      const reader = new FileReader();
      reader.onload = (ev) => setIdPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Photo select error:', err);
      setError("حدث خطأ في اختيار الصورة — حاول مرة أخرى");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) { setError("الرجاء إدخال الاسم الكامل"); return; }
    if (!form.email.trim()) { setError("الرجاء إدخال البريد الإلكتروني"); return; }
    if (!form.phone || form.phone.length < 8) { setError("الرجاء إدخال رقم الجوال"); return; }
    if (form.password.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (form.password !== form.confirmPassword) { setError("كلمة المرور غير متطابقة"); return; }
    if (form.accountType === "company" && !form.companyName.trim()) { setError("الرجاء إدخال اسم الشركة"); return; }
    if (!idPhoto) { setError("الرجاء رفع صورة الإثبات الشخصي"); return; }
    if (!location) { setError("يجب السماح بتحديد الموقع للتسجيل"); return; }
    if (!form.agreeTerms) { setError("الرجاء الموافقة على الشروط والأحكام"); return; }

    setIsLoading(true);
    try {
      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("فشل إنشاء الحساب");

      // Ensure session is active (auto-confirm should give us a session)
      if (!authData.session) {
        // Try signing in if signUp didn't return a session
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (signInErr) throw new Error("تم إنشاء الحساب لكن فشل تسجيل الدخول التلقائي");
      }

      // 2. Upload ID photo
      let photoUrl = null;
      try {
        const fileExt = idPhoto.name?.split(".").pop() || "jpg";
        const filePath = `${userId}/id.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("id-photos")
          .upload(filePath, idPhoto, { upsert: true });
        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Don't block registration if photo upload fails
          photoUrl = null;
        } else {
          const { data: urlData } = supabase.storage.from("id-photos").getPublicUrl(filePath);
          photoUrl = urlData?.publicUrl || filePath;
        }
      } catch (uploadErr) {
        console.error("Photo upload failed:", uploadErr);
        photoUrl = null;
      }

      // 3. Insert profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        account_type: form.accountType,
        company_name: form.accountType === "company" ? form.companyName.trim() : null,
        commercial_register: form.accountType === "company" ? form.commercialRegister.trim() : null,
        role: role,
        id_photo_url: photoUrl,
        status: "pending",
        registration_lat: location.lat,
        registration_lng: location.lng,
      });
      if (profileError) throw profileError;

      navigate("/pending", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message?.includes("already registered")) {
        setError("البريد الإلكتروني مسجل مسبقاً — جرب تسجيل الدخول");
      } else if (err.message?.includes("valid email")) {
        setError("البريد الإلكتروني غير صحيح");
      } else {
        setError(err.message || "حدث خطأ — حاول مرة أخرى");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  };

  return (
    <div className="min-h-screen px-6 py-12 overflow-y-auto" dir="rtl"
      style={{ background: "linear-gradient(160deg, #0D2F5F 0%, #123E7C 40%, #1E4E95 70%, #2A5FA8 100%)" }}>

      {/* Back */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => navigate("/login")}
        className="absolute top-14 right-6 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        <ArrowRight className="w-5 h-5 text-white" />
      </motion.button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 mb-6 mt-8">
        <img src="https://media.base44.com/images/public/69c61dda06ecec47f8753dd9/38e3c9f1b_WhatsAppImage2026-03-31at90804AM.png"
          alt="الاتفاق" className="w-16 h-16 object-contain" style={{ borderRadius: "14px" }} />
        <p className="text-lg font-bold text-white" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
          إنشاء حساب جديد
        </p>
        <p className="text-xs" style={{ color: "#C8A96B" }}>
          {role === "lawyer" ? "حساب محامي" : "حساب عميل"}
        </p>
      </motion.div>

      {/* Form */}
      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm mx-auto rounded-3xl p-5 border space-y-3"
        style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>

        {/* Full Name */}
        <div className="relative">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><User className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} /></div>
          <input type="text" placeholder="الاسم الكامل" value={form.fullName}
            onChange={(e) => updateForm("fullName", e.target.value)}
            className="w-full rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/40 outline-none" style={inputStyle} />
        </div>

        {/* Email */}
        <div className="relative">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><Mail className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} /></div>
          <input type="email" placeholder="البريد الإلكتروني" value={form.email}
            onChange={(e) => updateForm("email", e.target.value)} autoComplete="email"
            className="w-full rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/40 outline-none" style={inputStyle} />
        </div>

        {/* Phone */}
        <div className="relative">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><Phone className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} /></div>
          <input type="tel" placeholder="رقم الجوال" value={form.phone}
            onChange={(e) => updateForm("phone", e.target.value)}
            className="w-full rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/40 outline-none" style={inputStyle} />
        </div>

        {/* Password */}
        <div className="relative">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><Lock className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} /></div>
          <input type={showPassword ? "text" : "password"} placeholder="كلمة المرور" value={form.password}
            onChange={(e) => updateForm("password", e.target.value)} autoComplete="new-password"
            className="w-full rounded-xl py-2.5 pr-10 pl-10 text-sm text-white placeholder:text-white/40 outline-none" style={inputStyle} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
            {showPassword ? <EyeOff className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} /> : <Eye className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><Lock className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} /></div>
          <input type={showPassword ? "text" : "password"} placeholder="تأكيد كلمة المرور" value={form.confirmPassword}
            onChange={(e) => updateForm("confirmPassword", e.target.value)} autoComplete="new-password"
            className="w-full rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/40 outline-none" style={inputStyle} />
        </div>

        {/* Account Type */}
        <div>
          <p className="text-xs text-white/60 mb-2" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>نوع الحساب</p>
          <div className="flex gap-2">
            {[{ key: "personal", label: "شخصي", icon: User }, { key: "company", label: "شركة", icon: Building2 }].map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => updateForm("accountType", key)}
                className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-semibold border transition-all"
                style={{
                  backgroundColor: form.accountType === key ? "rgba(200,169,107,0.3)" : "rgba(255,255,255,0.05)",
                  borderColor: form.accountType === key ? "#C8A96B" : "rgba(255,255,255,0.15)",
                  color: form.accountType === key ? "#C8A96B" : "rgba(255,255,255,0.6)",
                  fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Company fields */}
        {form.accountType === "company" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><Building2 className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} /></div>
              <input type="text" placeholder="اسم الشركة" value={form.companyName}
                onChange={(e) => updateForm("companyName", e.target.value)}
                className="w-full rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/40 outline-none" style={inputStyle} />
            </div>
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><FileText className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} /></div>
              <input type="text" placeholder="رقم السجل التجاري" value={form.commercialRegister}
                onChange={(e) => updateForm("commercialRegister", e.target.value)}
                className="w-full rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/40 outline-none" style={inputStyle} />
            </div>
          </motion.div>
        )}

        {/* ID Photo Upload */}
        <div>
          <p className="text-xs text-white/60 mb-2" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>صورة الإثبات الشخصي</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          {idPhotoPreview ? (
            <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "#C8A96B" }}>
              <img src={idPhotoPreview} alt="ID" className="w-full h-32 object-cover" />
              <button type="button" onClick={() => { setIdPhoto(null); setIdPhotoPreview(null); }}
                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">✕</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl py-6 border-2 border-dashed flex flex-col items-center gap-2"
              style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.05)" }}>
              <Camera className="w-6 h-6" style={{ color: "rgba(255,255,255,0.4)" }} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                اضغط لرفع صورة الهوية أو جواز السفر
              </p>
            </button>
          )}
        </div>

        {/* Terms */}
        {/* Location Status */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: location ? "rgba(34,197,94,0.15)" : locationError ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${location ? "rgba(34,197,94,0.3)" : locationError ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}` }}>
          {locationLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" style={{ color: "#C8A96B" }} /><span className="text-xs" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>جاري تحديد الموقع...</span></>
          ) : location ? (
            <><MapPin className="w-4 h-4" style={{ color: "#22c55e" }} /><span className="text-xs" style={{ color: "#22c55e", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>تم تحديد الموقع بنجاح</span></>
          ) : (
            <><AlertCircle className="w-4 h-4" style={{ color: "#ef4444" }} /><span className="text-xs" style={{ color: "#ef4444", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{locationError || "يجب السماح بتحديد الموقع"}</span>
              <button type="button" onClick={() => { setLocationLoading(true); setLocationError(''); navigator.geolocation.getCurrentPosition((p) => { setLocation({lat:p.coords.latitude,lng:p.coords.longitude}); setLocationLoading(false); }, () => { setLocationError("فشل تحديد الموقع"); setLocationLoading(false); }, {enableHighAccuracy:true,timeout:15000}); }}
                className="text-xs underline mr-auto" style={{ color: "#C8A96B" }}>إعادة المحاولة</button></>
          )}
        </div>


        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={form.agreeTerms} onChange={(e) => updateForm("agreeTerms", e.target.checked)}
            className="mt-1 w-4 h-4 rounded accent-amber-500" />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            أوافق على{" "}
            <a href="/terms-of-service" className="underline" style={{ color: "#C8A96B" }}>الشروط والأحكام</a>
            {" "}و{" "}
            <a href="/privacy-policy" className="underline" style={{ color: "#C8A96B" }}>سياسة الخصوصية</a>
          </span>
        </label>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
            <p className="text-xs text-red-200" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{error}</p>
          </motion.div>
        )}

        {/* Submit */}
        <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={isLoading}
          className="w-full rounded-xl py-3 text-sm font-bold text-white"
          style={{
            background: isLoading ? "rgba(200,169,107,0.5)" : "linear-gradient(135deg, #C8A96B 0%, #A8893B 100%)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          }}>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جارٍ التسجيل...</span>
            </div>
          ) : "إنشاء حساب"}
        </motion.button>

        {/* Login link */}
        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
          عندك حساب؟{" "}
          <button type="button" onClick={() => navigate("/login")} className="underline" style={{ color: "#C8A96B" }}>
            تسجيل الدخول
          </button>
        </p>
      </motion.form>
    </div>
  );
}
