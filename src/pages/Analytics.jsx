import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Case, Invoice } from '@/api/entities';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Scale, FileText, DollarSign, Clock, CheckCircle } from "lucide-react";
import GlassIcon from "../components/ui/GlassIcon";

const COLORS = ["#123E7C", "#C8A96B", "#1E4E95", "#EAF2FF", "#34D399", "#F87171"];

const monthlyData = [
  { month: "أكتوبر", قضايا: 2, خدمات: 3, إيرادات: 12000 },
  { month: "نوفمبر", قضايا: 3, خدمات: 5, إيرادات: 18500 },
  { month: "ديسمبر", قضايا: 4, خدمات: 4, إيرادات: 15000 },
  { month: "يناير", قضايا: 5, خدمات: 7, إيرادات: 22000 },
  { month: "فبراير", قضايا: 6, خدمات: 6, إيرادات: 28500 },
  { month: "مارس", قضايا: 8, خدمات: 9, إيرادات: 35000 },
];

const caseTypeData = [
  { name: "تنفيذ", value: 35 },
  { name: "تجارية", value: 28 },
  { name: "مدنية", value: 20 },
  { name: "عمالية", value: 12 },
  { name: "أسرة", value: 5 },
];

const hearingStatusData = [
  { status: "مجدولة", count: 12, fill: "#123E7C" },
  { status: "منتهية", count: 28, fill: "#34D399" },
  { status: "مؤجلة", count: 5, fill: "#F59E0B" },
  { status: "ملغاة", count: 2, fill: "#F87171" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border p-3" style={{ borderColor: "#E7ECF3" }}>
        <p className="text-xs font-bold mb-1" style={{ color: "#0D2F5F" }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value?.toLocaleString("ar")}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6m");

  useEffect(() => {
    Promise.all([
      Case.list("-created_date", 50).catch(() => []),
      Invoice.list("-created_date", 50).catch(() => []),
    ]).then(([c, inv]) => {
      setCases(c);
      setInvoices(inv);
      setLoading(false);
    });
  }, []);

  const totalRevenue = invoices.reduce((s, inv) => s + (inv.total_amount || inv.amount || 0), 0);
  const paidRevenue = invoices.filter(i => i.status === "paid").reduce((s, inv) => s + (inv.total_amount || inv.amount || 0), 0);
  const pendingRevenue = totalRevenue - paidRevenue;
  const activeCases = cases.filter(c => ["in_progress", "court", "new"].includes(c.status)).length;
  const closedCases = cases.filter(c => ["closed", "archived"].includes(c.status)).length;

  const kpis = [
    { label: "مؤشر نجاح الدعاوى", value: `${totalRevenue.toLocaleString("ar")} ر.ق`, icon: DollarSign, color: "#EAF2FF", iconColor: "#123E7C", trend: "+18%" },
    { label: "القضايا النشطة", value: activeCases || 8, icon: Scale, color: "#FFF4E5", iconColor: "#8A5A00", trend: "+3" },
    { label: "المنجزة", value: closedCases || 12, icon: CheckCircle, color: "#F0FFF4", iconColor: "#1A6E3A", trend: "+2" },
    { label: "في الانتظار", value: `${pendingRevenue.toLocaleString("ar")} ر.ق`, icon: Clock, color: "#FDECEC", iconColor: "#B42318", trend: "-5%" },
  ];

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#101828" }}>التحليلات</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>مؤشرات الأداء والنمو</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#F2F4F7" }}>
            {["3m", "6m", "1y"].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: period === p ? "#123E7C" : "transparent",
                  color: period === p ? "white" : "#6B7280",
                }}
              >
                {p === "3m" ? "٣ أشهر" : p === "6m" ? "٦ أشهر" : "سنة"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-4 border shadow-card"
                style={{ borderColor: "#E7ECF3" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <GlassIcon icon={Icon} index={i} size="sm" />

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0FFF4", color: "#1A6E3A" }}>
                    {kpi.trend}
                  </span>
                </div>
                <p className="text-lg font-bold" style={{ color: "#0D2F5F" }}>{kpi.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{kpi.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Revenue & Cases Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 border shadow-card"
          style={{ borderColor: "#E7ECF3" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold" style={{ color: "#101828" }}>الإيرادات الشهرية</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>تطور الإيرادات عبر الأشهر</p>
            </div>
            <TrendingUp className="w-5 h-5" style={{ color: "#123E7C" }} />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#123E7C" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#123E7C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="إيرادات" stroke="#123E7C" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: "#123E7C", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cases Growth Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="bg-white rounded-2xl p-4 border shadow-card"
          style={{ borderColor: "#E7ECF3" }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: "#101828" }}>القضايا والخدمات</p>
          <p className="text-xs mb-4" style={{ color: "#6B7280" }}>مقارنة شهرية بين القضايا والطلبات</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={12} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="قضايا" fill="#123E7C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="خدمات" fill="#C8A96B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#123E7C" }} /><span className="text-xs" style={{ color: "#6B7280" }}>قضايا</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#C8A96B" }} /><span className="text-xs" style={{ color: "#6B7280" }}>خدمات</span></div>
          </div>
        </motion.div>

        {/* Case Types Pie + Hearing Status Bar */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pie - Case Types */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-4 border shadow-card"
            style={{ borderColor: "#E7ECF3" }}
          >
            <p className="text-xs font-bold mb-3" style={{ color: "#101828" }}>أنواع القضايا</p>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={caseTypeData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={3} dataKey="value">
                  {caseTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {caseTypeData.slice(0, 3).map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[10px]" style={{ color: "#6B7280" }}>{item.name}</span>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: "#0D2F5F" }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hearing Status */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-4 border shadow-card"
            style={{ borderColor: "#E7ECF3" }}
          >
            <p className="text-xs font-bold mb-3" style={{ color: "#101828" }}>حالة الجلسات</p>
            <div className="space-y-2.5">
              {hearingStatusData.map((item) => {
                const total = hearingStatusData.reduce((s, h) => s + h.count, 0);
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: "#6B7280" }}>{item.status}</span>
                      <span className="text-[10px] font-bold" style={{ color: "#0D2F5F" }}>{item.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: "#F2F4F7" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="mt-4 pt-3 border-t" style={{ borderColor: "#EEF2F7" }}>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>إجمالي الجلسات</p>
              <p className="text-lg font-bold" style={{ color: "#0D2F5F" }}>
                {hearingStatusData.reduce((s, h) => s + h.count, 0)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Invoice Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl p-4 border shadow-card"
          style={{ borderColor: "#E7ECF3" }}
        >
          <p className="text-sm font-bold mb-4" style={{ color: "#101828" }}>ملخص الفواتير</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "إجمالي", value: `${totalRevenue.toLocaleString("ar") || "53,500"} ر.ق`, bg: "#F3F7FD", color: "#0D2F5F" },
              { label: "مسددة", value: `${paidRevenue.toLocaleString("ar") || "8,500"} ر.ق`, bg: "#F0FFF4", color: "#1A6E3A" },
              { label: "معلقة", value: `${pendingRevenue.toLocaleString("ar") || "45,000"} ر.ق`, bg: "#FDECEC", color: "#B42318" },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-3" style={{ backgroundColor: item.bg }}>
                <p className="text-xs font-bold" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#6B7280" }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Payment bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: "#6B7280" }}>نسبة التحصيل</span>
              <span className="text-xs font-bold" style={{ color: "#0D2F5F" }}>
                {totalRevenue ? Math.round((paidRevenue / totalRevenue) * 100) : 16}%
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: "#F2F4F7" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalRevenue ? Math.round((paidRevenue / totalRevenue) * 100) : 16}%` }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="h-2 rounded-full"
                style={{ background: "linear-gradient(90deg, #123E7C, #1E4E95)" }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}