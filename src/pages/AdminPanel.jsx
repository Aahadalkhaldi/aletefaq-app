import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Eye, MapPin, Clock, User, Building2, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => { loadRequests(); }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data } = await query;
      setRequests(data || []);

      // Stats
      const { data: allProfiles } = await supabase.from("profiles").select("status");
      if (allProfiles) {
        setStats({
          pending: allProfiles.filter(p => p.status === "pending").length,
          approved: allProfiles.filter(p => p.status === "approved").length,
          rejected: allProfiles.filter(p => p.status === "rejected").length,
        });
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    await supabase.from("profiles").update({ status: "approved" }).eq("id", id);
    loadRequests();
  };

  const handleReject = async (id) => {
    await supabase.from("profiles").update({ status: "rejected", rejection_reason: rejectReason }).eq("id", id);
    setShowRejectModal(null);
    setRejectReason("");
    loadRequests();
  };

  const filtered = requests.filter(r =>
    !search || r.full_name?.includes(search) || r.email?.includes(search) || r.phone?.includes(search)
  );

  const openMap = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const font = { fontFamily: "'IBM Plex Sans Arabic', sans-serif" };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0D2F5F 0%, #0a1e3d 100%)" }} dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-xl font-bold text-white mb-4" style={font}>⚖️ لوحة الإدارة</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "قيد المراجعة", count: stats.pending, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
            { label: "مقبول", count: stats.approved, color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
            { label: "مرفوض", count: stats.rejected, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: s.bg, border: `1px solid ${s.color}30` }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)", ...font }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { key: "pending", label: "قيد المراجعة" },
            { key: "approved", label: "مقبول" },
            { key: "rejected", label: "مرفوض" },
            { key: "all", label: "الكل" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-all"
              style={{
                backgroundColor: filter === f.key ? "#C8A96B" : "rgba(255,255,255,0.1)",
                color: filter === f.key ? "#0D2F5F" : "rgba(255,255,255,0.6)",
                fontWeight: filter === f.key ? 700 : 400, ...font
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
          <input type="text" placeholder="بحث بالاسم أو الإيميل أو الجوال..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/40 outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", ...font }} />
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#C8A96B", borderTopColor: "transparent" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)", ...font }}>لا توجد طلبات</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map(req => (
                <motion.div key={req.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  
                  {/* Card header */}
                  <button onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                    className="w-full flex items-center gap-3 p-3 text-right">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(200,169,107,0.2)" }}>
                      {req.account_type === "company" ? <Building2 className="w-5 h-5" style={{ color: "#C8A96B" }} /> : <User className="w-5 h-5" style={{ color: "#C8A96B" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate" style={font}>{req.full_name}</p>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{req.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{
                        backgroundColor: req.status === "pending" ? "rgba(245,158,11,0.2)" : req.status === "approved" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                        color: req.status === "pending" ? "#f59e0b" : req.status === "approved" ? "#22c55e" : "#ef4444",
                        ...font
                      }}>
                        {req.status === "pending" ? "قيد المراجعة" : req.status === "approved" ? "مقبول" : "مرفوض"}
                      </span>
                      {expanded === req.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expanded === req.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                        <div className="p-3 space-y-3">
                          {/* Info grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "rgba(255,255,255,0.7)", ...font }}>
                            <div><span style={{ color: "rgba(255,255,255,0.4)" }}>الجوال: </span>{req.phone}</div>
                            <div><span style={{ color: "rgba(255,255,255,0.4)" }}>النوع: </span>{req.account_type === "company" ? "شركة" : "شخصي"}</div>
                            {req.company_name && <div><span style={{ color: "rgba(255,255,255,0.4)" }}>الشركة: </span>{req.company_name}</div>}
                            {req.commercial_register && <div><span style={{ color: "rgba(255,255,255,0.4)" }}>السجل: </span>{req.commercial_register}</div>}
                            <div><span style={{ color: "rgba(255,255,255,0.4)" }}>الدور: </span>{req.role === "lawyer" ? "محامي" : "عميل"}</div>
                            <div><span style={{ color: "rgba(255,255,255,0.4)" }}>التاريخ: </span>{new Date(req.created_at).toLocaleDateString("ar-QA")}</div>
                          </div>

                          {/* ID Photo */}
                          {req.id_photo_url && (
                            <div>
                              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)", ...font }}>صورة الإثبات:</p>
                              <img src={req.id_photo_url} alt="ID" className="w-full h-40 object-cover rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                            </div>
                          )}

                          {/* Location */}
                          {req.registration_lat && req.registration_lng ? (
                            <button onClick={() => openMap(req.registration_lat, req.registration_lng)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg w-full"
                              style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                              <MapPin className="w-4 h-4" style={{ color: "#22c55e" }} />
                              <span className="text-xs" style={{ color: "#22c55e", ...font }}>عرض موقع التسجيل على الخريطة</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                              <MapPin className="w-4 h-4" style={{ color: "#ef4444" }} />
                              <span className="text-xs" style={{ color: "#ef4444", ...font }}>لم يتم تحديد الموقع</span>
                            </div>
                          )}

                          {/* Rejection reason */}
                          {req.status === "rejected" && req.rejection_reason && (
                            <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                              <p className="text-xs" style={{ color: "#ef4444", ...font }}>سبب الرفض: {req.rejection_reason}</p>
                            </div>
                          )}

                          {/* Actions */}
                          {req.status === "pending" && (
                            <div className="flex gap-2">
                              <button onClick={() => handleApprove(req.id)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ backgroundColor: "#22c55e", color: "white", ...font }}>
                                <CheckCircle2 className="w-4 h-4" /> قبول
                              </button>
                              <button onClick={() => setShowRejectModal(req.id)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ backgroundColor: "#ef4444", color: "white", ...font }}>
                                <XCircle className="w-4 h-4" /> رفض
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
              onClick={() => setShowRejectModal(null)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="w-full max-w-sm rounded-2xl p-5" style={{ backgroundColor: "#0D2F5F", border: "1px solid rgba(255,255,255,0.15)" }}
                onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-bold text-white mb-3" style={font}>سبب الرفض</h3>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="اكتب سبب الرفض (اختياري)..."
                  className="w-full rounded-xl p-3 text-sm text-white placeholder:text-white/40 outline-none resize-none h-24"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", ...font }} />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleReject(showRejectModal)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: "#ef4444", color: "white", ...font }}>تأكيد الرفض</button>
                  <button onClick={() => setShowRejectModal(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white", ...font }}>إلغاء</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
