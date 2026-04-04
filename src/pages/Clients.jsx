import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Case, Client } from '@/api/entities';
import {
  Users, Plus, Search, ChevronLeft, Phone, Mail,
  FileText, Scale, X, Loader2, User
} from "lucide-react";

function NewClientForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", id_number: "",
    nationality: "", notes: ""
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.full_name) return;
    setSaving(true);
    await Client.create(form);
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
        <h3 className="text-base font-bold" style={{ color: "#101828" }}>موكل جديد</h3>
        <button onClick={onClose}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
      </div>
      <div className="space-y-3">
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="الاسم الكامل *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="رقم الهاتف" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="البريد الإلكتروني" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="رقم الهوية / الإقامة" value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} />
          <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="الجنسية" value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} />
        </div>
        <textarea rows={3} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="ملاحظات..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
          disabled={saving || !form.full_name}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {saving ? "جارٍ الحفظ..." : "إضافة الموكل"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [cl, cs] = await Promise.all([
      Client.list("-created_date", 100).catch(() => []),
      Case.list("-updated_date", 200).catch(() => []),
    ]);
    setClients(cl);
    setCases(cs);
    setLoading(false);
  };

  // If no Client entity, derive clients from cases
  const derivedClients = clients.length > 0 ? clients : (() => {
    const map = {};
    cases.forEach(c => {
      if (c.client_name && !map[c.client_name]) {
        map[c.client_name] = { id: c.client_id || c.client_name, full_name: c.client_name, cases: [] };
      }
      if (c.client_name && map[c.client_name]) map[c.client_name].cases.push(c);
    });
    return Object.values(map);
  })();

  const getClientCases = (clientName) => cases.filter(c => c.client_name === clientName);

  const filtered = derivedClients.filter(cl =>
    !search || cl.full_name?.includes(search) || cl.phone?.includes(search) || cl.email?.includes(search)
  );

  return (
    <div className="min-h-screen pb-8" style={{ background: "#F3F7FD" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#101828" }}>الموكلون</h1>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{derivedClients.length} موكل</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#123E7C" }}>
            <Plus className="w-4 h-4" /> موكل جديد
          </motion.button>
        </div>

        <div className="flex items-center gap-2 px-3 h-11 rounded-xl border" style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#6B7280" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم الموكل أو رقم الهاتف..."
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: "#101828", direction: "rtl" }} />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-24 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#E7ECF3" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>لا يوجد موكلون</p>
            <button onClick={() => setShowForm(true)}
              className="mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#123E7C" }}>
              + إضافة موكل جديد
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((cl, i) => {
              const clientCases = getClientCases(cl.full_name);
              const activeCases = clientCases.filter(c => ["in_progress", "court", "new"].includes(c.status));
              return (
                <motion.div key={cl.id || cl.full_name}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
                      <span className="text-lg font-bold text-white">
                        {cl.full_name?.charAt(0) || "م"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: "#101828" }}>{cl.full_name}</p>
                      {cl.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" style={{ color: "#6B7280" }} />
                          <span className="text-xs" style={{ color: "#6B7280" }}>{cl.phone}</span>
                        </div>
                      )}
                      {cl.nationality && (
                        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{cl.nationality}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                          style={{ backgroundColor: "#EAF2FF" }}>
                          <Scale className="w-3 h-3" style={{ color: "#123E7C" }} />
                          <span className="text-[10px] font-bold" style={{ color: "#123E7C" }}>
                            {clientCases.length} قضية
                          </span>
                        </div>
                        {activeCases.length > 0 && (
                          <span className="text-[10px] px-2 py-1 rounded-lg font-bold"
                            style={{ backgroundColor: "#F0FFF4", color: "#1A6E3A" }}>
                            {activeCases.length} نشطة
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Client Cases Preview */}
                  {clientCases.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: "#F2F4F7" }}>
                      {clientCases.slice(0, 2).map(c => (
                        <button key={c.id} onClick={() => navigate(`/cases/${c.id}`)}
                          className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-right"
                          style={{ backgroundColor: "#F7F8FA" }}>
                          <span className="text-xs truncate" style={{ color: "#101828" }}>{c.title}</span>
                          <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />
                        </button>
                      ))}
                      {clientCases.length > 2 && (
                        <p className="text-[10px] text-center" style={{ color: "#9CA3AF" }}>
                          + {clientCases.length - 2} قضية أخرى
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    {cl.phone && (
                      <a href={`tel:${cl.phone}`}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: "#F0FFF4", color: "#1A6E3A" }}>
                        <Phone className="w-3.5 h-3.5" /> اتصال
                      </a>
                    )}
                    <button onClick={() => navigate(`/client-profile`)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
                      <User className="w-3.5 h-3.5" /> البروفايل
                    </button>
                  </div>
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
            <NewClientForm onClose={() => setShowForm(false)} onSave={loadAll} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}