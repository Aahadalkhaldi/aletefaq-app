import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import {
  Scale, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Download, Loader2, ArrowRight, CalendarDays, DollarSign,
  Users, Bell, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { jsPDF } from "jspdf";

const PRIMARY = "#123E7C";
const GOLD = "#C8A96B";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const COLORS = [PRIMARY, GOLD, "#1A6E3A", "#B42318", "#6366F1", "#0891B2", "#7C3AED"];

const TYPE_MAP = {
  civil: "مدنية", commercial: "تجارية", criminal: "جنائية",
  family: "أسرة", labor: "عمالية", administrative: "إدارية",
  execution: "تنفيذ", other: "أخرى",
};
const STATUS_MAP = {
  new: "جديدة", in_progress: "جارية", court: "في المحكمة",
  waiting_docs: "بانتظار مستندات", closed: "مغلقة", archived: "مؤرشفة",
};

// ─── Mini KPI Card ─────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, bg, trend, alert, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border p-4 relative overflow-hidden"
      style={{ borderColor: alert ? "#FECACA" : "#E7ECF3", boxShadow: "0 2px 8px rgba(18,62,124,0.05)" }}
    >
      {alert && <div className="absolute top-0 right-0 left-0 h-1 rounded-t-2xl" style={{ backgroundColor: "#B42318" }} />}
      <div className="flex items-start justify-between mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
            style={{ backgroundColor: trend >= 0 ? "#ECFDF5" : "#FEF2F2", color: trend >= 0 ? "#059669" : "#B42318" }}>
            {trend >= 0 ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold leading-none" style={{ color: TEXT }}>{value}</p>
      <p className="text-xs font-semibold mt-1" style={{ color: TEXT }}>{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: TEXT_SEC }}>{sub}</p>}
    </motion.div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: PRIMARY }} />
      <div>
        <p className="text-sm font-bold" style={{ color: TEXT }}>{title}</p>
        {sub && <p className="text-[10px]" style={{ color: TEXT_SEC }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressRow({ label, value, total, color, delay = 0 }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs" style={{ color: TEXT_SEC }}>{label}</span>
        <span className="text-xs font-bold" style={{ color: TEXT }}>{value} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F2F4F7" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay }}
          className="h-full rounded-full" style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OfficeAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [activeChart, setActiveChart] = useState("type"); // type | status | payment

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const [c, h, m, t, inv, f] = await Promise.all([
      base44.entities.Case.list("-updated_date", 300).catch(() => []),
      base44.entities.Hearing.list("-date", 300).catch(() => []),
      base44.entities.Meeting.list("-date", 200).catch(() => []),
      base44.entities.CaseTask.list("-created_date", 300).catch(() => []),
      base44.entities.Invoice.list("-created_date", 200).catch(() => []),
      base44.entities.FollowUp.list("-deadline", 200).catch(() => []),
    ]);
    setCases(c);
    setHearings(h);
    setMeetings(m);
    setTasks(t);
    setInvoices(inv);
    setFollowups(f);
    setLoading(false);
  };

  const today = new Date().toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // ── Case KPIs ──
  const activeCases = cases.filter(c => !["closed", "archived"].includes(c.status));
  const closedCases = cases.filter(c => ["closed", "archived"].includes(c.status));
  const activeCount = activeCases.length;
  const totalCases = cases.length;
  const closePct = totalCases > 0 ? Math.round((closedCases.length / totalCases) * 100) : 0;

  // ── Meeting KPIs ──
  const completedMeetings = meetings.filter(m => m.status === "completed").length;
  const scheduledMeetings = meetings.filter(m => m.status === "scheduled").length;
  const totalMeetings = meetings.length;
  const meetingCompletionRate = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0;

  // ── Task KPIs ──
  const overdueTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled" && t.due_date && t.due_date < today);
  const pendingTasks = tasks.filter(t => ["pending", "in_progress"].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // ── Hearing KPIs ──
  const upcomingHearings = hearings.filter(h => h.date >= today && h.date <= in7Days && h.status === "scheduled");
  const overdueHearings = followups.filter(f => f.status !== "completed" && f.status !== "cancelled" && f.deadline && f.deadline < today);

  // ── Financial KPIs ──
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const pendingRevenue = invoices.filter(i => ["issued", "pending"].includes(i.status)).reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const overdueInvoices = invoices.filter(i => ["issued", "pending"].includes(i.status) && i.due_date && i.due_date < today);

  // ── Alerts ──
  const alerts = [
    ...overdueTasks.map(t => ({ type: "task", label: `مهمة متأخرة: ${t.title}`, color: "#B42318", bg: "#FEF2F2", icon: AlertTriangle })),
    ...upcomingHearings.map(h => ({ type: "hearing", label: `جلسة قريبة: ${h.case_title || "قضية"} — ${new Date(h.date + "T00:00:00").toLocaleDateString("ar-QA", { weekday: "short", day: "numeric", month: "short" })}`, color: "#8A5A00", bg: "#FFF4E5", icon: CalendarDays })),
    ...overdueInvoices.map(i => ({ type: "invoice", label: `فاتورة متأخرة: ${i.invoice_number} — ${i.client_name}`, color: "#B42318", bg: "#FEF2F2", icon: DollarSign })),
    ...overdueHearings.slice(0, 3).map(f => ({ type: "followup", label: `متابعة متأخرة: ${f.title}`, color: "#6D28D9", bg: "#F5F3FF", icon: Bell })),
  ].slice(0, 8);

  // ── Charts ──
  const byType = Object.entries(
    cases.reduce((acc, c) => { const k = TYPE_MAP[c.type] || "أخرى"; acc[k] = (acc[k] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const byStatus = Object.entries(
    activeCases.reduce((acc, c) => { const k = STATUS_MAP[c.status] || c.status; acc[k] = (acc[k] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const paymentData = [
    { name: "مدفوعة", value: invoices.filter(i => i.status === "paid").length },
    { name: "معلقة", value: invoices.filter(i => ["issued", "pending"].includes(i.status)).length },
    { name: "متأخرة", value: overdueInvoices.length },
    { name: "ملغاة", value: invoices.filter(i => i.status === "cancelled").length },
  ].filter(d => d.value > 0);

  // Monthly cases trend (last 6 months)
  const monthTrend = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("ar-QA", { month: "short" });
      const count = cases.filter(c => c.created_date?.startsWith(key)).length;
      months.push({ name: label, value: count });
    }
    return months;
  })();

  // ── Export PDF ──
  const handleExport = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      doc.setFillColor(18, 62, 124);
      doc.rect(0, 0, pageW, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("لوحة التحليلات — مكتب الاتفاق للمحاماة", pageW - margin, y, { align: "right" });
      doc.setFontSize(10);
      doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString("ar-QA")}`, pageW - margin, y + 8, { align: "right" });
      y = 48;
      doc.setTextColor(16, 24, 40);

      const sections = [
        ["المؤشرات الرئيسية", [
          ["القضايا النشطة", activeCount],
          ["إجمالي القضايا", totalCases],
          ["نسبة الإنجاز", `${closePct}%`],
          ["نسبة إنجاز المواعيد", `${meetingCompletionRate}%`],
          ["إجمالي الإيرادات المحصلة", `${totalRevenue.toLocaleString("ar-QA")} ر.ق`],
          ["إيرادات معلقة", `${pendingRevenue.toLocaleString("ar-QA")} ر.ق`],
          ["مهام متأخرة", overdueTasks.length],
          ["جلسات خلال 7 أيام", upcomingHearings.length],
        ]],
      ];

      sections.forEach(([title, rows]) => {
        doc.setFontSize(13);
        doc.setFont(undefined, "bold");
        doc.text(title, pageW - margin, y, { align: "right" });
        y += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        rows.forEach(([label, val]) => {
          doc.setFillColor(247, 248, 250);
          doc.rect(margin, y - 4, pageW - margin * 2, 8, "F");
          doc.setTextColor(107, 114, 128);
          doc.text(label, pageW - margin - 2, y, { align: "right" });
          doc.setTextColor(16, 24, 40);
          doc.setFont(undefined, "bold");
          doc.text(String(val), margin + 2, y);
          doc.setFont(undefined, "normal");
          y += 10;
          if (y > 270) { doc.addPage(); y = 20; }
        });
        y += 5;
      });

      doc.save(`تحليلات-المكتب-${new Date().toLocaleDateString("ar-QA").replace(/\//g, "-")}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" dir="rtl"
      style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
            <ArrowRight className="w-4 h-4" style={{ color: TEXT }} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: TEXT }}>لوحة التحليلات</h1>
            <p className="text-xs" style={{ color: TEXT_SEC }}>{activeCount} قضية نشطة • {alerts.length} تنبيه</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: PRIMARY }}>
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            PDF
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">

        {/* ── Alerts Banner ── */}
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <SectionHeader title="تنبيهات عاجلة" sub={`${alerts.length} تنبيه يتطلب انتباهك`} />
            <div className="space-y-2">
              {alerts.map((a, i) => {
                const Icon = a.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                    style={{ backgroundColor: a.bg, borderColor: a.color + "40" }}>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: a.color }} />
                    <p className="text-xs font-semibold flex-1" style={{ color: a.color }}>{a.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Main KPIs ── */}
        <div>
          <SectionHeader title="المؤشرات الرئيسية" />
          <div className="grid grid-cols-2 gap-3">
            <KpiCard icon={Scale} label="قضايا نشطة" value={activeCount}
              sub={`من إجمالي ${totalCases} قضية`} color={PRIMARY} bg="#EAF2FF" delay={0} />
            <KpiCard icon={CheckCircle} label="نسبة الإنجاز" value={`${closePct}%`}
              sub={`${closedCases.length} قضية مغلقة`} color="#065F46" bg="#ECFDF5" delay={0.05} />
            <KpiCard icon={CalendarDays} label="إنجاز المواعيد" value={`${meetingCompletionRate}%`}
              sub={`${scheduledMeetings} موعد قادم`} color="#8A5A00" bg="#FFF4E5" delay={0.1} />
            <KpiCard icon={FileText} label="إنجاز المهام" value={`${taskCompletionRate}%`}
              sub={`${overdueTasks.length} مهمة متأخرة`}
              color={overdueTasks.length > 0 ? "#B42318" : "#065F46"}
              bg={overdueTasks.length > 0 ? "#FEF2F2" : "#ECFDF5"}
              alert={overdueTasks.length > 0} delay={0.15} />
          </div>
        </div>

        {/* ── Financial KPIs ── */}
        <div>
          <SectionHeader title="المالية" sub="إجمالي الإيرادات والمستحقات" />
          <div className="grid grid-cols-2 gap-3">
            <KpiCard icon={DollarSign} label="إيرادات محصلة" value={`${(totalRevenue / 1000).toFixed(1)}k`}
              sub="ر.ق" color="#065F46" bg="#ECFDF5" delay={0.1} />
            <KpiCard icon={Clock} label="مستحقات معلقة" value={`${(pendingRevenue / 1000).toFixed(1)}k`}
              sub={`${overdueInvoices.length} متأخرة`} color="#8A5A00" bg="#FFF4E5"
              alert={overdueInvoices.length > 0} delay={0.15} />
          </div>
        </div>

        {/* ── Meeting Completion Bar ── */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
          <SectionHeader title="نسبة إنجاز المواعيد" sub={`${completedMeetings} من ${totalMeetings} موعد`} />
          <div className="h-4 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "#F2F4F7" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${meetingCompletionRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full flex items-center justify-end px-2"
              style={{ background: `linear-gradient(90deg, ${PRIMARY}, #1E4E95)` }}>
              {meetingCompletionRate > 15 && (
                <span className="text-[9px] font-bold text-white">{meetingCompletionRate}%</span>
              )}
            </motion.div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: "مكتملة", value: completedMeetings, color: "#065F46", bg: "#ECFDF5" },
              { label: "مجدولة", value: scheduledMeetings, color: PRIMARY, bg: "#EAF2FF" },
              { label: "ملغاة", value: meetings.filter(m => m.status === "cancelled").length, color: "#B42318", bg: "#FEF2F2" },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-xl" style={{ backgroundColor: s.bg }}>
                <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px]" style={{ color: s.color }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Charts Section ── */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-50 rounded-xl p-1 mb-4">
            {[
              { key: "type", label: "حسب النوع" },
              { key: "status", label: "حسب الحالة" },
              { key: "payment", label: "حالة الدفع" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveChart(tab.key)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: activeChart === tab.key ? PRIMARY : "transparent",
                  color: activeChart === tab.key ? "white" : TEXT_SEC,
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeChart === "type" && (
              <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs font-semibold mb-3" style={{ color: TEXT_SEC }}>توزيع القضايا حسب النوع</p>
                {byType.length === 0 ? (
                  <p className="text-center text-xs py-8" style={{ color: TEXT_SEC }}>لا توجد بيانات</p>
                ) : (
                  <div className="flex gap-3">
                    <ResponsiveContainer width="45%" height={150}>
                      <PieChart>
                        <Pie data={byType} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                          {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} formatter={v => [v, "قضية"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {byType.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-[11px]" style={{ color: TEXT_SEC }}>{item.name}</span>
                          </div>
                          <span className="text-[11px] font-bold" style={{ color: TEXT }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeChart === "status" && (
              <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs font-semibold mb-3" style={{ color: TEXT_SEC }}>القضايا النشطة حسب الحالة</p>
                {byStatus.length === 0 ? (
                  <p className="text-center text-xs py-8" style={{ color: TEXT_SEC }}>لا توجد قضايا نشطة</p>
                ) : (
                  <div className="space-y-2.5">
                    {byStatus.map((item, i) => (
                      <ProgressRow key={item.name} label={item.name} value={item.value}
                        total={activeCount} color={COLORS[i % COLORS.length]} delay={i * 0.1} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeChart === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs font-semibold mb-3" style={{ color: TEXT_SEC }}>توزيع حالة الفواتير</p>
                {paymentData.length === 0 ? (
                  <p className="text-center text-xs py-8" style={{ color: TEXT_SEC }}>لا توجد فواتير</p>
                ) : (
                  <div className="flex gap-3">
                    <ResponsiveContainer width="45%" height={150}>
                      <PieChart>
                        <Pie data={paymentData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                          {paymentData.map((_, i) => <Cell key={i} fill={["#10B981", "#F59E0B", "#B42318", "#9CA3AF"][i]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} formatter={v => [v, "فاتورة"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {paymentData.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#10B981", "#F59E0B", "#B42318", "#9CA3AF"][i] }} />
                            <span className="text-[11px]" style={{ color: TEXT_SEC }}>{item.name}</span>
                          </div>
                          <span className="text-[11px] font-bold" style={{ color: TEXT }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Monthly Trend ── */}
        {monthTrend.some(m => m.value > 0) && (
          <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
            <SectionHeader title="اتجاه القضايا" sub="آخر 6 أشهر" />
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={monthTrend} margin={{ right: 5, left: 5, top: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: TEXT_SEC }} />
                <YAxis tick={{ fontSize: 10, fill: TEXT_SEC }} width={20} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, border: "1px solid #E7ECF3" }} formatter={v => [v, "قضية"]} />
                <Line type="monotone" dataKey="value" stroke={PRIMARY} strokeWidth={2.5} dot={{ fill: PRIMARY, r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Upcoming Hearings (7 days) ── */}
        {upcomingHearings.length > 0 && (
          <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
            <SectionHeader title="جلسات خلال 7 أيام" sub={`${upcomingHearings.length} جلسة قادمة`} />
            <div className="space-y-2">
              {upcomingHearings.slice(0, 5).map((h, i) => (
                <motion.div key={h.id || i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "#E7ECF3" }}>
                  <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
                    <p className="text-xs font-bold leading-none" style={{ color: PRIMARY }}>
                      {new Date(h.date + "T00:00:00").getDate()}
                    </p>
                    <p className="text-[9px]" style={{ color: PRIMARY }}>
                      {new Date(h.date + "T00:00:00").toLocaleDateString("ar-QA", { month: "short" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: TEXT }}>{h.case_title || "قضية"}</p>
                    <p className="text-[10px]" style={{ color: TEXT_SEC }}>{h.court_name || ""} {h.time ? `• ${h.time}` : ""}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EAF2FF", color: PRIMARY }}>
                    {h.date === today ? "اليوم" : h.date === new Date(Date.now() + 86400000).toISOString().split("T")[0] ? "غداً" : "قريباً"}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Overdue Tasks list ── */}
        {overdueTasks.length > 0 && (
          <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#FECACA" }}>
            <SectionHeader title="مهام متأخرة" sub={`${overdueTasks.length} مهمة تجاوزت موعدها`} />
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map((t, i) => (
                <div key={t.id || i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#FEF2F2" }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#B42318" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: "#B42318" }}>{t.title}</p>
                    <p className="text-[10px]" style={{ color: "#B42318" }}>استحقاق: {t.due_date}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FECACA", color: "#B42318" }}>
                    متأخرة
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}