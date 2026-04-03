import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  ClipboardList, Plus, Search, ChevronLeft, CheckCircle,
  Clock, AlertCircle, X, Loader2, Filter, Calendar
} from "lucide-react";

const typeMap = {
  judgment: { label: "متابعة حكم", color: "#6366F1", bg: "#EEF2FF" },
  procedure: { label: "إجراء قانوني", color: "#123E7C", bg: "#EAF2FF" },
  payment: { label: "متابعة دفع", color: "#8A5A00", bg: "#FFF4E5" },
  submission: { label: "تقديم مذكرة", color: "#1A6E3A", bg: "#F0FFF4" },
  enforcement: { label: "تنفيذ", color: "#B42318", bg: "#FDECEC" },
  other: { label: "أخرى", color: "#526071", bg: "#F2F4F7" },
};

const statusConfig = {
  open: { label: "مفتوحة", bg: "#EAF2FF", text: "#123E7C" },
  in_progress: { label: "قيد التنفيذ", bg: "#FFF4E5", text: "#8A5A00" },
  completed: { label: "مكتملة", bg: "#F0FFF4", text: "#1A6E3A" },
  overdue: { label: "متأخرة", bg: "#FDECEC", text: "#B42318" },
  cancelled: { label: "ملغاة", bg: "#F2F4F7", text: "#526071" },
};

const priorityConfig = {
  low: { label: "منخفضة", color: "#526071" },
  medium: { label: "متوسطة", color: "#8A5A00" },
  high: { label: "عالية", color: "#B42318" },
  urgent: { label: "عاجل", color: "#B42318" },
};

function FollowUpForm({ cases, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    case_id: "", title: "", type: "procedure", description: "",
    deadline: "", priority: "medium", assignee_name: "", notes: "", status: "open"
  });
  const [saving, setSaving] = useState(false);

  const handleCaseSelect = (caseId) => {
    const c = cases.find(x => x.id === caseId);
    setForm(f => ({ ...f, case_id: caseId, case_title: c?.title || "", client_name: c?.client_name || "" }));
  };

  const handleSubmit = async () => {
    if (!form.case_id || !form.title || !form.deadline) return;
    setSaving(true);
    if (initial?.id) {
      await base44.entities.FollowUp.update(initial.id, form);
    } else {
      await base44.entities.FollowUp.create(form);
    }
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
        <h3 className="text-base font-bold" style={{ color: "#101828" }}>
          {initial?.id ? "تعديل متابعة" : "متابعة جديدة"}
        </h3>
        <button onClick={onClose}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>القضية *</label>
          <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            value={form.case_id} onChange={e => handleCaseSelect(e.target.value)}>
            <option value="">— اختر القضية —</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.title} ({c.client_name})</option>)}
          </select>
        </div>
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="عنوان المتابعة *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>النوع</label>
            <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {Object.entries(typeMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>الأولوية</label>
            <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجل</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>تاريخ الاستحقاق *</label>
          <input type="date" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
        </div>
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="المكلف بالتنفيذ" value={form.assignee_name} onChange={e => setForm(f => ({ ...f, assignee_name: e.target.value }))} />
        <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="تفاصيل المتابعة..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        {initial?.id && (
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>الحالة</label>
            <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        )}
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
          disabled={saving || !form.case_id || !form.title || !form.deadline}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {saving ? "جارٍ الحفظ..." : (initial?.id ? "حفظ التعديلات" : "إضافة المتابعة")}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function FollowUps() {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [fu, c] = await Promise.all([
      base44.entities.FollowUp.list("-deadline", 100).catch(() => []),
      base44.entities.Case.list("-updated_date", 100).catch(() => []),
    ]);
    // تحديث المتأخرة تلقائياً
    const updated = fu.map(f => ({
      ...f,
      status: f.status === "open" && f.deadline < today ? "overdue" : f.status,
    }));
    setFollowUps(updated);
    setCases(c);
    setLoading(false);
  };

  const handleComplete = async (item) => {
    await base44.entities.FollowUp.update(item.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    loadAll();
  };

  const filtered = followUps.filter(f => {
    const matchSearch = !search || f.title?.includes(search) || f.case_title?.includes(search) || f.client_name?.includes(search);
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    open: followUps.filter(f => f.status === "open").length,
    overdue: followUps.filter(f => f.status === "overdue").length,
    in_progress: followUps.filter(f => f.status === "in_progress").length,
    completed: followUps.filter(f => f.status === "completed").length,
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F3F7FD" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F7F8FA" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#101828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#101828" }}>المتابعات</h1>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{followUps.length} متابعة إجمالاً</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#123E7C" }}>
            <Plus className="w-4 h-4" /> متابعة جديدة
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "مفتوحة", value: stats.open, color: "#123E7C", bg: "#EAF2FF" },
            { label: "متأخرة", value: stats.overdue, color: "#B42318", bg: "#FDECEC" },
            { label: "جارية", value: stats.in_progress, color: "#8A5A00", bg: "#FFF4E5" },
            { label: "مكتملة", value: stats.completed, color: "#1A6E3A", bg: "#F0FFF4" },
          ].map(s => (
            <button key={s.label} onClick={() => setStatusFilter(s.label === "مفتوحة" ? "open" : s.label === "متأخرة" ? "overdue" : s.label === "جارية" ? "in_progress" : "completed")}
              className="rounded-xl p-2 text-center" style={{ backgroundColor: s.bg }}>
              <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] font-semibold" style={{ color: s.color }}>{s.label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 h-11 rounded-xl border" style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#6B7280" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث في المتابعات..."
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: "#101828", direction: "rtl" }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        {[["all", "الكل"], ["open", "مفتوحة"], ["overdue", "متأخرة"], ["in_progress", "جارية"], ["completed", "مكتملة"]].map(([key, label]) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap"
            style={{ backgroundColor: statusFilter === key ? "#123E7C" : "#F2F4F7", color: statusFilter === key ? "white" : "#6B7280" }}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 h-24 animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: "#E7ECF3" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد متابعات</p>
            <button onClick={() => setShowForm(true)}
              className="mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#123E7C" }}>
              + إضافة متابعة
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((item, i) => {
              const type = typeMap[item.type] || typeMap.other;
              const st = statusConfig[item.status] || statusConfig.open;
              const isOverdue = item.status === "overdue";
              const daysLeft = item.deadline ? Math.ceil((new Date(item.deadline) - new Date(today)) / 86400000) : null;
              return (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border p-4"
                  style={{ borderColor: isOverdue ? "#FDECEC" : "#E7ECF3", borderRightWidth: 4, borderRightColor: isOverdue ? "#B42318" : type.color }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: type.bg }}>
                      <ClipboardList className="w-4 h-4" style={{ color: type.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: type.bg, color: type.color }}>{type.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                        {item.priority === "urgent" && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>عاجل</span>}
                      </div>
                      <p className="text-sm font-bold" style={{ color: "#101828" }}>{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{item.case_title} • {item.client_name}</p>
                      {item.assignee_name && <p className="text-xs" style={{ color: "#6B7280" }}>المكلف: {item.assignee_name}</p>}
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" style={{ color: isOverdue ? "#B42318" : "#6B7280" }} />
                        <span className="text-xs font-semibold" style={{ color: isOverdue ? "#B42318" : "#6B7280" }}>
                          {item.deadline ? new Date(item.deadline).toLocaleDateString("ar-QA") : "—"}
                          {daysLeft !== null && item.status !== "completed" && (
                            <span className="mr-1">
                              {daysLeft < 0 ? `(متأخر ${Math.abs(daysLeft)} يوم)` : daysLeft === 0 ? "(اليوم)" : `(${daysLeft} يوم)`}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.status !== "completed" && item.status !== "cancelled" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleComplete(item)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold"
                        style={{ backgroundColor: "#F0FFF4", color: "#1A6E3A" }}>
                        ✓ تم الإنجاز
                      </button>
                      <button onClick={() => { setEditItem(item); setShowForm(true); }}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border"
                        style={{ borderColor: "#E7ECF3", color: "#6B7280" }}>
                        تعديل
                      </button>
                      {item.case_id && (
                        <button onClick={() => navigate(`/cases/${item.case_id}`)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold"
                          style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
                          القضية
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
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
            <FollowUpForm cases={cases} onClose={() => { setShowForm(false); setEditItem(null); }}
              onSave={loadAll} initial={editItem} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}