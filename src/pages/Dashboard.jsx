import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Upload, MessageCircle, RefreshCw, Calendar,
  FileText, Bot, PenTool
} from "lucide-react";
import StatusChip from "../components/ui/StatusChip";
import SmartGridCalendar from "../components/dashboard/SmartGridCalendar";

const quickActions = [
  { key: "upload", label: "رفع مستند", icon: Upload, path: "/vault" },
  { key: "lawyer", label: "مراسلة المحامي", icon: MessageCircle, path: "/messages" },
  { key: "signing", label: "التوقيعات", icon: PenTool, path: "/signing" },
  { key: "meeting", label: "حجز موعد", icon: Calendar, path: "/appointments" },
  { key: "billing", label: "الفواتير", icon: FileText, path: "/billing" },
  { key: "ai", label: "المساعد الذكي", icon: Bot, path: "/ai" },
];

const glassGradients = [
  "linear-gradient(145deg, #7C3AED, #4F46E5)",
  "linear-gradient(145deg, #EC4899, #8B5CF6)",
  "linear-gradient(145deg, #3B82F6, #06B6D4)",
  "linear-gradient(145deg, #10B981, #3B82F6)",
  "linear-gradient(145deg, #F59E0B, #EF4444)",
  "linear-gradient(145deg, #8B5CF6, #EC4899)",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [nextHearing, setNextHearing] = useState(null);
  useEffect(() => {
    Promise.all([
      base44.entities.CaseTask.filter({ status: "pending" }, "due_date", 5).catch(() => []),
      base44.entities.Invoice.filter({ status: "issued" }, "-created_date", 5).catch(() => []),
      base44.entities.Hearing.filter({ status: "scheduled" }, "date", 1).catch(() => []),
    ]).then(([t, inv, h]) => {
      setTasks(t);
      setInvoices(inv);
      setNextHearing(h[0] || null);
    });
  }, []);

  const totalDue = invoices.reduce((s, inv) => s + (inv.total_amount || inv.amount || 0), 0);
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const totalPaid = paidInvoices.reduce((s, inv) => s + (inv.total_amount || inv.amount || 0), 0);

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white flex items-center justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color: "#6B7280" }}>مشفر • سري • مخصص لك</p>
        </div>
      </div>

      <div className="px-5 space-y-5 pt-4">
        {/* Smart Grid Calendar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold" style={{ color: "#101828" }}>التقويم القضائي</h3>
            <button className="text-sm font-semibold" style={{ color: "#123E7C" }} onClick={() => navigate("/appointments")}>
              عرض المواعيد
            </button>
          </div>
          <SmartGridCalendar />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-base font-bold mb-3" style={{ color: "#101828" }}>الإجراءات السريعة</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  whileTap={{ scale: 0.95, y: 2 }}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(action.path)}
                  className="rounded-2xl p-4 flex flex-col items-center gap-2 border"
                  style={{
                    borderColor: "rgba(255,255,255,0.6)",
                    minHeight: "94px",
                    background: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "0 4px 16px rgba(18,62,124,0.10), inset 0 1px 1px rgba(255,255,255,0.8)",
                  }}
                >
                  {/* Glassmorphism 3D icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: glassGradients[i % glassGradients.length],
                      boxShadow: "0 8px 20px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.1)",
                    }}
                  >
                    {/* top shine */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl"
                      style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)" }} />
                    {/* bottom depth */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-2xl"
                      style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 100%)" }} />
                    <Icon className="w-5 h-5 relative z-10 drop-shadow" style={{ color: "white", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }} />
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight" style={{ color: "#0D2F5F" }}>
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Action Center - Tasks from DB */}
        {tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-4 border"
            style={{ borderColor: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.45)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 4px 20px rgba(18,62,124,0.10), inset 0 1px 1px rgba(255,255,255,0.8)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FDECEC" }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#B42318" }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: "#101828" }}>إجراءات مطلوبة ({tasks.length})</h3>
            </div>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#E0ECF7" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "#101828" }}>{task.title}</p>
                    {task.case_title && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{task.case_title}</p>}
                  </div>
                  <button
                    onClick={() => task.case_id && navigate(`/cases/${task.case_id}`)}
                    className="text-xs font-semibold px-3 py-1 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: "#123E7C", color: "white" }}
                  >
                    عرض
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Billing Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => navigate("/billing")} className="bg-white rounded-2xl p-4 shadow-card border cursor-pointer" style={{ borderColor: "#E7ECF3" }}>
            <p className="text-xs" style={{ color: "#6B7280" }}>الفواتير المستحقة</p>
            <p className="text-lg font-bold mt-1" style={{ color: "#0D2F5F" }}>
              {totalDue > 0 ? `${totalDue.toLocaleString("ar")} ر.ق` : "—"}
            </p>
          </div>
          <div onClick={() => navigate("/cases")} className="bg-white rounded-2xl p-4 shadow-card border cursor-pointer" style={{ borderColor: "#E7ECF3" }}>
            <p className="text-xs" style={{ color: "#6B7280" }}>المهام المعلقة</p>
            <p className="text-lg font-bold mt-1" style={{ color: "#0D2F5F" }}>{tasks.length || 0}</p>
          </div>
        </div>

        {/* Next Hearing */}
        {nextHearing && (
          <div className="bg-white rounded-2xl p-4 shadow-card border flex items-center justify-between" style={{ borderColor: "#E7ECF3" }}>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#6B7280" }}>الجلسة القادمة</p>
              <p className="text-sm font-bold" style={{ color: "#101828" }}>{nextHearing.case_title || nextHearing.court_name}</p>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                {nextHearing.court_name} • {nextHearing.date ? new Date(nextHearing.date).toLocaleDateString("ar-QA") : ""} {nextHearing.time && `• ${nextHearing.time}`}
              </p>
            </div>
            <button
              className="px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
              style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}
              onClick={() => nextHearing.case_id && navigate(`/cases/${nextHearing.case_id}`)}
            >
              عرض الملف
            </button>
          </div>
        )}
      </div>
    </div>
  );
}