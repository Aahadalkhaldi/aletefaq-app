import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Users, Plus, Search, X, Loader2, ChevronLeft,
  Phone, CreditCard, Scale, Building2, User, Gavel
} from "lucide-react";

const typeConfig = {
  opponent:   { label: "خصم",          color: "#B42318", bg: "#FDECEC",  icon: Gavel },
  client:     { label: "موكل",          color: "#123E7C", bg: "#EAF2FF",  icon: User },
  government: { label: "جهة حكومية",   color: "#6366F1", bg: "#EEF2FF",  icon: Building2 },
  witness:    { label: "شاهد",          color: "#8A5A00", bg: "#FFF4E5",  icon: User },
  expert:     { label: "خبير",          color: "#1A6E3A", bg: "#F0FFF4",  icon: User },
  other:      { label: "أخرى",          color: "#526071", bg: "#F2F4F7",  icon: User },
};

function PartyForm({ cases, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    full_name: "", type: "opponent", id_number: "", phone: "",
    email: "", nationality: "", address: "", lawyer_name: "", notes: "",
    case_ids: [], case_titles: []
  });
  const [saving, setSaving] = useState(false);

  const toggleCase = (c) => {
    const exists = form.case_ids.includes(c.id);
    setForm(f => ({
      ...f,
      case_ids: exists ? f.case_ids.filter(x => x !== c.id) : [...f.case_ids, c.id],
      case_titles: exists ? f.case_titles.filter(x => x !== c.title) : [...f.case_titles, c.title],
    }));
  };

  const handleSubmit = async () => {
    if (!form.full_name) return;
    setSaving(true);
    if (initial?.id) {
      await base44.entities.Party.update(initial.id, form);
    } else {
      await base44.entities.Party.create(form);
    }
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-5 pb-10 max-h-[92vh] overflow-y-auto"
      style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
      <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: "#101828" }}>
          {initial?.id ? "تعديل الطرف" : "إضافة طرف جديد"}
        </h3>
        <button onClick={onClose}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
      </div>

      <div className="space-y-3">
        {/* Type */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>نوع الطرف *</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{ backgroundColor: form.type === key ? cfg.color : cfg.bg, color: form.type === key ? "white" : cfg.color, border: `1px solid ${cfg.color}20` }}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="الاسم الكامل *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="رقم الهوية" value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} />
          <input className="border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="رقم الهاتف" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="البريد الإلكتروني" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} dir="ltr" />
          <input className="border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="الجنسية" value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} />
        </div>

        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="اسم محاميه (إن وجد)" value={form.lawyer_name} onChange={e => setForm(f => ({ ...f, lawyer_name: e.target.value }))} />

        <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="ملاحظات..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

        {/* Link to Cases */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#6B7280" }}>ربط بالقضايا</label>
          <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border p-2" style={{ borderColor: "#E7ECF3" }}>
            {cases.length === 0 && <p className="text-xs text-center py-2" style={{ color: "#9CA3AF" }}>لا توجد قضايا</p>}
            {cases.map(c => {
              const selected = form.case_ids.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggleCase(c)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-right transition-all"
                  style={{ backgroundColor: selected ? "#EAF2FF" : "#F7F8FA", border: `1px solid ${selected ? "#123E7C" : "#E7ECF3"}` }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: selected ? "#123E7C" : "white", border: `1.5px solid ${selected ? "#123E7C" : "#D1D5DB"}` }}>
                    {selected && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-xs font-semibold truncate" style={{ color: "#101828" }}>{c.title}</p>
                    <p className="text-[10px]" style={{ color: "#6B7280" }}>{c.client_name}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {form.case_ids.length > 0 && (
            <p className="text-xs mt-1" style={{ color: "#123E7C" }}>مرتبط بـ {form.case_ids.length} قضية</p>
          )}
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
          disabled={saving || !form.full_name}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {saving ? "جارٍ الحفظ..." : (initial?.id ? "حفظ التعديلات" : "إضافة الطرف")}
        </motion.button>
      </div>
    </motion.div>
  );
}

function PartyCard({ party, onClick }) {
  const cfg = typeConfig[party.type] || typeConfig.other;
  const Icon = cfg.icon;
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
      className="w-full bg-white rounded-2xl border p-4 text-right"
      style={{ borderColor: "#E7ECF3", borderRightWidth: 4, borderRightColor: cfg.color }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>{party.full_name}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          </div>
          {party.id_number && (
            <div className="flex items-center gap-1">
              <CreditCard className="w-3 h-3 flex-shrink-0" style={{ color: "#9CA3AF" }} />
              <span className="text-xs" style={{ color: "#6B7280" }}>{party.id_number}</span>
            </div>
          )}
          {party.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 flex-shrink-0" style={{ color: "#9CA3AF" }} />
              <span className="text-xs" style={{ color: "#6B7280" }}>{party.phone}</span>
            </div>
          )}
          {party.case_ids?.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Scale className="w-3 h-3 flex-shrink-0" style={{ color: "#123E7C" }} />
              <span className="text-xs font-semibold" style={{ color: "#123E7C" }}>
                {party.case_ids.length} قضية مرتبطة
              </span>
            </div>
          )}
        </div>
        <ChevronLeft className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "#9CA3AF" }} />
      </div>
    </motion.button>
  );
}

function PartyDetail({ party, cases, onClose, onEdit, onDelete }) {
  const cfg = typeConfig[party.type] || typeConfig.other;
  const Icon = cfg.icon;
  const navigate = useNavigate();
  const linkedCases = cases.filter(c => party.case_ids?.includes(c.id));

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b flex items-center gap-3" style={{ borderColor: "#EEF2F7" }}>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
          <X className="w-4 h-4" style={{ color: "#101828" }} />
        </button>
        <h1 className="text-base font-bold flex-1 truncate" style={{ color: "#101828" }}>ملف الطرف</h1>
        <button onClick={onEdit} className="px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>تعديل</button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Identity Card */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E7ECF3", borderRightWidth: 4, borderRightColor: cfg.color }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
              <Icon className="w-7 h-7" style={{ color: cfg.color }} />
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#101828" }}>{party.full_name}</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            </div>
          </div>
          {[
            { label: "رقم الهوية", value: party.id_number },
            { label: "الهاتف", value: party.phone },
            { label: "البريد الإلكتروني", value: party.email },
            { label: "الجنسية", value: party.nationality },
            { label: "العنوان", value: party.address },
            { label: "محاميه", value: party.lawyer_name },
            { label: "ملاحظات", value: party.notes },
          ].filter(r => r.value).map(row => (
            <div key={row.label} className="py-2 border-b last:border-0" style={{ borderColor: "#EEF2F7" }}>
              <p className="text-[10px] font-semibold" style={{ color: "#9CA3AF" }}>{row.label}</p>
              <p className="text-sm mt-0.5" style={{ color: "#101828" }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Linked Cases */}
        <div>
          <p className="text-sm font-bold mb-2" style={{ color: "#101828" }}>
            القضايا المرتبطة ({linkedCases.length})
          </p>
          {linkedCases.length === 0 ? (
            <div className="bg-white rounded-2xl border p-5 text-center" style={{ borderColor: "#E7ECF3" }}>
              <Scale className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
              <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد قضايا مرتبطة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {linkedCases.map(c => (
                <button key={c.id} onClick={() => navigate(`/cases/${c.id}`)}
                  className="w-full bg-white rounded-2xl border p-4 text-right flex items-center gap-3"
                  style={{ borderColor: "#E7ECF3" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
                    <Scale className="w-4 h-4" style={{ color: "#123E7C" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>{c.title}</p>
                    <p className="text-xs" style={{ color: "#6B7280" }}>{c.client_name} • {c.court_name || "—"}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 flex-shrink-0" style={{ color: "#9CA3AF" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={async () => { await base44.entities.Party.delete(party.id); onDelete(); }}
          className="w-full py-3 rounded-2xl text-sm font-semibold"
          style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>
          حذف هذا الطرف
        </button>
      </div>
    </motion.div>
  );
}

export default function Parties() {
  const [parties, setParties] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      base44.entities.Party.list("-created_date", 200).catch(() => []),
      base44.entities.Case.list("-updated_date", 100).catch(() => []),
    ]);
    setParties(p);
    setCases(c);
    setLoading(false);
  };

  const filtered = parties.filter(p => {
    const matchSearch = !search || p.full_name?.includes(search) || p.id_number?.includes(search) || p.phone?.includes(search);
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = Object.keys(typeConfig).map(key => ({
    key, ...typeConfig[key], count: parties.filter(p => p.type === key).length
  })).filter(s => s.count > 0);

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F3F7FD" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#101828" }}>الأطراف والخصوم</h1>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{parties.length} طرف مسجل</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#123E7C" }}>
            <Plus className="w-4 h-4" /> إضافة طرف
          </motion.button>
        </div>

        {/* Stats chips */}
        {stats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
            {stats.map(s => (
              <button key={s.key} onClick={() => setTypeFilter(typeFilter === s.key ? "all" : s.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
                style={{ backgroundColor: typeFilter === s.key ? s.color : s.bg, color: typeFilter === s.key ? "white" : s.color }}>
                {s.label} <span className="font-bold">{s.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2 px-3 h-11 rounded-xl border" style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#6B7280" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهوية أو الهاتف..."
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: "#101828", direction: "rtl" }} />
        </div>
      </div>

      {/* List */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 h-24 animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#E7ECF3" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد أطراف مسجلة</p>
            <button onClick={() => setShowForm(true)}
              className="mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#123E7C" }}>
              + إضافة طرف جديد
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((party, i) => (
              <motion.div key={party.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <PartyCard party={party} onClick={() => setSelectedParty(party)} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Form Overlay */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowForm(false)} />
            <PartyForm cases={cases} onClose={() => { setShowForm(false); setEditItem(null); }}
              onSave={loadAll} initial={editItem} />
          </>
        )}
      </AnimatePresence>

      {/* Detail View */}
      <AnimatePresence>
        {selectedParty && (
          <PartyDetail
            party={selectedParty}
            cases={cases}
            onClose={() => setSelectedParty(null)}
            onEdit={() => { setEditItem(selectedParty); setSelectedParty(null); setShowForm(true); }}
            onDelete={() => { setSelectedParty(null); loadAll(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}