import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Compat";
import { Bell, Calendar, CreditCard, FileText, MessageSquare, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import GlassIcon from "../components/ui/GlassIcon";

const typeConfig = {
  hearing_reminder: { icon: Calendar, color: "#EAF2FF", iconColor: "#123E7C" },
  invoice_due: { icon: CreditCard, color: "#FDECEC", iconColor: "#B42318" },
  document_required: { icon: AlertTriangle, color: "#FFF4E5", iconColor: "#8A5A00" },
  new_message: { icon: MessageSquare, color: "#EAF2FF", iconColor: "#123E7C" },
  case_update: { icon: FileText, color: "#EEF2F7", iconColor: "#526071" },
  service_request_update: { icon: CheckCircle, color: "#F0FFF4", iconColor: "#1A6E3A" },
  system: { icon: Bell, color: "#EEF2F7", iconColor: "#526071" },
};

const demoNotifications = [
  { id: "n1", type: "hearing_reminder", title: "تذكير بجلسة", body: "استشارة قانونية مع د. أحمد زايد — غداً الساعة 10:00 ص", is_read: false, created_date: "2026-03-27T08:00:00" },
  { id: "n2", type: "invoice_due", title: "فاتورة مستحقة", body: "الفاتورة رقم 2041 • 5,000 ر.ق — موعد الاستحقاق: 30 مارس 2026", is_read: false, created_date: "2026-03-26T10:00:00" },
  { id: "n3", type: "document_required", title: "مستند مطلوب", body: "يرجى رفع التفويض الموقع قبل 30 مارس 2026", is_read: false, created_date: "2026-03-25T09:00:00" },
  { id: "n4", type: "case_update", title: "تحديث في ملف القضية", body: "تم إضافة مستند جديد في ملف ماتركس تريدنغ", is_read: true, created_date: "2026-03-24T14:00:00" },
  { id: "n5", type: "new_message", title: "رسالة جديدة", body: "د. أحمد زايد: تم إرسال المذكرة، يرجى المراجعة", is_read: true, created_date: "2026-03-23T11:00:00" },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "الآن";
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(demoNotifications);
  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const filtered = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#101828" }}>الإشعارات</h1>
            {unreadCount > 0 && (
              <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{unreadCount} إشعار غير مقروء</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm font-semibold" style={{ color: "#123E7C" }}>
              تحديد الكل مقروء
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {[{ key: "all", label: "الكل" }, { key: "unread", label: "غير مقروء" }].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: filter === f.key ? "#123E7C" : "#F2F4F7",
                color: filter === f.key ? "white" : "#6B7280",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 space-y-2">
        <AnimatePresence>
          {filtered.map((notif, i) => {
            const config = typeConfig[notif.type] || typeConfig.system;
            const Icon = config.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => markRead(notif.id)}
                className="bg-white rounded-2xl p-4 border shadow-card cursor-pointer relative"
                style={{ borderColor: notif.is_read ? "#E7ECF3" : "#D4E4F7" }}
              >
                {!notif.is_read && (
                  <div className="absolute top-4 left-4 w-2 h-2 rounded-full" style={{ backgroundColor: "#123E7C" }} />
                )}
                <div className="flex items-start gap-3">
                  <GlassIcon icon={Icon} index={i} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "#101828" }}>{notif.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6B7280" }}>{notif.body}</p>
                    <p className="text-[11px] mt-1.5" style={{ color: "#9BA3AF" }}>{timeAgo(notif.created_date)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: "#E7ECF3" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد إشعارات</p>
          </div>
        )}
      </div>
    </div>
  );
}