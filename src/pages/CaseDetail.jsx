import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Case, CaseDocument, CaseTask, Hearing, Party } from '@/api/entities';
import {
  ArrowRight, Scale, Calendar, Clock, FileText, Users,
  Plus, X, Loader2, ChevronLeft, CheckCircle, Edit2,
  Paperclip, MessageSquare, AlertCircle, Trash2, Sparkles
} from "lucide-react";
import StatusChip from "../components/ui/StatusChip";
import CaseAIAssistant from "@/components/cases/CaseAIAssistant";

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

const TABS = ["التفاصيل", "الجلسات", "المهام", "المستندات", "الأطراف", "المساعد الذكي"];

function TabContent({ label, caseId, caseData }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [label, caseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (label === "الجلسات") {
        const d = await Hearing.filter({ case_id: caseId }, "-date", 50);
        setData(d);
      } else if (label === "المهام") {
        const d = await CaseTask.filter({ case_id: caseId }, "-created_date", 50);
        setData(d);
      } else if (label === "المستندات") {
        const d = await CaseDocument.filter({ case_id: caseId }, "-created_date", 50);
        setData(d);
      } else if (label === "الأطراف") {
        const d = await Party.list("-created_date", 100);
        setData(d.filter(p => p.case_ids && p.case_ids.includes(caseId)));
      }
    } catch (e) {
      setData([]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title && !form.date && !form.name) return;
    setSaving(true);
    try {
      if (label === "الجلسات") {
        await Hearing.create({ ...form, case_id: caseId, case_title: caseData?.title, status: "scheduled" });
      } else if (label === "المهام") {
        await CaseTask.create({ ...form, case_id: caseId, case_title: caseData?.title, status: "pending" });
      }
      setShowForm(false);
      setForm({});
      loadData();
    } catch (e) {}
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#123E7C" }} />
    </div>
  );

  if (label === "التفاصيل") return null; // handled by parent

  return (
    <div className="space-y-3">
      {(label === "الجلسات" || label === "المهام") && (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ borderColor: "#D4E4F7", color: "#123E7C" }}>
          <Plus className="w-4 h-4" />
          {label === "الجلسات" ? "إضافة جلسة" : "إضافة مهمة"}
        </button>
      )}

      {data.length === 0 && (
        <div className="text-center py-10">
          <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد بيانات</p>
        </div>
      )}

      {label === "الجلسات" && data.map((h, i) => (
        <motion.div key={h.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold" style={{ color: "#101828" }}>{h.court_name}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: h.status === "completed" ? "#F0FFF4" : "#EAF2FF", color: h.status === "completed" ? "#1A6E3A" : "#123E7C" }}>
              {h.status === "completed" ? "منتهية" : h.status === "postponed" ? "مؤجلة" : "مجدولة"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#6B7280" }}>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{h.date ? new Date(h.date).toLocaleDateString("ar-QA") : "—"}</span>
            {h.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{h.time}</span>}
          </div>
          {h.notes && <p className="text-xs mt-2 p-2 rounded-lg" style={{ backgroundColor: "#F3F7FD", color: "#6B7280" }}>{h.notes}</p>}
        </motion.div>
      ))}

      {label === "المهام" && data.map((t, i) => (
        <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="bg-white rounded-2xl border p-4 flex items-start gap-3" style={{ borderColor: "#E7ECF3" }}>
          <button onClick={async () => {
            await CaseTask.update(t.id, { status: t.status === "completed" ? "pending" : "completed" });
            loadData();
          }} className="mt-0.5 flex-shrink-0">
            <CheckCircle className="w-5 h-5" style={{ color: t.status === "completed" ? "#1A6E3A" : "#D1D5DB" }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#101828", textDecoration: t.status === "completed" ? "line-through" : "none" }}>{t.title}</p>
            {t.due_date && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>الموعد: {new Date(t.due_date).toLocaleDateString("ar-QA")}</p>}
            {t.assignee_name && <p className="text-xs" style={{ color: "#6B7280" }}>المكلف: {t.assignee_name}</p>}
          </div>
          {t.priority === "urgent" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>عاجل</span>}
        </motion.div>
      ))}

      {label === "المستندات" && data.map((doc, i) => (
        <motion.div key={doc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E7ECF3" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
            <FileText className="w-5 h-5" style={{ color: "#123E7C" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#101828" }}>{doc.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{doc.category || "مستند"} • {doc.file_size || ""}</p>
          </div>
          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0"
              style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>عرض</a>
          )}
        </motion.div>
      ))}

      {label === "الأطراف" && data.map((party, i) => (
        <motion.div key={party.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E7ECF3" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
            <Users className="w-5 h-5" style={{ color: "#6366F1" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#101828" }}>{party.full_name}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
              {party.type === "opponent" ? "خصم" : party.type === "client" ? "موكل" : party.type === "witness" ? "شاهد" : party.type}
            </p>
            {party.phone && <p className="text-xs" style={{ color: "#6B7280" }}>{party.phone}</p>}
          </div>
        </motion.div>
      ))}

      {/* Quick Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowForm(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-5 pb-10"
              style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold" style={{ color: "#101828" }}>
                  {label === "الجلسات" ? "جلسة جديدة" : "مهمة جديدة"}
                </h3>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
              </div>
              <div className="space-y-3">
                {label === "الجلسات" && (
                  <>
                    <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                      placeholder="اسم المحكمة *" value={form.court_name || ""} onChange={e => setForm(f => ({ ...f, court_name: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                        value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                      <input type="time" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                        value={form.time || ""} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                    </div>
                    <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
                      placeholder="ملاحظات..." value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </>
                )}
                {label === "المهام" && (
                  <>
                    <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                      placeholder="عنوان المهمة *" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                        value={form.due_date || ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                      <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                        value={form.priority || "medium"} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                        <option value="low">عادية</option>
                        <option value="medium">متوسطة</option>
                        <option value="high">عالية</option>
                        <option value="urgent">عاجلة</option>
                      </select>
                    </div>
                    <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                      placeholder="المكلف (اختياري)" value={form.assignee_name || ""} onChange={e => setForm(f => ({ ...f, assignee_name: e.target.value }))} />
                  </>
                )}
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
                  className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: "#123E7C" }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("التفاصيل");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiHearings, setAiHearings] = useState([]);
  const [aiTasks, setAiTasks] = useState([]);

  useEffect(() => { loadCase(); }, [id]);

  useEffect(() => {
    if (activeTab === "المساعد الذكي" && id) {
      Promise.all([
        Hearing.filter({ case_id: id }, "-date", 50).catch(() => []),
        CaseTask.filter({ case_id: id }, "-created_date", 50).catch(() => []),
      ]).then(([h, t]) => { setAiHearings(h); setAiTasks(t); });
    }
  }, [activeTab, id]);

  const loadCase = async () => {
    setLoading(true);
    try {
      const cases = await Case.filter({ id }, "-created_date", 1);
      if (cases.length > 0) {
        setCaseData(cases[0]);
        setEditForm(cases[0]);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await Case.update(id, editForm);
    setCaseData(editForm);
    setEditing(false);
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#123E7C" }} />
    </div>
  );

  if (!caseData) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <AlertCircle className="w-12 h-12" style={{ color: "#D1D5DB" }} />
      <p className="text-sm" style={{ color: "#6B7280" }}>لم يتم العثور على القضية</p>
      <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#123E7C" }}>رجوع</button>
    </div>
  );

  const st = statusMap[caseData.status] || { label: caseData.status, variant: "active" };

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F3F7FD" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b px-5 pt-4 pb-0" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F7F8FA" }}>
            <ArrowRight className="w-4 h-4" style={{ color: "#101828" }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: "#6B7280" }}>{typeMap[caseData.type] || caseData.type}{caseData.case_number ? ` • #${caseData.case_number}` : ""}</p>
            <h1 className="text-base font-bold truncate" style={{ color: "#101828" }}>{caseData.title}</h1>
          </div>
          <button onClick={() => setEditing(true)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
            <Edit2 className="w-4 h-4" style={{ color: "#123E7C" }} />
          </button>
        </div>

        {/* Status + Priority row */}
        <div className="flex items-center gap-2 mb-3">
          <StatusChip label={st.label} variant={st.variant} />
          {caseData.priority === "urgent" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>عاجل</span>
          )}
          {caseData.court_name && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F2F4F7", color: "#526071" }}>{caseData.court_name}</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all"
              style={{
                borderColor: activeTab === tab ? (tab === "المساعد الذكي" ? "#C8A96B" : "#123E7C") : "transparent",
                color: activeTab === tab ? (tab === "المساعد الذكي" ? "#C8A96B" : "#123E7C") : "#6B7280",
              }}>
              {tab === "المساعد الذكي" && <Sparkles className="w-3 h-3" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {activeTab === "التفاصيل" ? (
          <div className="space-y-3">
            {/* Client Info */}
            <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#6B7280" }}>معلومات الموكل</p>
              <p className="text-sm font-bold" style={{ color: "#101828" }}>{caseData.client_name}</p>
              {caseData.lead_lawyer_name && <p className="text-xs mt-1" style={{ color: "#6B7280" }}>المحامي المسؤول: {caseData.lead_lawyer_name}</p>}
            </div>

            {/* Case Info */}
            <div className="bg-white rounded-2xl border p-4 space-y-3" style={{ borderColor: "#E7ECF3" }}>
              <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>تفاصيل القضية</p>
              {caseData.court_type && (
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "#6B7280" }}>نوع المحكمة</span>
                  <span className="text-xs font-semibold" style={{ color: "#101828" }}>{caseData.court_type}</span>
                </div>
              )}
              {caseData.next_hearing_date && (
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "#6B7280" }}>الجلسة القادمة</span>
                  <span className="text-xs font-semibold" style={{ color: "#123E7C" }}>{new Date(caseData.next_hearing_date).toLocaleDateString("ar-QA")}</span>
                </div>
              )}
              {caseData.parties && (
                <div>
                  <span className="text-xs" style={{ color: "#6B7280" }}>أطراف النزاع</span>
                  <p className="text-xs mt-1" style={{ color: "#101828" }}>{caseData.parties}</p>
                </div>
              )}
              {(caseData.amount_under_enforcement != null) && (
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "#6B7280" }}>المبلغ محل التنفيذ</span>
                  <span className="text-xs font-semibold" style={{ color: "#101828" }}>{caseData.amount_under_enforcement?.toLocaleString("ar")} ر.ق</span>
                </div>
              )}
              {(caseData.amount_recovered != null) && (
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "#6B7280" }}>المبلغ المحصل</span>
                  <span className="text-xs font-semibold" style={{ color: "#1A6E3A" }}>{caseData.amount_recovered?.toLocaleString("ar")} ر.ق</span>
                </div>
              )}
            </div>

            {/* Description */}
            {caseData.description && (
              <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#6B7280" }}>وصف القضية</p>
                <p className="text-sm leading-relaxed" style={{ color: "#101828" }}>{caseData.description}</p>
              </div>
            )}

            {/* Notes */}
            {caseData.notes && (
              <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#6B7280" }}>ملاحظات داخلية</p>
                <p className="text-sm leading-relaxed" style={{ color: "#101828" }}>{caseData.notes}</p>
              </div>
            )}

            {/* Tags */}
            {caseData.tags && caseData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {caseData.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#F2F4F7", color: "#526071" }}>{tag}</span>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate("/finance")}
                className="py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2"
                style={{ borderColor: "#E7ECF3", backgroundColor: "white", color: "#123E7C" }}>
                <FileText className="w-4 h-4" /> الفواتير
              </button>
              <button onClick={() => navigate("/messages")}
                className="py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2"
                style={{ borderColor: "#E7ECF3", backgroundColor: "white", color: "#123E7C" }}>
                <MessageSquare className="w-4 h-4" /> الرسائل
              </button>
              <button onClick={() => navigate("/signature-requests")}
                className="col-span-2 py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2"
                style={{ borderColor: "#EDE9FE", backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
                <Paperclip className="w-4 h-4" /> إرسال مستند للتوقيع
              </button>
            </div>
          </div>
        ) : activeTab === "المساعد الذكي" ? (
          <CaseAIAssistant caseData={caseData} hearings={aiHearings} tasks={aiTasks} />
        ) : (
          <TabContent label={activeTab} caseId={id} caseData={caseData} />
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setEditing(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto"
              style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold" style={{ color: "#101828" }}>تعديل القضية</h3>
                <button onClick={() => setEditing(false)}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
              </div>
              <div className="space-y-3">
                <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                  placeholder="عنوان القضية" value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                  value={editForm.status || "new"} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="new">جديدة</option>
                  <option value="in_progress">نشطة</option>
                  <option value="court">في المحكمة</option>
                  <option value="waiting_docs">بانتظار مستندات</option>
                  <option value="closed">مغلقة</option>
                  <option value="archived">مؤرشفة</option>
                </select>
                <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                  placeholder="المحكمة" value={editForm.court_name || ""} onChange={e => setEditForm(f => ({ ...f, court_name: e.target.value }))} />
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>تاريخ الجلسة القادمة</label>
                  <input type="date" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
                    value={editForm.next_hearing_date || ""} onChange={e => setEditForm(f => ({ ...f, next_hearing_date: e.target.value }))} />
                </div>
                <textarea rows={3} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
                  placeholder="وصف القضية..." value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
                  placeholder="ملاحظات داخلية..." value={editForm.notes || ""} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
                  className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: "#123E7C" }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}