import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Clock, Download, Eye, Loader2 } from "lucide-react";
import { SignatureRequest } from '@/api/entities';

export default function SignatureRequestList({ caseId, clientName }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    loadRequests();
    const unsub = SignatureRequest.subscribe((event) => {
      if (event.type === "update" && event.data?.case_id === caseId) {
        loadRequests();
      }
    });
    return unsub;
  }, [caseId, clientName]);

  const loadRequests = async () => {
    try {
      const reqs = await SignatureRequest.filter({
        case_id: caseId,
        client_name: clientName,
      }, "-created_date", 50);
      setRequests(reqs);
    } catch (error) {
      console.error("خطأ:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#123E7C" }} />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="text-xs text-center py-6" style={{ color: "#6B7280" }}>
        لا توجد طلبات توقيع لهذه القضية
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border p-3"
          style={{ borderColor: "#E7ECF3" }}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: req.status === "signed" ? "#F0FFF4" : "#FFF4E5" }}
            >
              {req.status === "signed" ? (
                <CheckCircle className="w-5 h-5" style={{ color: "#1A6E3A" }} />
              ) : (
                <Clock className="w-5 h-5" style={{ color: "#8A5A00" }} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>
                    {req.document_name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                    {req.status === "signed"
                      ? `موقع في ${new Date(req.signed_at).toLocaleDateString("ar")}`
                      : "قيد انتظار التوقيع"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {req.status === "signed" && req.signed_document_url && (
                    <a
                      href={req.signed_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ backgroundColor: "#F0FFF4" }}
                      title="تحميل"
                    >
                      <Download className="w-4 h-4" style={{ color: "#1A6E3A" }} />
                    </a>
                  )}
                  {req.signature_url && (
                    <button
                      onClick={() => setPreview(req.signature_url)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ backgroundColor: "#EAF2FF" }}
                      title="عرض التوقيع"
                    >
                      <Eye className="w-4 h-4" style={{ color: "#123E7C" }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setPreview(null)}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4"
          >
            <p className="text-sm font-bold mb-3" style={{ color: "#101828" }}>التوقيع الإلكتروني</p>
            <img
              src={preview}
              alt="التوقيع"
              className="w-full h-auto rounded-xl border"
              style={{ borderColor: "#E7ECF3" }}
            />
            <button
              onClick={() => setPreview(null)}
              className="w-full mt-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ backgroundColor: "#F7F8FA", color: "#101828" }}
            >
              إغلاق
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}