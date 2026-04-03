import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Lock, FolderOpen, CalendarDays, Upload, Plus, X, CheckCircle, XCircle, Filter } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DocumentCard from "@/components/vault/DocumentCard";
import DocumentUploader from "@/components/vault/DocumentUploader";

const CATEGORY_CONFIG = {
  contract:          { label: "عقد" },
  court_order:       { label: "أمر محكمة" },
  power_of_attorney: { label: "توكيل" },
  evidence:          { label: "دليل" },
  correspondence:    { label: "مراسلة" },
  invoice:           { label: "فاتورة" },
  other:             { label: "أخرى" },
};

function groupByCase(docs) {
  const groups = {};
  docs.forEach(doc => {
    const key = doc.case_title || "غير مرتبطة بقضية";
    if (!groups[key]) groups[key] = [];
    groups[key].push(doc);
  });
  return Object.entries(groups);
}

export default function Vault() {
  const [docs, setDocs] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("month"); // month | case
  const [showUploader, setShowUploader] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().catch(() => null).then(u => setUser(u));
    loadAll();
    const unsub = base44.entities.CaseDocument.subscribe(e => {
      if (["create","update","delete"].includes(e.type)) loadAll();
    });
    return unsub;
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [d, c] = await Promise.all([
      base44.entities.CaseDocument.list("-created_date", 200).catch(() => []),
      base44.entities.Case.list("-updated_date", 100).catch(() => []),
    ]);
    setDocs(d);
    setCases(c);
    setLoading(false);
  };

  const handleDelete = async (doc) => {
    if (!confirm(`حذف "${doc.name}"؟`)) return;
    await base44.entities.CaseDocument.delete(doc.id);
    loadAll();
  };

  const handleApprove = async (doc) => {
    await base44.entities.CaseDocument.update(doc.id, { status: "approved" });
    loadAll();
  };

  const handleReject = async (doc) => {
    await base44.entities.CaseDocument.update(doc.id, { status: "rejected" });
    loadAll();
  };

  const pendingCount = docs.filter(d => d.status === "pending_review").length;

  const filtered = docs.filter(d => {
    const matchSearch = !search || d.name?.includes(search) || d.description?.includes(search) || d.case_title?.includes(search);
    const matchCat = activeFilter === "all" || d.category === activeFilter;
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const groups = groupBy === "case"
    ? groupByCase(filtered)
    : (() => {
        const g = {};
        filtered.forEach(doc => {
          const date = doc.created_date ? new Date(doc.created_date) : null;
          const key = date ? date.toLocaleDateString("ar-QA", { year: "numeric", month: "long" }) : "غير محدد";
          if (!g[key]) g[key] = [];
          g[key].push(doc);
        });
        return Object.entries(g);
      })();

  const stats = {
    total: docs.length,
    pending: pendingCount,
    shared: docs.filter(d => d.shared_with_client).length,
  };

  return (
    <div className="min-h-screen pb-28" dir="rtl"
      style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, #123E7C, #1E4E95)" }}>
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#101828" }}>خزانة المستندات</h1>
              <p className="text-xs" style={{ color: "#6B7280" }}>إدارة جميع الملفات القانونية</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowUploader(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)", boxShadow: "0 4px 12px rgba(18,62,124,0.3)" }}>
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border" style={{ backgroundColor: "#F7F8FA", borderColor: "#E7ECF3" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#9CA3AF" }} />
          <input type="text" placeholder="ابحث في المستندات..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-right" style={{ color: "#101828" }} />
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">

        {/* Pending banner */}
        {pendingCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-3 flex items-center gap-3 border"
            style={{ backgroundColor: "#FFF4E5", borderColor: "#FDE68A" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F59E0B" }}>
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: "#8A5A00" }}>{pendingCount} مستند يتطلب مراجعتك</p>
              <p className="text-[10px]" style={{ color: "#92400E" }}>من الموكلين بانتظار الاعتماد</p>
            </div>
            <button onClick={() => setStatusFilter("pending_review")}
              className="text-xs font-bold px-3 py-1 rounded-lg"
              style={{ backgroundColor: "#F59E0B", color: "white" }}>عرض</button>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "إجمالي", value: stats.total, icon: FolderOpen, color: "#123E7C", bg: "#EAF2FF" },
            { label: "قيد المراجعة", value: stats.pending, icon: CalendarDays, color: "#8A5A00", bg: "#FFF4E5" },
            { label: "مشارك", value: stats.shared, icon: Upload, color: "#065F46", bg: "#ECFDF5" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl p-3 border text-center" style={{ borderColor: "#E7ECF3" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: s.bg }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <p className="text-lg font-bold" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
                <p className="text-[10px]" style={{ color: "#6B7280" }}>{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2">
          {/* Group toggle */}
          <button onClick={() => setGroupBy(g => g === "month" ? "case" : "month")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0"
            style={{ borderColor: "#E7ECF3", backgroundColor: "white", color: "#6B7280" }}>
            <Filter className="w-3 h-3" />
            {groupBy === "month" ? "حسب القضية" : "حسب الشهر"}
          </button>

          {/* Status filter */}
          {statusFilter !== "all" && (
            <button onClick={() => setStatusFilter("all")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
              <X className="w-3 h-3" /> إلغاء الفلتر
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {["all", ...Object.keys(CATEGORY_CONFIG)].map(cat => (
            <button key={cat} onClick={() => setActiveFilter(cat)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeFilter === cat ? "#123E7C" : "rgba(255,255,255,0.8)",
                color: activeFilter === cat ? "white" : "#6B7280",
                border: `1px solid ${activeFilter === cat ? "transparent" : "#E7ECF3"}`,
              }}>
              {cat === "all" ? "الكل" : CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>

        {/* Upload button */}
        <button onClick={() => setShowUploader(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold transition-all"
          style={{ borderColor: "#D4E4F7", color: "#123E7C" }}>
          <Upload className="w-4 h-4" /> رفع مستند جديد
        </button>

        {/* Document list */}
        {loading ? (
          <div className="text-center py-14">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: "#123E7C" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm font-semibold" style={{ color: "#101828" }}>لا توجد مستندات</p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {groups.map(([group, groupDocs]) => (
              <div key={group}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#123E7C" }} />
                    <span className="text-xs font-bold" style={{ color: "#123E7C" }}>{group}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
                      {groupDocs.length}
                    </span>
                  </div>
                  <div className="flex-1 h-px" style={{ backgroundColor: "#E7ECF3" }} />
                </div>

                <div className="relative">
                  <div className="absolute right-[18px] top-0 bottom-0 w-0.5" style={{ backgroundColor: "#E7ECF3" }} />
                  <div className="space-y-3 pr-10">
                    {groupDocs.map((doc, i) => (
                      <div key={doc.id || i}>
                        <DocumentCard doc={doc} index={i} onDelete={handleDelete} showStatus />
                        {/* Quick approve/reject for pending */}
                        {doc.status === "pending_review" && (
                          <div className="flex gap-2 mt-1.5 pr-1">
                            <button onClick={() => handleApprove(doc)}
                              className="flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                              style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
                              <CheckCircle className="w-3.5 h-3.5" /> اعتماد
                            </button>
                            <button onClick={() => handleReject(doc)}
                              className="flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                              style={{ backgroundColor: "#FEF2F2", color: "#B42318" }}>
                              <XCircle className="w-3.5 h-3.5" /> رفض
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploader Sheet */}
      <AnimatePresence>
        {showUploader && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowUploader(false)} />
            <DocumentUploader
              cases={cases}
              uploadedBy={user?.full_name || "محامٍ"}
              isLawyer={true}
              onSuccess={loadAll}
              onClose={() => setShowUploader(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}