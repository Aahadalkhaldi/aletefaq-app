import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Bell, Shield, Globe, Smartphone, HelpCircle, LogOut,
  ChevronLeft, Star, Trash2, AlertTriangle
} from "lucide-react";
import GlassIcon from "../components/ui/GlassIcon";
import { useLanguage } from "../lib/LanguageContext";
import { base44 } from "@/api/base44Compat";

const settingsItems = [
  { key: "notifications", label: "الإشعارات", icon: Bell, desc: "إدارة التنبيهات", path: "/notification-settings" },
  { key: "security", label: "الأمان", icon: Shield, desc: "كلمة المرور والبصمة", path: "/security-settings" },
  { key: "language", label: "اللغة", icon: Globe, desc: "العربية / English", isLanguage: true },
  { key: "devices", label: "الأجهزة", icon: Smartphone, desc: "الأجهزة المتصلة", comingSoon: true },
  { key: "support", label: "الدعم", icon: HelpCircle, desc: "تواصل مع المكتب", path: "/support-settings" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("app_role");
    base44?.auth?.logout("/");
  };

  const handleSwitchRole = () => {
    localStorage.removeItem("app_role");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "احذف حسابي") return;
    setDeleting(true);
    try {
      await base44.auth.logout("/");
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white">
        <h1 className="text-2xl font-bold" style={{ color: "#101828" }}>الملف الشخصي</h1>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Client Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-card border"
          style={{ borderColor: "#E7ECF3" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "linear-gradient(135deg, #123E7C 0%, #0D2F5F 100%)", color: "white" }}
            >
              ف
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: "#101828" }}>فهد الخالدي</h2>
              <p className="text-sm" style={{ color: "#6B7280" }}>info@aletefaq.com</p>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>+966 5X XXX XXXX</p>
            </div>
          </div>

          {/* VIP Badge */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#FFF4E5" }}>
            <Star className="w-4 h-4" style={{ color: "#C8A96B" }} />
            <p className="text-sm font-bold" style={{ color: "#8A5A00" }}>عميل VIP</p>
            <p className="text-xs mr-auto" style={{ color: "#8A5A00" }}>أولوية الخدمة</p>
          </div>
        </motion.div>

        {/* Settings List */}
        <div className="bg-white rounded-2xl shadow-card border overflow-hidden" style={{ borderColor: "#E7ECF3" }}>
          {settingsItems.map((item, i) => {
            const Icon = item.icon;
            const handleClick = () => {
              if (item.isLanguage) {
                toggleLanguage();
              } else if (item.path) {
                navigate(item.path);
              }
            };
            return (
              <motion.button
                key={item.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={handleClick}
                disabled={item.comingSoon}
                className="w-full flex items-center gap-3 px-4 py-4 border-b last:border-0 hover:bg-gray-50 transition-colors text-right disabled:opacity-50"
                style={{ borderColor: "#EEF2F7" }}
              >
                <GlassIcon icon={Icon} index={i} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#101828" }}>
                    {item.label}
                    {item.comingSoon && " (قريباً)"}
                  </p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{item.desc}</p>
                </div>
                <ChevronLeft className="w-4 h-4" style={{ color: "#6B7280" }} />
              </motion.button>
            );
          })}
        </div>

        {/* Language Toggle */}
        <div className="bg-white rounded-2xl p-4 shadow-card border" style={{ borderColor: "#E7ECF3" }}>
          <p className="text-sm font-bold mb-3" style={{ color: "#101828" }}>اللغة</p>
          <div className="flex gap-2">
            {[
              { code: "ar", label: "العربية" },
              { code: "en", label: "English" }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={toggleLanguage}
                disabled={language === lang.code}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:cursor-default"
                style={{
                  backgroundColor: language === lang.code ? "#123E7C" : "#F7F8FA",
                  color: language === lang.code ? "white" : "#6B7280",
                  border: `1px solid ${language === lang.code ? "#123E7C" : "#E7ECF3"}`,
                  opacity: language === lang.code ? 1 : 0.7,
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Switch Role */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSwitchRole}
          className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border"
          style={{ borderColor: "#EAF2FF", backgroundColor: "#EAF2FF", color: "#123E7C" }}
        >
          تغيير الدور (محامي / عميل)
        </motion.button>

        {/* Logout */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border"
          style={{ borderColor: "#FDECEC", backgroundColor: "#FDECEC", color: "#B42318" }}
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </motion.button>

        {/* Delete Account */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDeleteDialog(true)}
          className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border"
          style={{ borderColor: "#E7ECF3", color: "#9CA3AF", backgroundColor: "white" }}
        >
          <Trash2 className="w-4 h-4" />
          حذف الحساب
        </motion.button>

        <p className="text-xs text-center" style={{ color: "#6B7280" }}>
          الاتفاق للمحاماة والاستشارات القانونية • النسخة 2.0
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-5 z-50 bg-white rounded-2xl p-5 shadow-xl"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            >
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
                  <AlertTriangle className="w-7 h-7" style={{ color: "#B42318" }} />
                </div>
                <h3 className="text-lg font-bold text-center" style={{ color: "#101828" }}>تأكيد حذف الحساب</h3>
                <p className="text-sm text-center" style={{ color: "#6B7280" }}>
                  هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً.
                </p>
              </div>
              <p className="text-xs font-semibold mb-2 text-center" style={{ color: "#6B7280" }}>
                اكتب <strong style={{ color: "#B42318" }}>احذف حسابي</strong> للتأكيد
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="احذف حسابي"
                className="w-full h-11 border rounded-xl px-3 text-sm outline-none mb-4 text-center"
                style={{ borderColor: "#FECACA", direction: "rtl" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(""); }}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: "#E7ECF3", color: "#6B7280" }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== "احذف حسابي" || deleting}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ backgroundColor: "#B42318" }}
                >
                  {deleting ? "جارٍ الحذف..." : "حذف الحساب"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}