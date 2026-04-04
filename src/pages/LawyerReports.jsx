import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Compat";
import { Case, FollowUp, Invoice } from '@/api/entities';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, Calendar, Loader2, TrendingUp } from "lucide-react";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const DEEP = "#0D2F5F";
const BG = "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)";

export default function LawyerReports() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    generateReport();
  }, [month, year]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const [allCases, allInvoices, allFollowUps] = await Promise.all([
        Case.list("-updated_date", 500).catch(() => []),
        Invoice.list("-created_date", 500).catch(() => []),
        FollowUp.list("-created_date", 500).catch(() => []),
      ]);

      // Filter by date range
      const casesInRange = allCases.filter(c => {
        const updatedDate = c.updated_date || c.created_date;
        return updatedDate >= startDateStr && updatedDate <= endDateStr;
      });

      const invoicesInRange = allInvoices.filter(i => {
        const createdDate = i.created_date;
        return createdDate >= startDateStr && createdDate <= endDateStr;
      });

      const followupsInRange = allFollowUps.filter(f => {
        const createdDate = f.created_date;
        return createdDate >= startDateStr && createdDate <= endDateStr;
      });

      // Calculate metrics
      const closedCases = casesInRange.filter(c => c.status === "closed").length;
      const activeCases = casesInRange.filter(c => ["in_progress", "court"].includes(c.status)).length;
      const totalRevenue = invoicesInRange.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total_amount || i.amount || 0), 0);
      const pendingRevenue = invoicesInRange.filter(i => ["pending", "issued"].includes(i.status)).reduce((sum, i) => sum + (i.total_amount || i.amount || 0), 0);
      const completedFollowups = followupsInRange.filter(f => f.status === "completed").length;

      // Case status breakdown
      const casesByStatus = {
        closed: closedCases,
        active: activeCases,
        other: casesInRange.length - closedCases - activeCases,
      };

      // Revenue breakdown
      const invoicesByStatus = {
        paid: invoicesInRange.filter(i => i.status === "paid").length,
        pending: invoicesInRange.filter(i => ["pending", "issued"].includes(i.status)).length,
        overdue: invoicesInRange.filter(i => i.status === "overdue").length,
      };

      setReportData({
        month: startDate.toLocaleDateString("ar-SA", { month: "long", year: "numeric" }),
        closedCases,
        activeCases,
        totalCases: casesInRange.length,
        totalRevenue,
        pendingRevenue,
        totalInvoices: invoicesInRange.length,
        completedFollowups,
        totalFollowups: followupsInRange.length,
        casesByStatus,
        invoicesByStatus,
        casesData: casesInRange,
        invoicesData: invoicesInRange,
      });

      // Generate chart data for monthly trend (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        const startStr = d.toISOString().split("T")[0];
        const endStr = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];

        const casesClosed = allCases.filter(c => 
          c.status === "closed" && 
          c.updated_date >= startStr && 
          c.updated_date <= endStr
        ).length;

        const revenue = allInvoices.filter(i => 
          i.status === "paid" && 
          i.created_date >= startStr && 
          i.created_date <= endStr
        ).reduce((sum, i) => sum + (i.total_amount || i.amount || 0), 0);

        monthlyData.push({
          month: d.toLocaleDateString("ar-SA", { month: "short" }),
          cases: casesClosed,
          revenue: Math.round(revenue),
        });
      }
      setChartData(monthlyData);
    } catch (error) {
      console.error("خطأ في توليد التقرير:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!reportData) return;
    setExporting(true);

    try {
      const response = await base44.functions.invoke("generateLawyerReportPDF", {
        reportData,
        month: `${month}/${year}`,
      });

      if (response.data?.file_url) {
        const link = document.createElement("a");
        link.href = response.data.file_url;
        link.download = `تقرير-${month}-${year}.pdf`;
        link.click();
      }
    } catch (error) {
      console.error("خطأ في التصدير:", error);
      alert("فشل تصدير التقرير");
    } finally {
      setExporting(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY }} />
          <p className="text-sm" style={{ color: TEXT_SEC }}>جارٍ توليد التقرير...</p>
        </div>
      </div>
    );
  }

  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const caseStatusData = reportData ? [
    { name: "مغلقة", value: reportData.casesByStatus.closed, color: "#10B981" },
    { name: "نشطة", value: reportData.casesByStatus.active, color: PRIMARY },
    { name: "أخرى", value: reportData.casesByStatus.other, color: "#9CA3AF" },
  ] : [];

  return (
    <div className="min-h-screen pb-8" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <h1 className="text-2xl font-bold mb-4" style={{ color: TEXT }}>تقارير الأداء</h1>
        
        {/* Month/Year Selector */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: TEXT_SEC }}>الشهر</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full rounded-lg px-3 py-2 border text-sm outline-none"
              style={{ borderColor: "#E7ECF3", color: TEXT }}
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: TEXT_SEC }}>السنة</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full rounded-lg px-3 py-2 border text-sm outline-none"
              style={{ borderColor: "#E7ECF3", color: TEXT }}
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={exportPDF}
            disabled={exporting || !reportData}
            className="mt-5 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
            style={{ backgroundColor: PRIMARY, color: "white" }}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            تصدير PDF
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Main Metrics */}
        {reportData && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "القضايا المغلقة", value: reportData.closedCases, icon: "📋", color: "#10B981" },
                { label: "القضايا النشطة", value: reportData.activeCases, icon: "⚖️", color: PRIMARY },
                { label: "المبالغ المحصلة", value: `${reportData.totalRevenue.toLocaleString()} ر.ق`, icon: "💰", color: "#F59E0B" },
                { label: "مستحق الدفع", value: `${reportData.pendingRevenue.toLocaleString()} ر.ق`, icon: "📊", color: "#8B5CF6" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-4 border"
                  style={{ borderColor: "#E7ECF3", boxShadow: "0 2px 8px rgba(18,62,124,0.06)" }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs" style={{ color: TEXT_SEC }}>{item.label}</p>
                      <p className="text-lg font-bold mt-2" style={{ color: item.color }}>
                        {item.value}
                      </p>
                    </div>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cases Pie Chart */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border"
                style={{ borderColor: "#E7ECF3" }}
              >
                <h3 className="font-bold mb-3" style={{ color: TEXT }}>توزيع القضايا</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={caseStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {caseStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => value}
                      contentStyle={{ backgroundColor: "white", border: "1px solid #E7ECF3", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs mt-3">
                  {caseStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Monthly Trend Chart */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-4 border"
                style={{ borderColor: "#E7ECF3" }}
              >
                <h3 className="font-bold mb-3" style={{ color: TEXT }}>الاتجاهات الشهرية</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7ECF3" />
                    <XAxis dataKey="month" stroke={TEXT_SEC} style={{ fontSize: "12px" }} />
                    <YAxis stroke={TEXT_SEC} style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "white", border: "1px solid #E7ECF3", borderRadius: "8px" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cases"
                      stroke={PRIMARY}
                      strokeWidth={2}
                      dot={{ fill: PRIMARY, r: 4 }}
                      name="القضايا المغلقة"
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: "#10B981", r: 4 }}
                      name="الإيرادات"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E7ECF3" }}>
              <h3 className="font-bold mb-4" style={{ color: TEXT }}>ملخص الشهر</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "إجمالي الفواتير", value: reportData.totalInvoices },
                  { label: "الفواتير المدفوعة", value: reportData.invoicesByStatus.paid },
                  { label: "الفواتير المعلقة", value: reportData.invoicesByStatus.pending },
                  { label: "المتابعات المنجزة", value: reportData.completedFollowups },
                  { label: "إجمالي المتابعات", value: reportData.totalFollowups },
                  { label: "نسبة الإنجاز", value: reportData.totalFollowups > 0 ? `${Math.round((reportData.completedFollowups / reportData.totalFollowups) * 100)}%` : "—" },
                ].map((item) => (
                  <div key={item.label} className="border-t pt-3" style={{ borderColor: "#E7ECF3" }}>
                    <p style={{ color: TEXT_SEC }}>{item.label}</p>
                    <p className="text-lg font-bold mt-1" style={{ color: DEEP }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}