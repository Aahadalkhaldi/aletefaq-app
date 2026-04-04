import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Lock, FolderOpen, Upload, Plus, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Compat";
import { Case, CaseDocument } from '@/api/entities';
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

export default function ClientVault() {
  const [docs, setDocs] = useState([]);
  const [cases, setCases] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all"); // all | mine | shared
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    base44.auth.me().catch(() => null).then(u => {
      setUser(u);
      loadAll(u);
    });
  }, []);

  const loadAll = async (u) => {
    setLoading(true);
    const [d, c] = await Promise.all([
      CaseDocument.list("-created_date", 200).catch(() => []),
      Case.list("-updated_date", 100).catch(() => []),
    ]);

    // Filter: show docs uploaded by user OR shared with client (approved)
    const clientName = u?.full_name;
    const filtered = d.filter(doc =>
      doc.uploaded_by === clientName ||
      (doc.shared_with_client === true && doc.status === "approved")
    );
    setDocs(filtered);

    // Cases linked to this client
    const clientCases = c.filter(c => c.client_name === clientName);
    setCases(clientCases);
    setLoading(false);
  };

  const myDocs = docs.filter(d => d.uploaded_by === user?.full_name);
  const sharedDocs = docs.filter(d => d.shared_with_client && d.uploaded_by !== user?.full_name);

  const baseDocs = activeTab === "mine" ? myDocs : activeTab === "shared" ? sharedDocs : docs;

  const filtered = baseDocs.filter(d => {
    const matchSearch = !search || d.name?.includes(search) || d.case_title?.includes(search);
    const matchCat = activeFilter === "all" || d.category === activeFilter;
    return matchSearch && matchCat;
  });

  // Group by case
  const groups = (() => {
    const g = {};
    filtered.forEach(doc => {
      const key = doc.case_title || "غير مرتبط بقضية";
      if (!g[key]) g[key] = [];
      g[key].push(doc);
    });
    return Object.entries(g);
  })();

  return (
    <div className="min-h-screen pb-28" dir="rtl"
      style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, #123E7C, #1E4E95)" }}>
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#101828" }}>ملفاتي القانونية</h1>
              <p className="text-xs" style={{ color: "#6B7280" }}>مستنداتك ومستندات قضاياك</p>
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
          <input type="text" placeholder="ابحث في ملفاتك..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-right" style={{ color: "#101828" }} />
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "إجمالي", value: docs.length, icon: FolderOpen, color: "#123E7C", bg: "#EAF2FF" },
            { label: "رفعتها", value: myDocs.length, icon: Upload, color: "#6D28D9", bg: "#F5F3FF" },
            { label: "مشاركة", value: sharedDocs.length, icon: Share2, color: "#065F46", bg: "#ECFDF5" },
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

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1 border" style={{ borderColor: "#E7ECF3" }}>
          {[
            { key: "all", label: "الكل" },
            { key: "shared", label: "من المحامي" },
            { key: "mine", label: "رفعتها" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab.key ? "#123E7C" : "transparent",
                color: activeTab === tab.key ? "white" : "#6B7280",
              }}>
              {tab.label}
            </button>
          ))}
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
          className="w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ borderColor: "#D4E4F7", color: "#123E7C" }}>
          <Upload className="w-4 h-4" /> رفع مستند جديد
        </button>

        {/* List */}
        {loading ? (
          <div className="text-center py-14">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: "#123E7C" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm font-semibold" style={{ color: "#101828" }}>لا توجد مستندات</p>
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>ارفع مستنداتك أو انتظر مشاركة المحامي</p>
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
                      <DocumentCard key={doc.id || i} doc={doc} index={i} showStatus />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploader */}
      <AnimatePresence>
        {showUploader && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowUploader(false)} />
            <DocumentUploader
              cases={cases}
              uploadedBy={user?.full_name || "موكل"}
              isLawyer={false}
              onSuccess={() => loadAll(user)}
              onClose={() => setShowUploader(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}