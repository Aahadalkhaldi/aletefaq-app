import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Compat";
import {
  LogOut, Camera, User, Lock, Eye, EyeOff,
  ChevronLeft, Save, Loader2, Shield, Bell, ArrowRight
} from "lucide-react";

export default function LawyerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({ full_name: u?.full_name || "", email: u?.email || "", phone: u?.phone || "" });
      setAvatar(u?.avatar_url || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url });
    setAvatar(file_url);
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: form.full_name, phone: form.phone });
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("app_role");
    base44.auth.logout("/");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).join("").slice(0, 2)
    : "م";

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#123E7C" }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "#F3F7FD" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b flex items-center gap-3" style={{ borderColor: "#EEF2F7" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
          <ArrowRight className="w-4 h-4" style={{ color: "#101828" }} />
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: "#101828" }}>الملف الشخصي</h1>
        <button onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>
          <LogOut className="w-3.5 h-3.5" />
          خروج
        </button>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <div className="relative">
            {avatar ? (
              <img src={avatar} alt="صورة" className="w-20 h-20 rounded-full object-cover border-4" style={{ borderColor: "#EAF2FF" }} />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4"
                style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)", color: "white", borderColor: "#EAF2FF" }}>
                {initials}
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 left-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
              style={{ backgroundColor: "#123E7C" }}>
              {uploadingPhoto ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
            </button>
          </div>
          <p className="mt-3 text-base font-bold" style={{ color: "#101828" }}>{user?.full_name || "المحامي"}</p>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{user?.email}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[["profile", "البيانات الشخصية", User], ["security", "الأمان", Shield]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveSection(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: activeSection === key ? "#123E7C" : "#F2F4F7", color: activeSection === key ? "white" : "#6B7280" }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile Section */}
        {activeSection === "profile" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border p-4 space-y-3" style={{ borderColor: "#E7ECF3" }}>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>الاسم الكامل</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                placeholder="الاسم الكامل" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>البريد الإلكتروني</label>
              <input value={form.email} disabled
                className="w-full border rounded-xl px-3 h-11 text-sm outline-none opacity-60" style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA" }}
                placeholder="البريد الإلكتروني" />
              <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>لا يمكن تغيير البريد الإلكتروني</p>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>رقم الجوال</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                placeholder="+974 XXXX XXXX" dir="ltr" />
            </div>
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
              className="w-full h-12 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "#123E7C" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </motion.button>
          </motion.div>
        )}

        {/* Security Section */}
        {activeSection === "security" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-3">
            <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
              <p className="text-sm font-bold mb-3" style={{ color: "#101828" }}>تغيير كلمة المرور</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                لتغيير كلمة المرور، ستُرسل رسالة إلى بريدك الإلكتروني لإعادة تعيينها بأمان.
              </p>
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "#D4E4F7", color: "#123E7C" }}>
                إرسال رابط تغيير كلمة المرور
              </button>
            </div>

            <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
              <p className="text-sm font-bold mb-1" style={{ color: "#101828" }}>Face ID / البصمة</p>
              <p className="text-xs mb-3" style={{ color: "#6B7280" }}>تفعيل تسجيل الدخول البيومتري (متاح على التطبيق)</p>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#101828" }}>تفعيل Face ID</span>
                <div className="w-12 h-6 rounded-full flex items-center px-1" style={{ backgroundColor: "#123E7C" }}>
                  <div className="w-4 h-4 rounded-full bg-white mr-auto" />
                </div>
              </div>
            </div>

            {/* Switch Role */}
            <motion.button whileTap={{ scale: 0.98 }}
              onClick={() => { localStorage.removeItem("app_role"); navigate("/"); }}
              className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
              تغيير الدور (محامي / عميل)
            </motion.button>

            {/* Logout */}
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleLogout}
              className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </motion.button>
          </motion.div>
        )}

        <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
          الاتفاق للمحاماة والاستشارات القانونية • v2.0
        </p>
      </div>
    </div>
  );
}