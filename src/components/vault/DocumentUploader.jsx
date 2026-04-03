import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, Lock, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";

const CATEGORIES = [
  { value: "contract", label: "عقد" },
  { value: "court_order", label: "أمر محكمة" },
  { value: "power_of_attorney", label: "توكيل" },
  { value: "evidence", label: "دليل" },
  { value: "correspondence", label: "مراسلة" },
  { value: "invoice", label: "فاتورة" },
  { value: "other", label: "أخرى" },
];

export default function DocumentUploader({ caseId, caseTitle, cases = [], uploadedBy, onSuccess, onClose, isLawyer = false }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [sharedWithClient, setSharedWithClient] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || "");
  const [selectedCaseTitle, setSelectedCaseTitle] = useState(caseTitle || "");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleCaseChange = (id) => {
    const c = cases.find(x => x.id === id);
    setSelectedCaseId(id);
    setSelectedCaseTitle(c?.title || "");
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const ext = file.name.split(".").pop().toLowerCase();
      const fileType = ["jpg","jpeg","png","gif","webp"].includes(ext) ? "image" : ext === "pdf" ? "pdf" : ext === "docx" || ext === "doc" ? "docx" : ext;

      await base44.entities.CaseDocument.create({
        case_id: selectedCaseId,
        case_title: selectedCaseTitle,
        name: file.name,
        file_url,
        file_type: fileType,
        file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        category,
        description,
        uploaded_by: uploadedBy || "محامٍ",
        is_confidential: isConfidential,
        shared_with_client: isLawyer ? sharedWithClient : true,
        status: isLawyer ? "approved" : "pending_review",
      });

      // Notify the other party
      const notifTitle = isLawyer
        ? (sharedWithClient ? `📄 مستند جديد مشارك معك` : `📄 مستند جديد في القضية`)
        : `📄 مستند جديد من الموكل`;
      const notifBody = isLawyer
        ? `تم رفع "${file.name}" في ${selectedCaseTitle || "القضية"}`
        : `رفع ${uploadedBy} مستنداً جديداً: "${file.name}"`;

      await base44.entities.Notification.create({
        user_id: isLawyer && sharedWithClient ? (selectedCaseTitle || "client") : "admin",
        title: notifTitle,
        body: notifBody,
        type: "document_required",
        related_id: selectedCaseId,
        related_type: "Case",
        action_url: isLawyer ? "/vault" : "/vault",
        is_read: false,
      }).catch(() => {});

      setDone(true);
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 1500);
    } catch (err) {
      setError(err.message || "فشل رفع الملف");
    } finally {
      setUploading(false);
    }
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
        <h3 className="text-base font-bold" style={{ color: TEXT }}>رفع مستند جديد</h3>
        <button onClick={onClose}><X className="w-5 h-5" style={{ color: TEXT_SEC }} /></button>
      </div>

      <div className="space-y-4">
        {/* Drop zone */}
        <label
          className="block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragging ? PRIMARY : "#D4E4F7", backgroundColor: isDragging ? "#EAF2FF" : "#F9FAFB" }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input ref={fileInputRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
          {file ? (
            <div className="space-y-1">
              <FileText className="w-8 h-8 mx-auto" style={{ color: PRIMARY }} />
              <p className="text-sm font-bold" style={{ color: TEXT }}>{file.name}</p>
              <p className="text-xs" style={{ color: TEXT_SEC }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button onClick={(e) => { e.preventDefault(); setFile(null); }}
                className="text-xs px-3 py-1 rounded-lg mt-1"
                style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>حذف</button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: PRIMARY }} />
              <p className="text-sm font-semibold" style={{ color: TEXT }}>اسحب الملف أو انقر للاختيار</p>
              <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>PDF, Word, صور</p>
              <button onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white inline-block"
                style={{ backgroundColor: PRIMARY }}>
                اختر ملف
              </button>
            </>
          )}
        </label>

        {/* Case selector (if no caseId passed) */}
        {!caseId && cases.length > 0 && (
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: TEXT_SEC }}>القضية المرتبطة</label>
            <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              value={selectedCaseId} onChange={e => handleCaseChange(e.target.value)}>
              <option value="">— اختر قضية —</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}

        {/* Category pills */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: TEXT_SEC }}>التصنيف</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: category === cat.value ? PRIMARY : "white",
                  color: category === cat.value ? "white" : TEXT_SEC,
                  borderColor: category === cat.value ? PRIMARY : "#E7ECF3",
                }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none"
          style={{ borderColor: "#E7ECF3" }}
          placeholder="وصف المستند (اختياري)..."
          value={description} onChange={e => setDescription(e.target.value)} />

        {/* Toggles */}
        <div className="space-y-2">
          {/* Confidential */}
          <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E7ECF3", backgroundColor: "#F9FAFB" }}>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" style={{ color: "#8A5A00" }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: TEXT }}>سري</p>
                <p className="text-[10px]" style={{ color: TEXT_SEC }}>للاطلاع الداخلي فقط</p>
              </div>
            </div>
            <button onClick={() => setIsConfidential(v => !v)}
              className="w-11 h-6 rounded-full transition-all flex items-center px-0.5"
              style={{ backgroundColor: isConfidential ? "#8A5A00" : "#E7ECF3" }}>
              <motion.div animate={{ x: isConfidential ? 20 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-5 h-5 bg-white rounded-full shadow" />
            </button>
          </div>

          {/* Share with client (lawyer only) */}
          {isLawyer && (
            <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#E7ECF3", backgroundColor: "#F9FAFB" }}>
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4" style={{ color: PRIMARY }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: TEXT }}>مشاركة مع الموكل</p>
                  <p className="text-[10px]" style={{ color: TEXT_SEC }}>يظهر في ملفات الموكل</p>
                </div>
              </div>
              <button onClick={() => setSharedWithClient(v => !v)}
                className="w-11 h-6 rounded-full transition-all flex items-center px-0.5"
                style={{ backgroundColor: sharedWithClient ? PRIMARY : "#E7ECF3" }}>
                <motion.div animate={{ x: sharedWithClient ? 20 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-5 h-5 bg-white rounded-full shadow" />
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FEE2E2" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
            <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleUpload}
          disabled={!file || uploading || done}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: done ? "#10B981" : PRIMARY }}>
          {done ? (
            <><CheckCircle className="w-4 h-4" /> تم الرفع بنجاح</>
          ) : uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الرفع...</>
          ) : (
            <><Upload className="w-4 h-4" /> رفع المستند</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}