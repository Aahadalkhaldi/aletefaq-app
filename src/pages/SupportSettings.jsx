import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SupportSettings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white flex items-center gap-3 border-b" style={{ borderColor: "#E7ECF3" }}>
        <button onClick={() => navigate("/profile")} className="text-2xl" style={{ color: "#123E7C" }}>
          ←
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "#101828" }}>الدعم</h1>
      </div>

      <div className="px-5 pt-4 space-y-3">
        {[
          { label: "دردشة مع الدعم", desc: "تواصل فوري مع فريق الدعم", icon: MessageCircle, action: () => navigate("/messages") },
          { label: "البريد الإلكتروني", desc: "info@aletefaq.com", icon: Mail, action: () => {} },
          { label: "الهاتف", desc: "+974 XXXX XXXX", icon: Phone, action: () => {} },
        ].map(({ label, desc, icon: Icon, action }, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={action}
            className="w-full bg-white rounded-2xl p-4 border text-right flex items-center gap-3"
            style={{ borderColor: "#E7ECF3" }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" style={{ color: "#123E7C" }} />
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "#101828" }}>{label}</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>{desc}</p>
            </div>
            <span className="text-sm" style={{ color: "#123E7C" }}>→</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}