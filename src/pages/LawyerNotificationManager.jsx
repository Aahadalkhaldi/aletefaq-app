import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Bell, Settings, Send, Loader2, FileText, AlertCircle, Clock } from "lucide-react";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const DEEP = "#0D2F5F";
const BG = "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)";

export default function LawyerNotificationManager() {
  const [settings, setSettings] = useState({
    autoNotifyOnCaseUpdate: true,
    autoNotifyOnNewInvoice: true,
    autoNotifyOnDocumentUpload: true,
    hearingReminderDays: 1,
    invoiceReminderDays: 3,
    enableBatchNotifications: false,
    batchTime: "09:00",
    upcomingInvoiceMessage: "عزيزي الموكل، تذكير: فاتورة بمبلغ {amount} ر.ق مستحقة خلال {days} أيام. يرجى الاستعداد للسداد. شكراً - فريق الاتفاق القانوني",
    overdueInvoiceMessage: "عزيزي الموكل، لديك فاتورة متأخرة بمبلغ {amount} ر.ق. يرجى السداد في أقرب وقت ممكن. شكراً - فريق الاتفاق القانوني",
  });
  const [runningCheck, setRunningCheck] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.notification_manager_settings) {
        setSettings({ ...settings, ...user.notification_manager_settings });
      }
    } catch (error) {
      console.error("خطأ:", error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ notification_manager_settings: settings });
      setSavedMessage("تم حفظ الإعدادات بنجاح");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (error) {
      console.error("خطأ:", error);
      alert("فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const runInvoiceCheck = async () => {
    setRunningCheck(true);
    setCheckResult(null);
    try {
      const res = await base44.functions.invoke("invoiceDueDateReminder", {});
      setCheckResult({ success: true, sent: res.data?.sent || 0, skipped: res.data?.skipped || 0 });
    } catch (e) {
      setCheckResult({ success: false });
    } finally {
      setRunningCheck(false);
    }
  };

  const sendTestNotification = async () => {
    if (!testMessage.trim()) return;
    setSendingTest(true);
    try {
      await base44.functions.invoke("sendTestNotification", {
        title: "رسالة تجريبية من النظام",
        body: testMessage,
      });
      setTestMessage("");
      alert("تم إرسال الرسالة التجريبية");
    } catch (error) {
      console.error("خطأ:", error);
      alert("فشل إرسال الرسالة");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <h1 className="text-2xl font-bold" style={{ color: TEXT }}>إدارة التنبيهات</h1>
        <p className="text-sm mt-1" style={{ color: TEXT_SEC }}>التحكم في إعدادات التنبيهات التلقائية للموكلين</p>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Automatic Notifications */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E7ECF3" }}>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: TEXT }}>
            <Bell className="w-5 h-5" style={{ color: PRIMARY }} />
            التنبيهات التلقائية
          </h2>

          <div className="space-y-4">
            {[
              {
                key: "autoNotifyOnCaseUpdate",
                label: "إشعار تلقائي عند تحديث القضية",
                desc: "إرسال إشعار فوري للموكل عند تغيير حالة قضيته",
              },
              {
                key: "autoNotifyOnNewInvoice",
                label: "إشعار عند إضافة فاتورة جديدة",
                desc: "إخطار الموكل عند إنشاء فاتورة",
              },
              {
                key: "autoNotifyOnDocumentUpload",
                label: "إشعار عند رفع مستند",
                desc: "تنبيه الموكل عند إضافة مستند لملفه",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-start gap-3 pb-4 border-b last:pb-0 last:border-0" style={{ borderColor: "#E7ECF3" }}>
                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div className="w-12 h-6 rounded-full border-2 flex items-center p-1 transition-all"
                    style={{
                      borderColor: settings[item.key] ? PRIMARY : "#E7ECF3",
                      backgroundColor: settings[item.key] ? "#EAF2FF" : "white",
                    }}>
                    <div className="w-4 h-4 rounded-full transition-all"
                      style={{
                        backgroundColor: settings[item.key] ? PRIMARY : "#D1D5DB",
                        marginLeft: settings[item.key] ? "auto" : 0,
                      }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: TEXT }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{item.desc}</p>
                  </div>
                </label>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                  className="hidden"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Timing Settings */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E7ECF3" }}>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: TEXT }}>
            <Settings className="w-5 h-5" style={{ color: PRIMARY }} />
            إعدادات التوقيت
          </h2>

          <div className="space-y-4">
            {[
              {
                key: "hearingReminderDays",
                label: "تذكير الجلسة قبل (أيام)",
                type: "number",
              },
              {
                key: "invoiceReminderDays",
                label: "تذكير الفاتورة قبل (أيام)",
                type: "number",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between pb-4 border-b last:pb-0 last:border-0" style={{ borderColor: "#E7ECF3" }}>
                <label className="text-sm font-semibold" style={{ color: TEXT }}>{item.label}</label>
                <input
                  type={item.type}
                  value={settings[item.key]}
                  onChange={(e) => setSettings({ ...settings, [item.key]: parseInt(e.target.value) })}
                  className="w-20 px-3 py-2 border rounded-lg text-sm outline-none"
                  style={{ borderColor: "#E7ECF3", color: TEXT }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Batch Notifications */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E7ECF3" }}>
          <div className="flex items-start gap-3 mb-4">
            <label className="flex items-center gap-3 flex-1 cursor-pointer">
              <div className="w-12 h-6 rounded-full border-2 flex items-center p-1 transition-all"
                style={{
                  borderColor: settings.enableBatchNotifications ? PRIMARY : "#E7ECF3",
                  backgroundColor: settings.enableBatchNotifications ? "#EAF2FF" : "white",
                }}>
                <div className="w-4 h-4 rounded-full transition-all"
                  style={{
                    backgroundColor: settings.enableBatchNotifications ? PRIMARY : "#D1D5DB",
                    marginLeft: settings.enableBatchNotifications ? "auto" : 0,
                  }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: TEXT }}>إرسال التنبيهات دفعات</p>
                <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>دمج التنبيهات اليومية وإرسالها في وقت محدد</p>
              </div>
            </label>
            <input
              type="checkbox"
              checked={settings.enableBatchNotifications}
              onChange={(e) => setSettings({ ...settings, enableBatchNotifications: e.target.checked })}
              className="hidden"
            />
          </div>

          {settings.enableBatchNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-3 border-t"
              style={{ borderColor: "#E7ECF3" }}
            >
              <label className="text-sm font-semibold block mb-2" style={{ color: TEXT }}>وقت الإرسال</label>
              <input
                type="time"
                value={settings.batchTime}
                onChange={(e) => setSettings({ ...settings, batchTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: "#E7ECF3", color: TEXT }}
              />
            </motion.div>
          )}
        </div>

        {/* Invoice Reminder Messages */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E7ECF3" }}>
          <h2 className="text-base font-bold mb-1 flex items-center gap-2" style={{ color: TEXT }}>
            <FileText className="w-5 h-5" style={{ color: PRIMARY }} />
            رسائل تذكير الفواتير
          </h2>
          <p className="text-xs mb-4" style={{ color: TEXT_SEC }}>
            استخدم <strong>{"{amount}"}</strong> للمبلغ و <strong>{"{days}"}</strong> للأيام المتبقية
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-1.5 flex items-center gap-1.5" style={{ color: TEXT }}>
                <Clock className="w-4 h-4" style={{ color: "#8A5A00" }} />
                رسالة الاستحقاق القريب
              </label>
              <textarea
                rows={3}
                value={settings.upcomingInvoiceMessage}
                onChange={e => setSettings({ ...settings, upcomingInvoiceMessage: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm resize-none outline-none"
                style={{ borderColor: "#E7ECF3", color: TEXT, direction: "rtl" }}
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5 flex items-center gap-1.5" style={{ color: TEXT }}>
                <AlertCircle className="w-4 h-4" style={{ color: "#B42318" }} />
                رسالة الفاتورة المتأخرة
              </label>
              <textarea
                rows={3}
                value={settings.overdueInvoiceMessage}
                onChange={e => setSettings({ ...settings, overdueInvoiceMessage: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm resize-none outline-none"
                style={{ borderColor: "#FECACA", color: TEXT, direction: "rtl" }}
              />
            </div>
          </div>

          {/* Manual trigger */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "#EEF2F7" }}>
            <p className="text-xs mb-2" style={{ color: TEXT_SEC }}>تشغيل يدوي لفحص الفواتير وإرسال التذكيرات الآن</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={runInvoiceCheck}
              disabled={runningCheck}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "#0D7A5F" }}
            >
              {runningCheck ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {runningCheck ? "جارٍ الفحص..." : "فحص وإرسال التذكيرات الآن"}
            </motion.button>
            {checkResult && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-2 px-3 py-2 rounded-xl text-xs font-semibold text-center"
                style={{ backgroundColor: checkResult.success ? "#ECFDF5" : "#FEF2F2", color: checkResult.success ? "#065F46" : "#B42318" }}>
                {checkResult.success
                  ? `✓ تم إرسال ${checkResult.sent} تذكير، تجاوز ${checkResult.skipped}`
                  : "حدث خطأ أثناء الفحص"}
              </motion.div>
            )}
          </div>
        </div>

        {/* Test Message */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E7ECF3" }}>
          <h2 className="text-base font-bold mb-4" style={{ color: TEXT }}>إرسال رسالة تجريبية</h2>
          <div className="flex gap-2">
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="نص الرسالة التجريبية..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none"
              style={{ borderColor: "#E7ECF3", color: TEXT, direction: "rtl" }}
              rows={3}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={sendTestNotification}
              disabled={sendingTest || !testMessage.trim()}
              className="px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 flex-shrink-0"
              style={{ backgroundColor: PRIMARY }}
            >
              {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-2">
          {savedMessage && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-center"
              style={{ backgroundColor: "#ECFDF5", color: "#059669" }}
            >
              {savedMessage}
            </motion.div>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: PRIMARY }}
          >
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}