import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Compat";
import { Notification } from '@/api/entities';
import { Bell, Sliders, Trash2, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const DEEP = "#0D2F5F";
const BG = "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    caseUpdates: true,
    newInvoices: true,
    hearingReminders: true,
    documentRequests: true,
    systemAlerts: true,
    email: true,
    push: true,
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    const unsub = Notification.subscribe((event) => {
      if (event.type === "create") {
        loadNotifications();
      }
    });
    return unsub;
  }, []);

  const loadData = async () => {
    try {
      const [notifs, user] = await Promise.all([
        Notification.list("-created_date", 50).catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      setNotifications(notifs);

      if (user?.notification_settings) {
        setSettings({ ...settings, ...user.notification_settings });
      }
    } catch (error) {
      console.error("خطأ:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    const notifs = await Notification.list("-created_date", 50).catch(() => []);
    setNotifications(notifs);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ notification_settings: settings });
      await loadData();
    } catch (error) {
      console.error("خطأ:", error);
      alert("فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
      setShowSettings(false);
    }
  };

  const markAsRead = async (id) => {
    await Notification.update(id, { is_read: true }).catch(() => {});
    await loadNotifications();
  };

  const deleteNotification = async (id) => {
    await Notification.delete(id).catch(() => {});
    await loadNotifications();
  };

  const getIcon = (type) => {
    const icons = {
      hearing_reminder: Clock,
      case_update: AlertCircle,
      invoice_due: Bell,
      document_required: Sliders,
      system: Bell,
    };
    return icons[type] || Bell;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY }} />
          <p className="text-sm" style={{ color: TEXT_SEC }}>جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b flex items-center justify-between" style={{ borderColor: "#EEF2F7" }}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#F3F7FD" }}
        >
          <Sliders className="w-5 h-5" style={{ color: PRIMARY }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>الإشعارات</h1>
          {unreadCount > 0 && <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>{unreadCount} جديد</p>}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 pt-4 pb-4 bg-white border-b"
            style={{ borderColor: "#EEF2F7" }}
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: TEXT }}>إعدادات الإشعارات</h3>
            <div className="space-y-3">
              {[
                { key: "caseUpdates", label: "تحديثات القضايا" },
                { key: "newInvoices", label: "فواتير جديدة" },
                { key: "hearingReminders", label: "تذكيرات الجلسات" },
                { key: "documentRequests", label: "طلبات المستندات" },
                { key: "email", label: "إشعارات البريد" },
                { key: "push", label: "إشعارات الدفع" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm" style={{ color: TEXT }}>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "#F3F7FD", color: PRIMARY }}
              >
                إلغاء
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: PRIMARY }}
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      <div className="px-5 pt-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm" style={{ color: TEXT_SEC }}>لا توجد إشعارات</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = getIcon(notif.type);
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl p-4 border"
                style={{
                  borderColor: notif.is_read ? "#E7ECF3" : PRIMARY,
                  backgroundColor: notif.is_read ? "white" : "#F3F7FD",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
                    <Icon className="w-5 h-5" style={{ color: PRIMARY }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: TEXT }}>{notif.title}</p>
                    <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>{notif.body}</p>
                    <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>
                      {new Date(notif.created_date).toLocaleString("ar-SA")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!notif.is_read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "#EAF2FF" }}
                      >
                        <CheckCircle className="w-4 h-4" style={{ color: PRIMARY }} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#FEE2E2" }}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "#DC2626" }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}