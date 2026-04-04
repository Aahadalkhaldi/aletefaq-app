import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ServiceRequest } from '@/api/entities';
import { ClipboardList, Building, CheckCircle, Clock, XCircle, Loader2, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

const PRIORITY_CONFIG = {
  urgent:  { label: "عاجل جداً",  bar: "#DC2626", bg: "#FEF2F2", text: "#B42318" },
  high:    { label: "عاجل",       bar: "#F97316", bg: "#FFF7ED", text: "#C2410C" },
  normal:  { label: "عادي",       bar: "#EAB308", bg: "#FEFCE8", text: "#854D0E" },
  low:     { label: "غير عاجل",   bar: "#22C55E", bg: "#F0FFF4", text: "#15803D" },
};

const STATUS_CONFIG = {
  submitted:    { label: "جديد", bg: "#EAF2FF", color: "#123E7C" },
  under_review: { label: "قيد المراجعة", bg: "#FFF4E5", color: "#8A5A00" },
  in_progress:  { label: "جارٍ التنفيذ", bg: "#ECFDF5", color: "#065F46" },
  pending_docs: { label: "بانتظار مستندات", bg: "#FFF4E5", color: "#8A5A00" },
  completed:    { label: "مكتمل", bg: "#ECFDF5", color: "#065F46" },
  rejected:     { label: "مرفوض", bg: "#FEF2F2", color: "#B42318" },
  cancelled:    { label: "ملغي", bg: "#F2F4F7", color: "#6B7280" },
};

const STATUS_ACTIONS = [
  { value: "under_review", label: "قيد المراجعة" },
  { value: "in_progress", label: "جارٍ التنفيذ" },
  { value: "pending_docs", label: "بانتظار مستندات" },
  { value: "completed", label: "مكتمل" },
  { value: "rejected", label: "مرفوض" },
];

function RequestCard({ req, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.submitted;
  const pCfg = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.normal;
  const docs = req.form_data?.required_docs || [];

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    await ServiceRequest.update(req.id, { status: newStatus });
    onStatusChange();
    setUpdating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border shadow-card overflow-hidden"
      style={{ borderColor: req.status === "submitted" ? "#123E7C" : "#E7ECF3", borderWidth: req.status === "submitted" ? 2 : 1 }}
    >
      {/* Priority / New bar */}
      {req.status === "submitted" ? (
        <motion.div
          className="h-1.5 w-full"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ backgroundColor: "#DC2626" }}
        />
      ) : (
        <div className="h-1 w-full" style={{ backgroundColor: pCfg.bar }} />
      )}

      {/* New badge */}
      {req.status === "submitted" && (
        <div className="px-4 py-1.5 flex items-center justify-between" style={{ backgroundColor: "#FEF2F2" }}>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: pCfg.bg, color: pCfg.text }}>
            {pCfg.label}
          </span>
          <div className="flex items-center gap-1.5">
            <motion.span
              className="w-2 h-2 rounded-full"
              animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ backgroundColor: "#DC2626", display: "inline-block" }}
            />
            <p className="text-xs font-bold" style={{ color: "#B42318" }}>طلب جديد</p>
          </div>
        </div>
      )}
      {req.status !== "submitted" && (
        <div className="px-4 py-1 flex justify-end" style={{ backgroundColor: pCfg.bg }}>
          <span className="text-[10px] font-bold" style={{ color: pCfg.text }}>{pCfg.label}</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F2F4F7", color: "#6B7280" }}>
                {req.request_number}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            <p className="text-sm font-bold" style={{ color: "#101828" }}>{req.title}</p>
            <div className="flex items-center gap-1 mt-1">
              <Building className="w-3 h-3 flex-shrink-0" style={{ color: "#6B7280" }} />
              <p className="text-xs" style={{ color: "#6B7280" }}>{req.court_name}</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs" style={{ color: "#6B7280" }}>
                👤 {req.client_name || "عميل"}
              </p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                {req.created_date ? new Date(req.created_date).toLocaleDateString("ar-QA") : ""}
              </p>
            </div>
          </div>

          <button onClick={() => setExpanded(e => !e)}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#F7F8FA" }}>
            {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "#6B7280" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#6B7280" }} />}
          </button>
        </div>

        {/* Notes */}
        {req.notes && (
          <div className="mt-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#F7F8FA" }}>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              <MessageSquare className="w-3 h-3 inline ml-1" />
              {req.notes}
            </p>
          </div>
        )}

        {/* Expanded: Docs + Status Actions */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {/* Required docs */}
              {docs.length > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "#EEF2F7" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#101828" }}>المستندات المطلوبة من العميل:</p>
                  <div className="space-y-1">
                    {docs.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#123E7C" }} />
                        <p className="text-xs" style={{ color: "#6B7280" }}>{d}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status change */}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: "#EEF2F7" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#101828" }}>تغيير حالة الطلب:</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ACTIONS.map(action => (
                    <button
                      key={action.value}
                      onClick={() => handleStatus(action.value)}
                      disabled={updating || req.status === action.value}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                      style={{
                        backgroundColor: req.status === action.value ? STATUS_CONFIG[action.value].bg : "#F2F4F7",
                        color: req.status === action.value ? STATUS_CONFIG[action.value].color : "#6B7280",
                        border: req.status === action.value ? `1px solid ${STATUS_CONFIG[action.value].color}30` : "1px solid transparent",
                      }}
                    >
                      {updating ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function LawyerServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("new");

  useEffect(() => {
    loadRequests();
    const unsub = ServiceRequest.subscribe(e => {
      if (["create", "update"].includes(e.type)) loadRequests();
    });
    return unsub;
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await ServiceRequest.list("-created_date", 100).catch(() => []);
    setRequests(data);
    setLoading(false);
  };

  const filtered = requests.filter(r => {
    if (filter === "new") return r.status === "submitted";
    if (filter === "active") return ["under_review", "in_progress", "pending_docs"].includes(r.status);
    if (filter === "done") return ["completed", "rejected", "cancelled"].includes(r.status);
    return true;
  });

  const newCount = requests.filter(r => r.status === "submitted").length;

  return (
    <div className="min-h-screen pb-28" dir="rtl"
      style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "#101828" }}>طلبات العملاء</h1>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {newCount > 0 ? `${newCount} طلب جديد بانتظار المراجعة` : "جميع الطلبات القضائية"}
            </p>
          </div>
          {newCount > 0 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: "#B42318" }}>
              {newCount}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 pt-4">
        <div className="flex gap-2 mb-4">
          {[
            { key: "new", label: `جديدة (${newCount})` },
            { key: "active", label: "جارية" },
            { key: "done", label: "منتهية" },
            { key: "all", label: "الكل" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                backgroundColor: filter === tab.key ? "#123E7C" : "white",
                color: filter === tab.key ? "white" : "#6B7280",
                border: `1px solid ${filter === tab.key ? "#123E7C" : "#E7ECF3"}`,
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#123E7C" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد طلبات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <RequestCard key={req.id} req={req} onStatusChange={loadRequests} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}