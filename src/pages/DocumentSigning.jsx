import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Clock, AlertCircle, Loader2, Download } from "lucide-react";
import ClientSigningViewNew from "@/components/signature/ClientSigningViewNew";
import { SignatureRequest } from '@/api/entities';

export default function DocumentSigning() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState(null);
  const [filter, setFilter] = useState("all"); // all | pending | signed

  useEffect(() => {
    loadRequests();
    const unsub = SignatureRequest.subscribe((event) => {
      if (["create", "update"].includes(event.type)) {
        loadRequests();
      }
    });
    return unsub;
  }, []);

  const loadRequests = async () => {
    try {
      const reqs = await SignatureRequest.list("-created_date", 100);
      setRequests(reqs);
      setLoading(false);
    } catch (error) {
      console.error("خطأ:", error);
      setLoading(false);
    }
  };

  const filtered = requests.filter(r => {
    if (filter === "pending") return r.status === "pending";
    if (filter === "signed") return r.status === "signed";
    return true;
  });

  if (activeRequest) {
    return (
      <ClientSigningViewNew
        request={activeRequest}
        onSigned={() => {
          loadRequests();
          setActiveRequest(null);
        }}
        onBack={() => setActiveRequest(null)}
      />
    );
  }

  const statusConfig = {
    pending: { label: "قيد الانتظار", icon: Clock, bg: "#FFF4E5", color: "#8A5A00" },
    signed: { label: "موقع", icon: CheckCircle, bg: "#F0FFF4", color: "#1A6E3A" },
    cancelled: { label: "ملغاة", icon: AlertCircle, bg: "#FDECEC", color: "#B42318" },
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#101828" }}>طلبات التوقيع</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>مراجعة وتوقيع المستندات والاتفاقيات</p>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          {[
            { key: "all", label: "الكل" },
            { key: "pending", label: "قيد الانتظار" },
            { key: "signed", label: "الموقعة" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: filter === f.key ? "#123E7C" : "white",
                color: filter === f.key ? "white" : "#6B7280",
                border: `1px solid ${filter === f.key ? "#123E7C" : "#E7ECF3"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="px-5 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "#123E7C" }} />
            <p className="text-sm mt-3" style={{ color: "#6B7280" }}>جارٍ التحميل...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border" style={{ borderColor: "#E7ECF3" }}>
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm font-medium" style={{ color: "#6B7280" }}>لا توجد طلبات توقيع</p>
          </div>
        ) : (
          filtered.map((req, i) => {
            const config = statusConfig[req.status] || statusConfig.pending;
            const Icon = config.icon;
            return (
              <motion.button
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => req.status === "pending" && setActiveRequest(req)}
                className="w-full bg-white rounded-2xl border p-4 text-right transition-all"
                style={{ borderColor: "#E7ECF3" }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
                    <FileText className="w-5 h-5" style={{ color: "#123E7C" }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>{req.document_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{req.case_title}</p>
                        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>العميل: {req.client_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {/* Status */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: config.bg, color: config.color }}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </div>

                        {/* Date */}
                        <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                          {new Date(req.created_date).toLocaleDateString("ar", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      {req.status === "pending" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRequest(req);
                          }}
                          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                          style={{ backgroundColor: "#123E7C", color: "white" }}
                        >
                          وقّع الآن
                        </button>
                      )}
                      {req.status === "signed" && req.signed_document_url && (
                        <a
                          href={req.signed_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                          style={{ backgroundColor: "#F0FFF4", color: "#1A6E3A", border: "1px solid #86EFAC" }}
                        >
                          <Download className="w-3 h-3" />
                          تحميل النسخة الموقعة
                        </a>
                      )}
                      {req.status === "signed" && req.signature_url && (
                        <a
                          href={req.signature_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                          style={{ backgroundColor: "#F3F7FD", color: "#123E7C" }}
                        >
                          عرض التوقيع
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}