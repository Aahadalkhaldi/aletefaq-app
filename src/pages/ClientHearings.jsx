import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hearing } from '@/api/entities';
import {
  CalendarDays, Scale, Clock3, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Loader2, XCircle, PauseCircle
} from "lucide-react";

const BG = "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)";
const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const DEEP = "#0D2F5F";

// حالة الجلسة
const statusConfig = {
  scheduled: { label: "مجدولة", bg: "#EAF2FF", color: PRIMARY, icon: Clock3 },
  completed:  { label: "تمت",    bg: "#DCFCE7", color: "#166534", icon: CheckCircle2 },
  postponed:  { label: "مؤجلة", bg: "#FFF4E5", color: "#8A5A00", icon: PauseCircle },
  cancelled:  { label: "ملغاة", bg: "#FDECEC", color: "#B42318", icon: XCircle },
};

// نوع الجلسة
const typeLabel = {
  initial: "تمهيدية",
  hearing: "مرافعة",
  verdict: "حكم",
  appeal:  "استئناف",
  execution: "تنفيذ",
  other: "أخرى",
};

function HearingCard({ hearing }) {
  const [expanded, setExpanded] = useState(false);
  const s = statusConfig[hearing.status] || statusConfig.scheduled;
  const StatusIcon = s.icon;
  const hasOutcome = hearing.outcome || hearing.notes;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.7)", boxShadow: "0 4px 16px rgba(18,62,124,0.09), inset 0 1px 1px rgba(255,255,255,0.9)" }}>

      {/* Header row */}
      <div className="p-4 flex items-start gap-3">
        {/* Date block */}
        <div className="flex-shrink-0 rounded-xl p-2.5 text-center" style={{ backgroundColor: "#EAF2FF", minWidth: "52px" }}>
          <p className="text-xs font-semibold" style={{ color: TEXT_SEC }}>
            {hearing.date ? new Date(hearing.date).toLocaleDateString("ar-QA", { month: "short" }) : "—"}
          </p>
          <p className="text-xl font-bold leading-tight" style={{ color: PRIMARY }}>
            {hearing.date ? new Date(hearing.date).getDate() : "—"}
          </p>
          {hearing.time && <p className="text-[10px]" style={{ color: TEXT_SEC }}>{hearing.time}</p>}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm font-bold truncate" style={{ color: TEXT }}>
            {hearing.case_title || hearing.court_name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{hearing.court_name}</p>
          {hearing.location && <p className="text-xs" style={{ color: TEXT_SEC }}>{hearing.location}</p>}

          <div className="flex items-center justify-end gap-2 mt-2 flex-wrap">
            {hearing.type && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F2F4F7", color: TEXT_SEC }}>
                {typeLabel[hearing.type] || hearing.type}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: s.bg, color: s.color }}>
              <StatusIcon className="w-3 h-3" />
              {s.label}
            </span>
          </div>
        </div>

        {/* Expand if has outcome */}
        {hasOutcome && (
          <button onClick={() => setExpanded(e => !e)} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#F2F4F7" }}>
            {expanded
              ? <ChevronUp className="w-4 h-4" style={{ color: TEXT_SEC }} />
              : <ChevronDown className="w-4 h-4" style={{ color: TEXT_SEC }} />}
          </button>
        )}
      </div>

      {/* Outcome panel */}
      <AnimatePresence>
        {expanded && hasOutcome && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div className="mx-4 mb-4 rounded-xl p-3 text-right" style={{ backgroundColor: "#F7F8FA", borderRight: `3px solid ${s.color}` }}>
              {hearing.outcome && (
                <>
                  <p className="text-xs font-bold mb-1" style={{ color: DEEP }}>نتيجة الجلسة</p>
                  <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{hearing.outcome}</p>
                </>
              )}
              {hearing.notes && (
                <div className={hearing.outcome ? "mt-2 pt-2 border-t" : ""} style={{ borderColor: "#E7ECF3" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: DEEP }}>ملاحظات</p>
                  <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>{hearing.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ClientHearings() {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    Hearing.list("-date", 100)
      .then(d => { setHearings(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filters = [
    { key: "all",       label: "الكل" },
    { key: "scheduled", label: "مجدولة" },
    { key: "completed", label: "تمت" },
    { key: "postponed", label: "مؤجلة" },
  ];

  const filtered = filter === "all" ? hearings : hearings.filter(h => h.status === filter);

  const upcoming = hearings.filter(h => h.status === "scheduled").length;
  const completed = hearings.filter(h => h.status === "completed").length;
  const postponed = hearings.filter(h => h.status === "postponed").length;

  return (
    <div className="min-h-screen pb-28" dir="rtl" style={{ background: BG, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, #123E7C, #1E4E95)" }}>
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: TEXT }}>جلساتي</h1>
            <p className="text-xs" style={{ color: TEXT_SEC }}>متابعة جلساتك القضائية ونتائجها</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "قادمة",  value: upcoming,  bg: "#EAF2FF", color: PRIMARY },
            { label: "تمت",    value: completed, bg: "#DCFCE7", color: "#166534" },
            { label: "مؤجلة", value: postponed, bg: "#FFF4E5", color: "#8A5A00" },
          ].map(item => (
            <div key={item.label} className="rounded-2xl p-3 text-center border"
              style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)" }}>
              <p className="text-2xl font-bold" style={{ color: loading ? TEXT_SEC : item.color }}>
                {loading ? "—" : item.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: filter === f.key ? PRIMARY : "rgba(255,255,255,0.7)",
                color: filter === f.key ? "white" : TEXT_SEC,
                border: `1px solid ${filter === f.key ? "transparent" : "rgba(255,255,255,0.6)"}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: PRIMARY }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#EAF2FF" }}>
              <Scale className="w-7 h-7" style={{ color: PRIMARY }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: TEXT }}>لا توجد جلسات</p>
            <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>ستظهر هنا جلساتك بمجرد إضافتها من قِبل المحامي</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filtered.map((h, i) => (
              <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <HearingCard hearing={h} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}