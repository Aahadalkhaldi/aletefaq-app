import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CalendarDays, RefreshCw, Receipt,
  User, Scale, Clock3, AlertCircle,
  Briefcase, WalletCards, CircleDollarSign, PenLine, ClipboardList,
} from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import HearingsCalendar from "@/components/hearings/HearingsCalendar";

// ─── Design tokens (matching client portal) ──────────────────────────────────
const BG = "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)";
const CARD = { background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 4px 16px rgba(18,62,124,0.10), inset 0 1px 1px rgba(255,255,255,0.8)" };
const ICON_GRADIENTS = [
  "linear-gradient(145deg, #1E4E95, #2563EB)",
  "linear-gradient(145deg, #0D7A5F, #059669)",
  "linear-gradient(145deg, #7C3AED, #4F46E5)",
  "linear-gradient(145deg, #C8A96B, #B8860B)",
  "linear-gradient(145deg, #0D5FAB, #0EA5E9)",
  "linear-gradient(145deg, #6D28D9, #8B5CF6)",
  "linear-gradient(145deg, #065F46, #10B981)",
  "linear-gradient(145deg, #9D174D, #EC4899)",
];
const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const DEEP = "#0D2F5F";



// ─── Reusable UI ──────────────────────────────────────────────────────────────

/** أيقونة مربعة بتدرج لوني + shine effect — نفس نمط بوابة العميل */
function GradientIcon({ icon: Icon, gradient, size = "md" }) {
  const dim = size === "sm" ? "w-10 h-10" : "w-12 h-12";
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className={`${dim} rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0`}
      style={{ background: gradient, boxShadow: "0 8px 20px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.1)" }}>
      <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-2xl" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 100%)" }} />
      <Icon className={`${iconSize} relative z-10 drop-shadow`} style={{ color: "white", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }} />
    </div>
  );
}

/** بطاقة زجاجية */
function Card({ children, className = "", onClick }) {
  return (
    <div className={`rounded-2xl p-4 border ${className}`} style={CARD} onClick={onClick}>
      {children}
    </div>
  );
}

/** عنوان قسم */
function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <button className="text-sm font-semibold" style={{ color: PRIMARY }} onClick={onAction}>{action}</button>
      <h3 className="text-base font-bold" style={{ color: TEXT }}>{title}</h3>
    </div>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function HomeScreen() {
  const [stats, setStats] = useState({ 
    cases: 0, 
    activeCases: 0,
    tasks: 0, 
    urgentTasks: 0,
    invoices: 0, 
    overdue: 0,
    notifs: 0,
    followups: 0,
    overdueFollowups: 0,
  });
  const [hearingDays, setHearingDays] = useState([]);
  const [urgentCases, setUrgentCases] = useState([]);
  const [upcomingHearings, setUpcomingHearings] = useState([]);
  const [tasksToday, setTasksToday] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const actions = [
    { key: "cases", label: "القضايا", icon: Briefcase, path: "/cases" },
    { key: "hearings", label: "الجلسات", icon: CalendarDays, path: "/hearings" },
    { key: "invoices", label: "الفواتير", icon: Receipt, path: "/finance" },
    { key: "clients", label: "الموكلين", icon: User, path: "/clients" },
    { key: "followups", label: "المتابعات", icon: RefreshCw, path: "/followups" },
    { key: "requests", label: "الطلبات", icon: ClipboardList, path: "/court-requests" },
  ];

  useEffect(() => {
    Promise.all([
      base44.entities.Case.filter({}, "-updated_date", 100).catch(() => []),
      base44.entities.CaseTask.filter({}, "due_date", 50).catch(() => []),
      base44.entities.Invoice.filter({}, "-created_date", 50).catch(() => []),
      base44.entities.Notification.filter({}, "-created_date", 50).catch(() => []),
      base44.entities.Hearing.filter({ status: "scheduled" }, "date", 30).catch(() => []),
      base44.entities.FollowUp.filter({}, "-created_date", 50).catch(() => []),
    ]).then(([allCases, allTasks, allInvoices, notifs, hearings, followups]) => {
      const activeCases = allCases.filter(c => ["in_progress", "court"].includes(c.status));
      const pendingTasks = allTasks.filter(t => t.status === "pending");
      const overdueInvoices = allInvoices.filter(i => i.status === "overdue");
      const pendingNotifs = notifs.filter(n => !n.is_read);
      const urgentFollowups = followups.filter(f => ["overdue", "urgent"].includes(f.status));
      
      // Get urgent/high priority cases
      const urgent = activeCases.filter(c => ["high", "urgent"].includes(c.priority)).slice(0, 3);
      
      // Get tasks due today
      const today = new Date().toISOString().split("T")[0];
      const tasksDueToday = pendingTasks.filter(t => t.due_date === today).slice(0, 3);
      
      // Get upcoming hearings (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcoming = hearings.filter(h => {
        const hDate = new Date(h.date);
        return hDate <= nextWeek;
      }).slice(0, 3);

      setStats({
        cases: allCases.length,
        activeCases: activeCases.length,
        tasks: pendingTasks.length,
        urgentTasks: pendingTasks.filter(t => ["high", "urgent"].includes(t.priority)).length,
        invoices: allInvoices.filter(i => ["pending", "issued"].includes(i.status)).length,
        overdue: overdueInvoices.length,
        notifs: pendingNotifs.length,
        followups: followups.filter(f => f.status !== "completed").length,
        overdueFollowups: urgentFollowups.length,
      });
      
      setUrgentCases(urgent);
      setTasksToday(tasksDueToday);
      setUpcomingHearings(upcoming);

      const today_date = new Date();
      const days = [];
      const dayNames = ["الأح", "الاث", "الثل", "الأر", "الخم", "الجم", "الس"];
      for (let i = 0; i < 6; i++) {
        const d = new Date(today_date);
        d.setDate(today_date.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const count = hearings.filter(h => h.date === dateStr).length;
        days.push({ day: dayNames[d.getDay()], date: String(d.getDate()), count, active: i === 0 });
      }
      setHearingDays(days);
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-5 space-y-5 pt-2">
      {/* Main KPIs Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "القضايا النشطة", value: stats.activeCases, icon: Briefcase, path: "/cases", gradient: "linear-gradient(145deg, #1E4E95, #2563EB)", color: "#1E4E95", highlight: false },
          { label: "مهام عاجلة", value: stats.urgentTasks, icon: AlertCircle, path: "/followups", gradient: "linear-gradient(145deg, #DC2626, #EF4444)", color: "#DC2626", highlight: stats.urgentTasks > 0 },
          { label: "فواتير متأخرة", value: stats.overdue, icon: CircleDollarSign, path: "/finance", gradient: "linear-gradient(145deg, #B45309, #F59E0B)", color: "#B45309", highlight: stats.overdue > 0 },
          { label: "متابعات معلقة", value: stats.overdueFollowups, icon: RefreshCw, path: "/followups", gradient: "linear-gradient(145deg, #6D28D9, #8B5CF6)", color: "#6D28D9", highlight: stats.overdueFollowups > 0 },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div 
              key={item.label} 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl p-4 border cursor-pointer transition-all"
              style={{ 
                borderColor: item.highlight ? "#FDECEC" : "#E7ECF3",
                backgroundColor: item.highlight ? "#FFFBFA" : "white",
                boxShadow: item.highlight ? "0 4px 12px rgba(244,63,94,0.1)" : "0 2px 8px rgba(18,62,124,0.06)"
              }}>
              <div className="flex items-center gap-3">
                <GradientIcon icon={Icon} gradient={item.gradient} />
                <div>
                  <p className="text-xs" style={{ color: TEXT_SEC }}>{item.label}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: item.color }}>
                    {loading ? "—" : item.value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Alert Banner - Urgent Items */}
      {(stats.urgentTasks > 0 || stats.overdue > 0 || stats.overdueFollowups > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 border flex items-start gap-3"
          style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#EF4444" }}>
            <AlertCircle className="w-4 h-4" style={{ color: "white" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "#B42318" }}>
              {stats.urgentTasks + stats.overdue + stats.overdueFollowups > 1
                ? `${stats.urgentTasks + stats.overdue + stats.overdueFollowups} بنود تتطلب إجراءً عاجلاً`
                : "بند واحد يتطلب إجراءً عاجلاً"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
              {stats.urgentTasks > 0 && `${stats.urgentTasks} مهام عاجلة`}
              {stats.overdue > 0 && `${stats.urgentTasks > 0 ? " • " : ""}${stats.overdue} فواتير متأخرة`}
              {stats.overdueFollowups > 0 && `${(stats.urgentTasks > 0 || stats.overdue > 0) ? " • " : ""}${stats.overdueFollowups} متابعات متأخرة`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Hearing strip */}
      {hearingDays.length > 0 && (
        <div>
          <SectionTitle title="الجلسات القادمة" action="عرض الكل" onAction={() => navigate("/hearings")} />
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {hearingDays.map((d, i) => (
              <div key={i} className="flex-shrink-0 rounded-2xl p-3 text-center border"
                style={{ minWidth: "72px", borderColor: d.active ? "rgba(18,62,124,0.3)" : "rgba(255,255,255,0.6)", background: d.active ? "#EAF2FF" : "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", boxShadow: "0 4px 12px rgba(18,62,124,0.08)" }}>
                <p className="text-[11px] font-semibold" style={{ color: d.active ? PRIMARY : TEXT_SEC }}>{d.day}</p>
                <p className="text-xl font-bold" style={{ color: d.active ? PRIMARY : TEXT }}>{d.date}</p>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  <Scale className="w-3 h-3" style={{ color: d.count > 0 ? "#059669" : TEXT_SEC }} />
                  <span className="text-[11px] font-semibold" style={{ color: d.count > 0 ? "#059669" : TEXT_SEC }}>{d.count > 0 ? `${d.count}` : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions — نفس شكل بوابة العميل */}
      <div>
        <h3 className="text-base font-bold mb-3" style={{ color: TEXT }}>الإجراءات السريعة</h3>
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button key={action.key}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileTap={{ scale: 0.95, y: 2 }} whileHover={{ y: -2 }}
                onClick={() => navigate(action.path)}
                className="rounded-2xl p-4 flex flex-col items-center gap-2 border"
                style={{ borderColor: "rgba(255,255,255,0.6)", minHeight: "94px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 4px 16px rgba(18,62,124,0.10), inset 0 1px 1px rgba(255,255,255,0.8)" }}>
                <GradientIcon icon={Icon} gradient={ICON_GRADIENTS[i]} />
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: DEEP }}>{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Urgent Cases Section */}
      {urgentCases.length > 0 && (
        <div>
          <SectionTitle title={`قضايا عاجلة (${urgentCases.length})`} action="عرض الكل" onAction={() => navigate("/cases")} />
          <div className="space-y-2">
            {urgentCases.map((caseItem) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(`/cases/${caseItem.id}`)}
                className="bg-white rounded-xl p-3 border cursor-pointer transition-all hover:shadow-lg"
                style={{ borderColor: caseItem.priority === "urgent" ? "#FCA5A5" : "#E7ECF3" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: caseItem.priority === "urgent" ? "#FEE2E2" : "#EAF2FF" }}>
                    <Scale className="w-4 h-4" style={{ color: caseItem.priority === "urgent" ? "#DC2626" : PRIMARY }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: TEXT }}>{caseItem.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>الحالة: {caseItem.status === "court" ? "أمام المحكمة" : "قيد المتابعة"}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ 
                    backgroundColor: caseItem.priority === "urgent" ? "#FEE2E2" : "#EAF2FF",
                    color: caseItem.priority === "urgent" ? "#DC2626" : PRIMARY
                  }}>
                    {caseItem.priority === "urgent" ? "عاجل" : "مهم"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Due Today */}
      {tasksToday.length > 0 && (
        <div>
          <SectionTitle title={`مهام اليوم (${tasksToday.length})`} action="عرض الكل" onAction={() => navigate("/followups")} />
          <div className="space-y-2">
            {tasksToday.map((task) => (
              <div key={task.id} className="bg-white rounded-xl p-3 border" style={{ borderColor: "#E7ECF3" }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F0FFF4" }}>
                    <Clock3 className="w-4 h-4" style={{ color: "#059669" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: TEXT }}>{task.title}</p>
                    {task.case_title && <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{task.case_title}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Hearings Calendar */}
      <HearingsCalendar />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function LawyerDashboard() {
  return (
    <div className="min-h-screen pb-8" dir="rtl" style={{ background: BG, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      <div className="pt-4 pb-24">
        <HomeScreen />
      </div>
    </div>
  );
}