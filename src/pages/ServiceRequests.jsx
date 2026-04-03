import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Plus, ChevronLeft, Clock, CheckCircle, AlertCircle, Building } from "lucide-react";
import GlassIcon from "../components/ui/GlassIcon";
import StatusChip from "../components/ui/StatusChip";

const statusMap = {
  submitted: { label: "مقدم", variant: "pending" },
  under_review: { label: "قيد المراجعة", variant: "pending" },
  in_progress: { label: "جارٍ التنفيذ", variant: "active" },
  pending_docs: { label: "بانتظار مستندات", variant: "pending" },
  completed: { label: "مكتمل", variant: "active" },
  rejected: { label: "مرفوض", variant: "urgent" },
  cancelled: { label: "ملغي", variant: "closed" },
};

const demoRequests = [
  { id: "sr1", request_number: "SR-2026-001", title: "طلب إصدار أمر أداء", court_name: "المحكمة الابتدائية", status: "in_progress", priority: "urgent", created_date: "2026-03-20" },
  { id: "sr2", request_number: "SR-2026-002", title: "طلب تأجيل الجلسة", court_name: "محكمة الاستئناف", status: "submitted", priority: "normal", created_date: "2026-03-25" },
  { id: "sr3", request_number: "SR-2025-089", title: "طعن بالاستئناف", court_name: "محكمة الاستئناف", status: "completed", priority: "urgent", created_date: "2025-12-10" },
];

export default function ServiceRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("الكل");

  const filters = ["الكل", "جارية", "مكتملة"];

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ServiceRequest.list("-created_date", 30);
      setRequests(data.length > 0 ? data : demoRequests);
    } catch {
      setRequests(demoRequests);
    } finally {
      setLoading(false);
    }
  };

  const filtered = requests.filter(r => {
    if (activeFilter === "الكل") return true;
    if (activeFilter === "جارية") return ["submitted", "under_review", "in_progress", "pending_docs"].includes(r.status);
    if (activeFilter === "مكتملة") return ["completed", "rejected", "cancelled"].includes(r.status);
    return true;
  });

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#101828" }}>الخدمات القضائية</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>طلباتك وخدماتك القضائية</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/courts")}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            style={{ backgroundColor: "#123E7C", color: "white" }}
          >
            <Plus className="w-3.5 h-3.5" />
            طلب جديد
          </motion.button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeFilter === f ? "#123E7C" : "#F2F4F7",
                color: activeFilter === f ? "white" : "#6B7280",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Courts quick access */}
      <div className="px-5 pt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/courts")}
          className="w-full bg-white rounded-2xl p-4 border shadow-card flex items-center gap-3"
          style={{ borderColor: "#D4E4F7", backgroundColor: "#F3F7FD" }}
        >
          <GlassIcon icon={Building} index={0} size="sm" />
          <div className="flex-1 text-right">
            <p className="text-sm font-bold" style={{ color: "#0D2F5F" }}>المحاكم في قطر</p>
            <p className="text-xs" style={{ color: "#6B7280" }}>استعرض المحاكم وقدّم طلباتك</p>
          </div>
          <ChevronLeft className="w-4 h-4" style={{ color: "#123E7C" }} />
        </motion.button>
      </div>

      {/* Requests List */}
      <div className="px-5 pt-4 space-y-3">
        <p className="text-sm font-bold" style={{ color: "#101828" }}>طلباتي</p>
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-24 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: "#E7ECF3" }} />
            <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد طلبات</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl p-4 border shadow-card"
                style={{ borderColor: "#E7ECF3" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs" style={{ color: "#6B7280" }}>{req.request_number}</span>
                      {req.priority === "urgent" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>عاجل</span>
                      )}
                    </div>
                    <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>{req.title}</p>
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#6B7280" }}>
                      <Building className="w-3 h-3" />
                      {req.court_name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusChip label={statusMap[req.status]?.label || req.status} variant={statusMap[req.status]?.variant || "pending"} />
                      <span className="text-xs" style={{ color: "#6B7280" }}>
                        {new Date(req.created_date).toLocaleDateString("ar-QA")}
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: "#6B7280" }} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}