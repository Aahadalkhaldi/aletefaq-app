import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileUp, Send, Loader2, AlertCircle, X } from "lucide-react";
import { SignatureRequest } from '@/api/entities';

export default function LawyerSignatureUpload({ caseId, caseTitle, clientId, clientName, onSuccess }) {
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocumentFile(file);
    setDocumentPreview(file.name);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!documentFile) {
      setError("يرجى اختيار ملف المستند");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload document
      const uploadResponse = await base44.integrations.Core.UploadFile({
        file: documentFile,
      });

      // Create signature request
      await SignatureRequest.create({
        case_id: caseId,
        case_title: caseTitle,
        client_id: clientId,
        client_name: clientName,
        document_name: documentFile.name,
        document_url: uploadResponse.file_url,
        status: "pending",
        notes: notes.trim() || null,
      });

      // Reset form
      setDocumentFile(null);
      setDocumentPreview(null);
      setNotes("");

      onSuccess?.();
    } catch (err) {
      console.error("خطأ:", err);
      setError("فشل إرسال المستند. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border shadow-card overflow-hidden"
      style={{ borderColor: "#E7ECF3" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#EEF2F7" }}>
        <p className="text-sm font-bold" style={{ color: "#101828" }}>إرسال مستند للتوقيع</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Document Upload */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#101828" }}>المستند *</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all"
            style={{
              borderColor: documentFile ? "#123E7C" : "#D4E4F7",
              backgroundColor: documentFile ? "#EAF2FF" : "white",
            }}
          >
            <FileUp className="w-6 h-6" style={{ color: "#123E7C" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#123E7C" }}>
                {documentPreview || "اختر ملف المستند"}
              </p>
              {!documentPreview && (
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>PDF أو Word</p>
              )}
            </div>
            {documentFile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDocumentFile(null);
                  setDocumentPreview(null);
                }}
                className="absolute top-2 right-2"
              >
                <X className="w-4 h-4" style={{ color: "#B42318" }} />
              </button>
            )}
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#101828" }}>ملاحظات (اختياري)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثلاً: يرجى التوقيع قبل الجلسة القادمة..."
            rows={3}
            className="w-full rounded-xl border p-3 text-sm outline-none resize-none"
            style={{ borderColor: "#E7ECF3", color: "#101828" }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FDECEC" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#B42318" }} />
            <p className="text-xs" style={{ color: "#B42318" }}>{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading || !documentFile}
          className="w-full h-12 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جارٍ الإرسال...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              إرسال طلب التوقيع
            </>
          )}
        </motion.button>

        <p className="text-xs text-center" style={{ color: "#6B7280" }}>
          سيتم إخطار العميل برسالة لمراجعة وتوقيع المستند
        </p>
      </div>
    </motion.div>
  );
}