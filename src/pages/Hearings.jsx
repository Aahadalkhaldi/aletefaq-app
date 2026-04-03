import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Calendar, Plus, Search, ChevronLeft, Scale,
  Clock, CheckCircle, X, Loader2, AlertCircle, MapPin
} from "lucide-react";

const statusConfig = {
  scheduled: { label: "مجدولة", bg: "#EAF2FF", text: "#123E7C" },
  completed: { label: "منتهية", bg: "#F0FFF4", text: "#1A6E3A" },
  postponed: { label: "مؤجلة", bg: "#FFF4E5", text: "#8A5A00" },
  cancelled: { label: "ملغاة", bg: "#FDECEC", text: "#B42318" },
};

const typeMap = {
  initial: "ابتدائية", hearing: "جلسة", verdict: "حكم",
  appeal: "استئناف", execution: "تنفيذ", other: "أخرى",
};

function NewHearingForm({ cases, onClose, onSave }) {
  const [form, setForm] = useState({
    case_id: "", court_name: "", date: "", time: "",
    type: "hearing", location: "", notes: ""
  });
  const [saving, setSaving] = useState(false);

  const handleCaseSelect = (id) => {
    const c = cases.find(x => x.id === id);
    setForm(f => ({ ...f, case_id: id, case_title: c?.title || "", court_name: c?.court_name || "" }));
  };

  const handleSubmit = async () => {
    if (!form.case_id || !form.date || !form.court_name) return;
    setSaving(true);
    await base44.entities.Hearing.create({ ...form, status: "scheduled" });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto"
      style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
      <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: "#101828" }}>جلسة جديدة</h3>
        <button onClick={onClose}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
      </div>
      <div className="space-y-3">
        <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          value={form.case_id} onChange={e => handleCaseSelect(e.target.value)}>
          <option value="">اختر القضية *</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.title} — {c.client_name}</option>)}
        </select>
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="اسم المحكمة *" value={form.court_name} onChange={e => setForm(f => ({ ...f, court_name: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <input type="time" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
        </div>
        <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {Object.entries(typeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="القاعة / الموقع" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="ملاحظات..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
          disabled={saving || !form.case_id || !form.date || !form.court_name}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {saving ? "جارٍ الحفظ..." : "إضافة الجلسة"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Hearings() {
  const navigate = useNavigate();
  const [hearings, setHearings] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [h, c] = await Promise.all([
      base44.entities.Hearing.list("date", 100).catch(() => []),
      base44.entities.Case.filter({ status: "in_progress" }, "-updated_date", 100).catch(() => []),
    ]);
    setHearings(h);
    setCases(c);
    setLoading(false);
  };

  const filtered = hearings.filter(h => {
    if (filter === "upcoming") return h.date >= today && h.status === "scheduled";
    if (filter === "today") return h.date === today;
    if (filter === "past") return h.date < today || h.status === "completed";
    return true;
  });

  const todayCount = hearings.filter(h => h.date === today).length;
  const upcomingCount = hearings.filter(h => h.date > today && h.status === "scheduled").length;

  return (
    <div className="min-h-screen pb-8" style={{ background: "#F3F7FD" }}>
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#101828" }}>الجلسات</h1>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
              {todayCount} اليوم • {upcomingCount} قادمة
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#123E7C" }}>
            <Plus className="w-4 h-4" /> جلسة جديدة
          </motion.button>
        </div>

        <div className="flex gap-2">
          {[["today", "اليوم"], ["upcoming", "القادمة"], ["past", "المنتهية"], ["all", "الكل"]].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={{ backgroundColor: filter === key ? "#123E7C" : "#F2F4F7", color: filter === key ? "white" : "#6B7280" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "#E7ECF3" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد جلسات</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((h, i) => {
              const st = statusConfig[h.status] || statusConfig.scheduled;
              const isToday = h.date === today;
              return (
                <motion.button key={h.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.98 }}
                  onClick={() => h.case_id && navigate(`/cases/${h.case_id}`)}
                  className="w-full bg-white rounded-2xl border p-4 text-right"
                  style={{ borderColor: "#E7ECF3", borderRightWidth: 4, borderRightColor: isToday ? "#123E7C" : "#E7ECF3" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isToday ? "#EAF2FF" : "#F2F4F7" }}>
                      <Scale className="w-5 h-5" style={{ color: isToday ? "#123E7C" : "#9CA3AF" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isToday && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>اليوم</span>}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#F2F4F7", color: "#526071" }}>
                          {typeMap[h.type] || "جلسة"}
                        </span>
                      </div>
                      <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>
                        {h.case_title || "قضية"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{h.court_name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                          <span className="text-xs" style={{ color: "#6B7280" }}>
                            {h.date ? new Date(h.date).toLocaleDateString("ar-QA") : "—"}
                          </span>
                        </div>
                        {h.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                            <span className="text-xs" style={{ color: "#6B7280" }}>{h.time}</span>
                          </div>
                        )}
                        {h.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                            <span className="text-xs truncate" style={{ color: "#6B7280" }}>{h.location}</span>
                          </div>
                        )}
                      </div>
                      {h.outcome && (
                        <p className="text-xs mt-1.5 px-2 py-1 rounded-lg"
                          style={{ backgroundColor: "#F0FFF4", color: "#1A6E3A" }}>
                          النتيجة: {h.outcome}
                        </p>
                      )}
                    </div>
                    <ChevronLeft className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "#9CA3AF" }} />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowForm(false)} />
            <NewHearingForm cases={cases} onClose={() => setShowForm(false)} onSave={loadAll} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}