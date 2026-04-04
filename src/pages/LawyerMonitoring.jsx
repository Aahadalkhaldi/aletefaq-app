import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Compat";
import { Case, CaseTask, FollowUp, Hearing, Invoice } from '@/api/entities';
import {
  BarChart2, Scale, CheckCircle2, Clock3, AlertCircle,
  TrendingUp, Users, CalendarDays, Receipt, RefreshCw,
  ChevronDown, ChevronUp, Shield
} from "lucide-react";

const PRIMARY = "#123E7C";
const DEEP = "#0D2F5F";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const BG = "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)";

const PRIORITY_COLORS = {
  urgent: { bg: "#FDECEC", text: "#B42318", label: "عاجل" },
  high:   { bg: "#FFF4E5", text: "#8A5A00", label: "عالي" },
  medium: { bg: "#EAF2FF", text: "#123E7C", label: "متوسط" },
  low:    { bg: "#F2F4F7", text: "#526071", label: "منخفض" },
};

function StatCard({ label, value, icon: Icon, color, bg, loading }) {
  return (
    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E7ECF3", boxShadow: "0 2px 8px rgba(18,62,124,0.06)" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs" style={{ color: TEXT_SEC }}>{label}</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: loading ? "#D1D5DB" : DEEP }}>
            {loading ? "—" : value}
          </p>
        </div>
      </div>
    </div>
  );
}

function LawyerCard({ lawyer, cases, hearings, tasks, followups }) {
  const [expanded, setExpanded] = useState(false);

  const activeCases = cases.filter(c => c.lead_lawyer_name === lawyer && c.status === "in_progress").length;
  const totalCases = cases.filter(c => c.lead_lawyer_name === lawyer).length;
  const pendingTasks = tasks.filter(t => t.assignee_name === lawyer && t.status === "pending").length;
  const upcomingHearings = hearings.filter(h => {
    const caseForHearing = cases.find(c => c.id === h.case_id);
    return caseForHearing?.lead_lawyer_name === lawyer && h.status === "scheduled";
  }).length;
  const openFollowups = followups.filter(f => f.assignee_name === lawyer && f.status === "open").length;
  const urgentFollowups = followups.filter(f => f.assignee_name === lawyer && f.priority === "urgent" && f.status !== "completed").length;

  const lawyerCases = cases.filter(c => c.lead_lawyer_name === lawyer);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border overflow-hidden"
      style={{ borderColor: "#E7ECF3", boxShadow: "0 2px 8px rgba(18,62,124,0.06)" }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-4 p-4 text-right"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-base"
          style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
          {lawyer.charAt(0)}
        </div>

        <div className="flex-1 text-right min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: TEXT }}>{lawyer}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: TEXT_SEC }}>{totalCases} قضية</span>
            {urgentFollowups > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>
                {urgentFollowups} عاجل
              </span>
            )}
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex gap-3 flex-shrink-0">
          {[
            { value: activeCases, color: "#123E7C", label: "نشط" },
            { value: pendingTasks, color: "#F59E0B", label: "مهام" },
            { value: upcomingHearings, color: "#059669", label: "جلسات" },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className="text-base font-bold" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[10px]" style={{ color: TEXT_SEC }}>{item.label}</p>
            </div>
          ))}
        </div>

        {expanded
          ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: TEXT_SEC }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: TEXT_SEC }} />
        }
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: "#EEF2F7" }}>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "قضايا نشطة", value: activeCases, bg: "#EAF2FF", color: PRIMARY },
              { label: "مهام معلقة", value: pendingTasks, bg: "#FFF4E5", color: "#8A5A00" },
              { label: "جلسات قادمة", value: upcomingHearings, bg: "#ECFDF5", color: "#065F46" },
              { label: "متابعات مفتوحة", value: openFollowups, bg: "#F5F3FF", color: "#6D28D9" },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: item.bg }}>
                <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: TEXT_SEC }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Cases list */}
          {lawyerCases.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: TEXT_SEC }}>القضايا المسندة</p>
              <div className="space-y-2">
                {lawyerCases.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#F3F7FD" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLORS[c.priority]?.bg || "#F2F4F7", color: PRIORITY_COLORS[c.priority]?.text || TEXT_SEC }}>
                        {PRIORITY_COLORS[c.priority]?.label || c.priority}
                      </span>
                    </div>
                    <div className="flex-1 text-right mx-2 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: TEXT }}>{c.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: TEXT_SEC }}>{c.client_name}</p>
                    </div>
                  </div>
                ))}
                {lawyerCases.length > 5 && (
                  <p className="text-xs text-center pt-1" style={{ color: PRIMARY }}>+{lawyerCases.length - 5} قضية أخرى</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function LawyerMonitoring() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role !== "admin") {
        navigate("/lawyer-dashboard");
        return;
      }
      loadData();
    }).catch(() => navigate("/lawyer-dashboard"));
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      Case.list("-updated_date", 200).catch(() => []),
      Hearing.filter({ status: "scheduled" }, "date", 100).catch(() => []),
      CaseTask.filter({ status: "pending" }, "due_date", 100).catch(() => []),
      FollowUp.list("deadline", 100).catch(() => []),
      Invoice.list("-created_date", 100).catch(() => []),
    ]).then(([c, h, t, f, inv]) => {
      setCases(c);
      setHearings(h);
      setTasks(t);
      setFollowups(f);
      setInvoices(inv);
      setLoading(false);
    });
  };

  // Extract unique lawyer names
  const lawyers = [...new Set([
    ...cases.map(c => c.lead_lawyer_name),
    ...tasks.map(t => t.assignee_name),
    ...followups.map(f => f.assignee_name),
  ].filter(Boolean))];

  // Global stats
  const totalActiveCases = cases.filter(c => c.status === "in_progress").length;
  const totalUrgentCases = cases.filter(c => c.priority === "urgent").length;
  const totalPendingTasks = tasks.length;
  const totalUpcomingHearings = hearings.length;
  const pendingInvoices = invoices.filter(i => i.status === "pending" || i.status === "issued").length;
  const pendingAmount = invoices.filter(i => i.status === "pending" || i.status === "issued")
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <Shield className="w-14 h-14 mx-auto mb-3" style={{ color: "#B42318" }} />
          <p className="text-lg font-bold" style={{ color: TEXT }}>غير مصرح</p>
          <p className="text-sm mt-1" style={{ color: TEXT_SEC }}>هذه الصفحة للمسؤولين فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" dir="rtl" style={{ background: BG, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b px-5 py-4" style={{ borderColor: "#E7ECF3", boxShadow: "0 1px 8px rgba(18,62,124,0.06)" }}>
        <div className="flex items-center justify-between">
          <button onClick={loadData} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EAF2FF" }}>
            <RefreshCw className="w-4 h-4" style={{ color: PRIMARY }} />
          </button>
          <div className="text-right">
            <h1 className="text-base font-bold" style={{ color: TEXT }}>غرفة المراقبة</h1>
            <p className="text-xs" style={{ color: TEXT_SEC }}>أداء المحامين — للمسؤولين فقط</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">

        {/* Global KPIs */}
        <div>
          <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: TEXT_SEC }}>إحصائيات المكتب</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="قضايا نشطة" value={totalActiveCases} icon={Scale} color={PRIMARY} bg="#EAF2FF" loading={loading} />
            <StatCard label="قضايا عاجلة" value={totalUrgentCases} icon={AlertCircle} color="#B42318" bg="#FDECEC" loading={loading} />
            <StatCard label="مهام معلقة" value={totalPendingTasks} icon={CheckCircle2} color="#8A5A00" bg="#FFF4E5" loading={loading} />
            <StatCard label="جلسات قادمة" value={totalUpcomingHearings} icon={CalendarDays} color="#065F46" bg="#ECFDF5" loading={loading} />
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E7ECF3", boxShadow: "0 2px 8px rgba(18,62,124,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4" style={{ color: PRIMARY }} />
            <p className="text-sm font-bold" style={{ color: TEXT }}>الذمم المالية</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs" style={{ color: TEXT_SEC }}>فواتير معلقة</p>
              <p className="text-lg font-bold" style={{ color: "#B42318" }}>{loading ? "—" : pendingInvoices}</p>
            </div>
            <div className="h-10 w-px" style={{ backgroundColor: "#E7ECF3" }} />
            <div className="text-right">
              <p className="text-xs" style={{ color: TEXT_SEC }}>إجمالي مستحق</p>
              <p className="text-lg font-bold" style={{ color: DEEP }}>
                {loading ? "—" : `${pendingAmount.toLocaleString("ar-QA")} ر.ق`}
              </p>
            </div>
          </div>
        </div>

        {/* Lawyers Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "#EAF2FF", color: PRIMARY }}>
              {loading ? "—" : lawyers.length} محامٍ
            </span>
            <p className="text-sm font-bold" style={{ color: TEXT }}>أداء المحامين</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: PRIMARY }} />
              <p className="text-sm mt-3" style={{ color: TEXT_SEC }}>جارٍ تحميل البيانات...</p>
            </div>
          ) : lawyers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
              <p className="text-sm" style={{ color: TEXT_SEC }}>لا توجد بيانات محامين حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lawyers.map((lawyer, i) => (
                <LawyerCard
                  key={lawyer}
                  lawyer={lawyer}
                  cases={cases}
                  hearings={hearings}
                  tasks={tasks}
                  followups={followups}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}