import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Fingerprint, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function SecuritySettings() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

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
      <div className="px-5 pt-14 pb-4 bg-white flex items-center gap-3 border-b" style={{ borderColor: "#E7ECF3" }}>
        <button onClick={() => navigate("/profile")} className="text-2xl" style={{ color: "#123E7C" }}>
          ←
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "#101828" }}>الأمان</h1>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 border"
          style={{ borderColor: "#E7ECF3" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5" style={{ color: "#123E7C" }} />
            <p className="text-sm font-bold" style={{ color: "#101828" }}>تغيير كلمة المرور</p>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="كلمة المرور الحالية"
            className="w-full h-11 border rounded-xl px-3 mb-3 text-sm outline-none"
            style={{ borderColor: "#E7ECF3", color: "#101828", direction: "rtl" }}
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="كلمة المرور الجديدة"
            className="w-full h-11 border rounded-xl px-3 mb-3 text-sm outline-none"
            style={{ borderColor: "#E7ECF3", color: "#101828", direction: "rtl" }}
          />
          <button
            className="w-full h-11 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#123E7C" }}
          >
            حفظ كلمة المرور الجديدة
          </button>
        </motion.div>

        {/* Biometric */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 border flex items-center justify-between"
          style={{ borderColor: "#E7ECF3" }}
        >
          <div className="flex items-center gap-3">
            <Fingerprint className="w-5 h-5" style={{ color: "#123E7C" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#101828" }}>البصمة البيومترية</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>تفعيل البصمة للدخول</p>
            </div>
          </div>
          <button
            className="w-12 h-7 rounded-full transition-all flex items-center"
            style={{ backgroundColor: "#E7ECF3" }}
          >
            <div className="w-5 h-5 rounded-full bg-white" style={{ marginLeft: "22px" }} />
          </button>
        </motion.div>

        {/* Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 border"
          style={{ borderColor: "#FECACA" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-5 h-5" style={{ color: "#B42318" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#B42318" }}>حذف الحساب</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>سيتم حذف جميع بياناتك بشكل دائم</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full h-10 rounded-xl text-sm font-semibold border"
            style={{ borderColor: "#FECACA", color: "#B42318", backgroundColor: "#FEF2F2" }}
          >
            حذف حسابي
          </button>
        </motion.div>
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