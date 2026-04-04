import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Case } from '@/api/entities';
import {
  FolderOpen, Plus, Search, ChevronLeft, Scale,
  Clock, Calendar, X, Loader2, AlertCircle
} from "lucide-react";
import StatusChip from "../components/ui/StatusChip";

const statusMap = {
  new: { label: "جديدة", variant: "pending" },
  in_progress: { label: "نشطة", variant: "active" },
  court: { label: "في المحكمة", variant: "active" },
  waiting_docs: { label: "بانتظار مستندات", variant: "pending" },
  closed: { label: "مغلقة", variant: "closed" },
  archived: { label: "مؤرشفة", variant: "closed" },
};

const typeMap = {
  civil: "مدنية", commercial: "تجارية", criminal: "جنائية",
  family: "أسرة", labor: "عمالية", administrative: "إدارية",
  execution: "تنفيذ", other: "أخرى",
};

const filterTabs = ["الكل", "جديدة", "نشطة", "في المحكمة", "مغلقة"];

function NewCaseForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: "", case_number: "", type: "civil", client_name: "",
    court_name: "", parties: "", description: "", status: "new", priority: "medium"
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.client_name) return;
    setSaving(true);
    await Case.create(form);
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
        <h3 className="text-base font-bold" style={{ color: "#101828" }}>دعوى جديدة</h3>
        <button onClick={onClose}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
      </div>
      <div className="space-y-3">
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="عنوان الدعوى *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="رقم القضية" value={form.case_number} onChange={e => setForm(f => ({ ...f, case_number: e.target.value }))} />
          <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {Object.entries(typeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="اسم الموكل *" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="المحكمة" value={form.court_name} onChange={e => setForm(f => ({ ...f, court_name: e.target.value }))} />
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="أطراف النزاع" value={form.parties} onChange={e => setForm(f => ({ ...f, parties: e.target.value }))} />
        <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
          <option value="low">أولوية عادية</option>
          <option value="medium">أولوية متوسطة</option>
          <option value="high">أولوية عالية</option>
          <option value="urgent">عاجل</option>
        </select>
        <textarea rows={3} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="وصف القضية..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
          disabled={saving || !form.title || !form.client_name}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {saving ? "جارٍ الحفظ..." : "إضافة الدعوى"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    setLoading(true);
    const data = await Case.list("-updated_date", 100);
    setCases(data);
    setLoading(false);
  };

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.title?.includes(search) || c.case_number?.includes(search) || c.client_name?.includes(search);
    const matchFilter =
      activeFilter === "الكل" ||
      (activeFilter === "جديدة" && c.status === "new") ||
      (activeFilter === "نشطة" && c.status === "in_progress") ||
      (activeFilter === "في المحكمة" && c.status === "court") ||
      (activeFilter === "مغلقة" && ["closed", "archived"].includes(c.status));
    return matchSearch && matchFilter;
  });

  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === "in_progress").length,
    court: cases.filter(c => c.status === "court").length,
    new: cases.filter(c => c.status === "new").length,
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: "#F3F7FD" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#101828" }}>القضايا والدعاوى</h1>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{cases.length} قضية إجمالاً</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#123E7C" }}>
            <Plus className="w-4 h-4" /> دعوى جديدة
          </motion.button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "الكل", value: stats.total, color: "#123E7C", bg: "#EAF2FF" },
            { label: "نشطة", value: stats.active, color: "#1A6E3A", bg: "#F0FFF4" },
            { label: "المحكمة", value: stats.court, color: "#8A5A00", bg: "#FFF4E5" },
            { label: "جديدة", value: stats.new, color: "#6366F1", bg: "#EEF2FF" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2 text-center" style={{ backgroundColor: s.bg }}>
              <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] font-semibold" style={{ color: s.color }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 h-11 rounded-xl border" style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#6B7280" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم القضية أو الموكل..."
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: "#101828", direction: "rtl" }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        {filterTabs.map(tab => (
          <button key={tab} onClick={() => setActiveFilter(tab)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={{ backgroundColor: activeFilter === tab ? "#123E7C" : "#F2F4F7", color: activeFilter === tab ? "white" : "#6B7280" }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-28 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: "#E7ECF3" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد قضايا</p>
            <button onClick={() => setShowForm(true)}
              className="mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#123E7C" }}>
              + إضافة دعوى جديدة
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.button key={c.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="w-full bg-white rounded-2xl p-4 border text-right"
                style={{ borderColor: "#E7ECF3" }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#EAF2FF" }}>
                    <Scale className="w-5 h-5" style={{ color: "#123E7C" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: "#F2F4F7", color: "#526071" }}>
                        {typeMap[c.type] || c.type}
                      </span>
                      {c.case_number && (
                        <span className="text-[10px]" style={{ color: "#9CA3AF" }}>#{c.case_number}</span>
                      )}
                      {c.priority === "urgent" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>عاجل</span>
                      )}
                    </div>
                    <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>{c.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>الموكل: {c.client_name}</p>
                    {c.court_name && <p className="text-xs" style={{ color: "#9CA3AF" }}>{c.court_name}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <StatusChip label={statusMap[c.status]?.label || c.status} variant={statusMap[c.status]?.variant || "active"} />
                      {c.next_hearing_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" style={{ color: "#6B7280" }} />
                          <span className="text-[10px]" style={{ color: "#6B7280" }}>
                            {new Date(c.next_hearing_date).toLocaleDateString("ar-QA")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 flex-shrink-0 mt-2" style={{ color: "#9CA3AF" }} />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowForm(false)} />
            <NewCaseForm onClose={() => setShowForm(false)} onSave={loadCases} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}