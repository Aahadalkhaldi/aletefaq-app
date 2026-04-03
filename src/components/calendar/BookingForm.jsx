import { useState } from "react";
import { motion } from "framer-motion";
import { X, Calendar, Clock, Loader2, Building2, Video, Scale, MapPin, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";

const locationMap = {
  office: { label: "المكتب", icon: Building2, color: "#123E7C", bg: "#EAF2FF" },
  online: { label: "أونلاين", icon: Video, color: "#6366F1", bg: "#EEF2FF" },
  court: { label: "المحكمة", icon: Scale, color: "#8A5A00", bg: "#FFF4E5" },
  other: { label: "أخرى", icon: MapPin, color: "#526071", bg: "#F2F4F7" },
};

const serviceTypes = [
  "استشارة قانونية",
  "مراجعة مستند",
  "متابعة قضية",
  "جلسة تحضيرية",
  "تسوية نزاع",
];

export default function BookingForm({ cases = [], initialDate = "", onSave, onClose, isClientView = false }) {
  const [form, setForm] = useState({
    title: "",
    case_id: "",
    case_title: "",
    client_name: "",
    date: initialDate,
    time: "",
    duration_minutes: 60,
    location: "office",
    notes: "",
    reminder_sent: false,
  });
  const [saving, setSaving] = useState(false);
  const [notifyClient, setNotifyClient] = useState(true);

  const handleCaseSelect = (caseId) => {
    const c = cases.find(x => x.id === caseId);
    setForm(f => ({
      ...f,
      case_id: caseId,
      case_title: c?.title || "",
      client_name: c?.client_name || "",
      client_id: c?.client_id || "",
      title: f.title || `اجتماع: ${c?.title || ""}`,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.time) return;
    setSaving(true);

    const meeting = await base44.entities.Meeting.create({ ...form, status: "scheduled" });

    // إنشاء إشعار فوري للتأكيد
    if (notifyClient && form.client_name) {
      await base44.entities.Notification.create({
        user_id: form.client_name,
        title: "✅ تم تأكيد موعدك",
        body: `تم حجز موعد "${form.title}" بتاريخ ${form.date} الساعة ${form.time}`,
        type: "case_update",
        related_id: meeting.id,
        related_type: "Meeting",
        action_url: "/appointments",
        is_read: false,
      }).catch(() => {});
    }

    setSaving(false);
    onSave?.();
    onClose?.();
  };

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto"
      style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}
    >
      <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold" style={{ color: "#101828" }}>
          {isClientView ? "طلب حجز موعد" : "إنشاء موعد جديد"}
        </h3>
        <button onClick={onClose}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
      </div>

      <div className="space-y-4">
        {/* Service type pills */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "#6B7280" }}>نوع الموعد</p>
          <div className="flex flex-wrap gap-2">
            {serviceTypes.map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, title: s }))}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: form.title === s ? "#123E7C" : "white",
                  color: form.title === s ? "white" : "#6B7280",
                  borderColor: form.title === s ? "#123E7C" : "#E7ECF3",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Custom title */}
        <input
          className="w-full border rounded-xl px-3 h-11 text-sm outline-none"
          style={{ borderColor: "#E7ECF3" }}
          placeholder="أو أدخل عنواناً مخصصاً *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />

        {/* Case selector (lawyer only) */}
        {!isClientView && (
          <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            value={form.case_id} onChange={e => handleCaseSelect(e.target.value)}>
            <option value="">— ربط بقضية (اختياري) —</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.title} ({c.client_name})</option>)}
          </select>
        )}

        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="اسم العميل / الموكل"
          value={form.client_name}
          onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>التاريخ *</label>
            <input type="date" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>الوقت *</label>
            <input type="time" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>المدة</label>
          <div className="flex gap-2">
            {[30, 45, 60, 90, 120].map(d => (
              <button key={d} onClick={() => setForm(f => ({ ...f, duration_minutes: d }))}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: form.duration_minutes === d ? "#123E7C" : "white",
                  color: form.duration_minutes === d ? "white" : "#6B7280",
                  borderColor: form.duration_minutes === d ? "#123E7C" : "#E7ECF3",
                }}>
                {d < 60 ? `${d}د` : `${d / 60}س`}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>المكان</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(locationMap).map(([key, val]) => {
              const Icon = val.icon;
              return (
                <button key={key} onClick={() => setForm(f => ({ ...f, location: key }))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all"
                  style={{
                    backgroundColor: form.location === key ? val.bg : "white",
                    borderColor: form.location === key ? val.color : "#E7ECF3",
                    color: form.location === key ? val.color : "#6B7280",
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                  {val.label}
                </button>
              );
            })}
          </div>
        </div>

        <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="ملاحظات..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

        {/* Reminder toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E7ECF3", backgroundColor: "#F9FAFB" }}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: "#123E7C" }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: "#101828" }}>تذكير تلقائي</p>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>إشعار قبل 24 ساعة</p>
            </div>
          </div>
          <button
            onClick={() => setNotifyClient(v => !v)}
            className="w-12 h-6 rounded-full transition-all flex items-center px-1"
            style={{ backgroundColor: notifyClient ? "#123E7C" : "#E7ECF3" }}
          >
            <motion.div animate={{ x: notifyClient ? 22 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-5 h-5 bg-white rounded-full shadow" />
          </button>
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
          disabled={saving || !form.title || !form.date || !form.time}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          {saving ? "جارٍ الحفظ..." : isClientView ? "إرسال طلب الموعد" : "جدولة الموعد"}
        </motion.button>
      </div>
    </motion.div>
  );
}