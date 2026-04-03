import { motion } from "framer-motion";
import { ChevronRight, Bell, Mail, Smartphone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    push: true,
    email: true,
    sms: false,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white flex items-center gap-3 border-b" style={{ borderColor: "#E7ECF3" }}>
        <button onClick={() => navigate("/profile")} className="text-2xl" style={{ color: "#123E7C" }}>
          ←
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "#101828" }}>الإشعارات</h1>
      </div>

      <div className="px-5 pt-4 space-y-3">
        {[
          { key: "push", label: "الإشعارات الفورية", desc: "تنبيهات الجلسات والمستندات", icon: Bell },
          { key: "email", label: "البريد الإلكتروني", desc: "رسائل بريدية عن التحديثات", icon: Mail },
          { key: "sms", label: "رسائل نصية", desc: "تنبيهات عاجلة فقط", icon: Smartphone },
        ].map(({ key, label, desc, icon: Icon }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 border flex items-center justify-between"
            style={{ borderColor: "#E7ECF3" }}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" style={{ color: "#123E7C" }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#101828" }}>{label}</p>
                <p className="text-xs" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting(key)}
              className="w-12 h-7 rounded-full transition-all flex items-center"
              style={{ backgroundColor: settings[key] ? "#123E7C" : "#E7ECF3" }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white transition-all"
                style={{ marginLeft: settings[key] ? "2px" : "22px" }}
              />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}