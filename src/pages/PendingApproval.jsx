import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";

export default function PendingApproval() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" dir="rtl"
      style={{ background: "linear-gradient(160deg, #0D2F5F 0%, #123E7C 40%, #1E4E95 70%, #2A5FA8 100%)" }}>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 text-center">

        <img src="https://media.base44.com/images/public/69c61dda06ecec47f8753dd9/38e3c9f1b_WhatsAppImage2026-03-31at90804AM.png"
          alt="الاتفاق" className="w-20 h-20 object-contain" style={{ borderRadius: "18px" }} />

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(200,169,107,0.2)", border: "2px solid #C8A96B" }}>
          <Clock className="w-8 h-8" style={{ color: "#C8A96B" }} />
        </motion.div>

        <div>
          <p className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            تم التسجيل بنجاح!
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            حسابك قيد المراجعة
          </p>
          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            سيتم إشعارك عند الموافقة على حسابك
          </p>
        </div>

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => { navigate("/login", { replace: true }); }}
          className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border"
          style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
          <ArrowRight className="w-4 h-4" />
          العودة لتسجيل الدخول
        </motion.button>
      </motion.div>
    </div>
  );
}
