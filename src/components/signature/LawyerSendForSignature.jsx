import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  PenLine, Upload, X, Loader2, Plus, FileText,
  CheckCircle, Clock, AlertCircle, Eye, Download, Trash2, Send
} from "lucide-react";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";

const STATUS_CONFIG = {
  pending: { label: "بانتظار التوقيع", bg: "#FFF4E5", color: "#8A5A00", icon: Clock },
  signed: { label: "موقّع", bg: "#F0FFF4", color: "#1A6E3A", icon: CheckCircle },
  cancelled: { label: "ملغي", bg: "#FDECEC", color: "#B42318", icon: AlertCircle },
};

function SendSignatureModal({ cases, onClose, onSent }) {
  const [form, setForm] = useState({ case_id: "", client_name: "", document_name: "", notes: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleCaseSelect = (caseId) => {
    const c = cases.find(x => x.id === caseId);
    setForm(f => ({
      ...f,
      case_id: caseId,
      case_title: c?.title || "",
      client_name: c?.client_name || "",
      client_id: c?.client_id || "",
    }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleSend = async () => {
    if (!form.document_name || !form.client_name || !file) {
      setError("يرجى ملء جميع الحقول المطلوبة ورفع الملف");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      await base44.entities.SignatureRequest.create({
        case_id: form.case_id,
        case_title: form.case_title || "",
        client_id: form.client_id || "",
        client_name: form.client_name,
        document_name: form.document_name,
        document_url: file_url,
        notes: form.notes,
        status: "pending",
      });

      // إشعار للموكل
      await base44.entities.Notification.create({
        user_id: form.client_id || "client",
        title: "طلب توقيع جديد",
        body: `يطلب منك توقيع مستند: ${form.document_name}`,
        type: "document_required",
        related_type: "SignatureRequest",
      }).catch(() => {});

      onSent();
      onClose();
    } catch (e) {
      setError("حدث خطأ أثناء الرفع. يرجى المحاولة مجدداً");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: TEXT }}>إرسال مستند للتوقيع</h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
        </div>

        <div className="space-y-4">
          {/* Case Select */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: TEXT_SEC }}>القضية (اختياري)</label>
            <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              value={form.case_id} onChange={e => handleCaseSelect(e.target.value)}>
              <option value="">— بدون قضية —</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.title} ({c.client_name})</option>)}
            </select>
          </div>

          {/* Client Name */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: TEXT_SEC }}>اسم الموكل *</label>
            <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              placeholder="اسم الموكل" value={form.client_name}
              onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
          </div>

          {/* Document Name */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: TEXT_SEC }}>اسم المستند *</label>
            <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              placeholder="مثال: عقد الوكالة القانونية" value={form.document_name}
              onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))} />
          </div>

          {/* File Upload */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: TEXT_SEC }}>رفع المستند (PDF أو صورة) *</label>
            {file ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "#D4E4F7", backgroundColor: "#F3F7FD" }}>
                <FileText className="w-5 h-5 flex-shrink-0" style={{ color: PRIMARY }} />
                <p className="text-sm flex-1 truncate" style={{ color: TEXT }}>{file.name}</p>
                <button onClick={() => setFile(null)}><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
              </div>
            ) : (
              <label className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                style={{ borderColor: "#D4E4F7", backgroundColor: "#F8FBFF" }}>
                <Upload className="w-6 h-6" style={{ color: PRIMARY }} />
                <span className="text-sm font-semibold" style={{ color: PRIMARY }}>اضغط لرفع الملف</span>
                <span className="text-xs" style={{ color: TEXT_SEC }}>PDF, JPG, PNG</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: TEXT_SEC }}>ملاحظات للموكل (اختياري)</label>
            <textarea rows={2} className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
              placeholder="تعليمات أو ملاحظات مرفقة مع طلب التوقيع..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#FDECEC" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#B42318" }} />
              <p className="text-xs" style={{ color: "#B42318" }}>{error}</p>
            </div>
          )}

          <motion.button whileTap={{ scale: 0.98 }} onClick={handleSend}
            disabled={uploading}
            className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: PRIMARY }}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {uploading ? "جارٍ الإرسال..." : "إرسال طلب التوقيع"}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

function SignatureRequestCard({ req, onDelete, onSaveToCase }) {
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveToCase = async () => {
    if (!req.case_id || !req.signature_url) return;
    setSaving(true);
    try {
      await onSaveToCase(req);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
          <FileText className="w-5 h-5" style={{ color: PRIMARY }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: TEXT }}>{req.document_name}</p>
              {req.case_title && <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{req.case_title}</p>}
              <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>الموكل: {req.client_name}</p>
            </div>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>

          {req.notes && (
            <p className="text-xs mt-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: "#F3F7FD", color: TEXT_SEC }}>
              {req.notes}
            </p>
          )}

          {req.signed_at && (
            <p className="text-xs mt-1.5" style={{ color: "#6B7280" }}>
              وُقِّع: {new Date(req.signed_at).toLocaleDateString("ar-QA")}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {req.document_url && (
              <a href={req.document_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "#EAF2FF", color: PRIMARY }}>
                <Eye className="w-3 h-3" /> عرض الأصل
              </a>
            )}
            {req.status === "signed" && req.signature_url && (
              <a href={req.signature_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "#F0FFF4", color: "#1A6E3A" }}>
                <Download className="w-3 h-3" /> التوقيع
              </a>
            )}
            {req.status === "signed" && req.case_id && !saved && (
              <button onClick={handleSaveToCase} disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#FFF4E5", color: "#8A5A00" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                حفظ في ملف القضية
              </button>
            )}
            {saved && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
                <CheckCircle className="w-3 h-3" /> محفوظ في القضية
              </span>
            )}
            <button onClick={() => onDelete(req.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold mr-auto"
              style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LawyerSendForSignature() {
  const [requests, setRequests] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAll();
    const unsub = base44.entities.SignatureRequest.subscribe(e => {
      if (["create", "update", "delete"].includes(e.type)) loadAll();
    });
    return unsub;
  }, []);

  const loadAll = async () => {
    const [reqs, c] = await Promise.all([
      base44.entities.SignatureRequest.list("-created_date", 100).catch(() => []),
      base44.entities.Case.filter({ status: "in_progress" }, "-updated_date", 100).catch(() => []),
    ]);
    setRequests(reqs);
    setCases(c);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("حذف طلب التوقيع؟")) return;
    await base44.entities.SignatureRequest.delete(id);
    loadAll();
  };

  const handleSaveToCase = async (req) => {
    // حفظ المستند الموقّع في ملف القضية كـ CaseDocument
    await base44.entities.CaseDocument.create({
      case_id: req.case_id,
      case_title: req.case_title || "",
      name: `${req.document_name} (موقّع)`,
      file_url: req.signature_url,
      file_type: "image",
      category: "contract",
      uploaded_by: "المحامي",
      description: `مستند موقّع إلكترونياً بتاريخ ${req.signed_at ? new Date(req.signed_at).toLocaleDateString("ar-QA") : ""}`,
      status: "approved",
      shared_with_client: true,
    });
  };

  const filtered = requests.filter(r => {
    if (filter === "pending") return r.status === "pending";
    if (filter === "signed") return r.status === "signed";
    return true;
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const signedCount = requests.filter(r => r.status === "signed").length;

  return (
    <div className="min-h-screen pb-28" dir="rtl"
      style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
              <PenLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: TEXT }}>التوقيعات الإلكترونية</h1>
              <p className="text-xs" style={{ color: TEXT_SEC }}>إرسال ومتابعة طلبات التوقيع</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: PRIMARY }}>
            <Plus className="w-4 h-4" /> إرسال
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border p-3 flex items-center gap-3" style={{ borderColor: "#E7ECF3" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF4E5" }}>
              <Clock className="w-4 h-4" style={{ color: "#8A5A00" }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#8A5A00" }}>{loading ? "—" : pendingCount}</p>
              <p className="text-xs" style={{ color: TEXT_SEC }}>بانتظار التوقيع</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-3 flex items-center gap-3" style={{ borderColor: "#E7ECF3" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F0FFF4" }}>
              <CheckCircle className="w-4 h-4" style={{ color: "#1A6E3A" }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#1A6E3A" }}>{loading ? "—" : signedCount}</p>
              <p className="text-xs" style={{ color: TEXT_SEC }}>موقّعة</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[{ key: "all", label: "الكل" }, { key: "pending", label: "بانتظار التوقيع" }, { key: "signed", label: "الموقّعة" }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ backgroundColor: filter === f.key ? PRIMARY : "white", color: filter === f.key ? "white" : TEXT_SEC, border: `1px solid ${filter === f.key ? PRIMARY : "#E7ECF3"}` }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: PRIMARY }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border" style={{ borderColor: "#E7ECF3" }}>
            <PenLine className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm font-semibold" style={{ color: TEXT_SEC }}>لا توجد طلبات توقيع</p>
            <button onClick={() => setShowModal(true)}
              className="mt-3 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: PRIMARY }}>
              إرسال أول طلب
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <SignatureRequestCard key={req.id} req={req} onDelete={handleDelete} onSaveToCase={handleSaveToCase} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <SendSignatureModal cases={cases} onClose={() => setShowModal(false)} onSent={loadAll} />
        )}
      </AnimatePresence>
    </div>
  );
}