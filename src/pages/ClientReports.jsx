import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ArrowRight, TrendingUp, DollarSign, Calendar, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#123E7C", "#C8A96B", "#EAF2FF"];

export default function ClientReports() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Case.list("-updated_date", 50).catch(() => []),
      base44.entities.Invoice.list("-created_date", 50).catch(() => []),
    ]).then(([c, inv]) => {
      setCases(c);
      setInvoices(inv);
      setLoading(false);
    });
  }, []);

  // Financial data per case
  const caseFinancials = cases
    .filter(c => c.amount_under_enforcement > 0)
    .map(c => ({
      name: c.title?.slice(0, 14) + (c.title?.length > 14 ? "..." : ""),
      مطلوب: c.amount_under_enforcement || 0,
      محصل: c.amount_recovered || 0,
      متبقي: (c.amount_under_enforcement || 0) - (c.amount_recovered || 0),
    }));

  const totalRequired = cases.reduce((s, c) => s + (c.amount_under_enforcement || 0), 0);
  const totalRecovered = cases.reduce((s, c) => s + (c.amount_recovered || 0), 0);
  const totalRemaining = totalRequired - totalRecovered;

  const pieData = [
    { name: "محصل", value: totalRecovered },
    { name: "متبقي", value: totalRemaining },
  ].filter(d => d.value > 0);

  // Upcoming invoices
  const pendingInvoices = invoices
    .filter(inv => ["issued", "pending", "overdue"].includes(inv.status))
    .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));

  const statusLabels = { issued: "مستحقة", pending: "معلقة", overdue: "متأخرة", paid: "مدفوعة" };
  const statusColors = { issued: "#FFF4E5", overdue: "#FDECEC", pending: "#EAF2FF" };
  const statusTextColors = { issued: "#8A5A00", overdue: "#B42318", pending: "#123E7C" };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#123E7C" }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
          <ArrowRight className="w-4 h-4" style={{ color: "#101828" }} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#101828" }}>التقارير المالية</h1>
          <p className="text-xs" style={{ color: "#6B7280" }}>نظرة شاملة على الملفات المالية</p>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "إجمالي المطلوب", value: totalRequired, color: "#0D2F5F" },
            { label: "المحصل", value: totalRecovered, color: "#1A6E3A" },
            { label: "المتبقي", value: totalRemaining, color: "#B42318" },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl p-3 border shadow-card text-center"
              style={{ borderColor: "#E7ECF3" }}
            >
              <p className="text-[10px] leading-tight mb-1" style={{ color: "#6B7280" }}>{card.label}</p>
              <p className="text-xs font-bold" style={{ color: card.color }}>
                {card.value > 0 ? `${card.value.toLocaleString("ar")}` : "—"}
              </p>
              <p className="text-[9px]" style={{ color: "#6B7280" }}>ر.ق</p>
            </motion.div>
          ))}
        </div>

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border shadow-card" style={{ borderColor: "#E7ECF3" }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" style={{ color: "#123E7C" }} />
              <p className="text-sm font-bold" style={{ color: "#101828" }}>نسبة التحصيل</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 11, color: "#101828" }}>{value}</span>} />
                <Tooltip formatter={(v) => [`${v.toLocaleString("ar")} ر.ق`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart */}
        {caseFinancials.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border shadow-card" style={{ borderColor: "#E7ECF3" }}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4" style={{ color: "#123E7C" }} />
              <p className="text-sm font-bold" style={{ color: "#101828" }}>المبالغ حسب القضية</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={caseFinancials} layout="vertical" margin={{ right: 10, left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: "#6B7280" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#6B7280" }} width={60} />
                <Tooltip formatter={(v) => [`${v.toLocaleString("ar")} ر.ق`]} />
                <Bar dataKey="محصل" fill="#123E7C" radius={[0, 4, 4, 0]} />
                <Bar dataKey="متبقي" fill="#C8A96B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment Schedule */}
        <div className="bg-white rounded-2xl p-4 border shadow-card" style={{ borderColor: "#E7ECF3" }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4" style={{ color: "#123E7C" }} />
            <p className="text-sm font-bold" style={{ color: "#101828" }}>جدول الدفعات القادمة</p>
          </div>
          {pendingInvoices.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "#6B7280" }}>لا توجد دفعات مستحقة</p>
          ) : (
            <div className="space-y-2">
              {pendingInvoices.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                  style={{ backgroundColor: statusColors[inv.status] || "#F7F8FA" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "#101828" }}>{inv.service_description || inv.invoice_number}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#6B7280" }}>
                      {inv.due_date ? `الاستحقاق: ${new Date(inv.due_date).toLocaleDateString("ar-QA")}` : "—"}
                    </p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="text-xs font-bold" style={{ color: statusTextColors[inv.status] || "#101828" }}>
                      {(inv.total_amount || inv.amount || 0).toLocaleString("ar")} ر.ق
                    </p>
                    <p className="text-[10px]" style={{ color: statusTextColors[inv.status] || "#6B7280" }}>
                      {statusLabels[inv.status] || inv.status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}