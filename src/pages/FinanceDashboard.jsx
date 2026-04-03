import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, Plus, FileText, DollarSign, TrendingUp,
  TrendingDown, Clock, CheckCircle, X, Loader2, Upload,
  Receipt, ChevronLeft, AlertCircle
} from "lucide-react";
import { jsPDF } from "jspdf";
import FinanceOverview from "@/components/finance/FinanceOverview";

const expenseCategoryMap = {
  office_supplies: "مستلزمات مكتبية",
  transportation: "مواصلات",
  communication: "اتصالات",
  salaries: "رواتب",
  rent: "إيجار",
  utilities: "مرافق",
  legal_fees: "رسوم قانونية",
  other: "أخرى",
};

const invoiceStatusMap = {
  draft: { label: "مسودة", bg: "#F2F4F7", text: "#526071" },
  issued: { label: "مُصدرة", bg: "#EAF2FF", text: "#123E7C" },
  pending: { label: "بانتظار الدفع", bg: "#FFF4E5", text: "#8A5A00" },
  paid: { label: "مدفوعة", bg: "#F0FFF4", text: "#1A6E3A" },
  overdue: { label: "متأخرة", bg: "#FDECEC", text: "#B42318" },
  cancelled: { label: "ملغاة", bg: "#F2F4F7", text: "#526071" },
};

const TABS = ["الفواتير", "المصروفات", "التقرير"];

const ICON_GRADIENTS = [
  "linear-gradient(145deg, #1E4E95, #2563EB)",
  "linear-gradient(145deg, #0D7A5F, #059669)",
  "linear-gradient(145deg, #B45309, #F59E0B)",
  "linear-gradient(145deg, #0D7A5F, #10B981)",
];

function GradientIcon({ icon: Icon, gradient }) {
  return (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0"
      style={{ background: gradient, boxShadow: "0 8px 20px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.55)" }}>
      <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)" }} />
      <Icon className="w-4 h-4 relative z-10 text-white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }} />
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="bg-white rounded-2xl border p-3 flex items-center gap-3" style={{ borderColor: "#E7ECF3" }}>
      <GradientIcon icon={Icon} gradient={gradient} />
      <div className="min-w-0">
        <p className="text-base font-bold" style={{ color: "#101828" }}>{value}</p>
        <p className="text-[10px]" style={{ color: "#6B7280" }}>{label}</p>
      </div>
    </div>
  );
}

// ──────── Invoice Form ────────
function InvoiceForm({ cases, onSave, onClose }) {
  const [form, setForm] = useState({
    case_id: "", client_name: "", service_description: "",
    amount: "", due_date: "", notes: "", status: "issued"
  });
  const [saving, setSaving] = useState(false);

  const handleCaseSelect = (caseId) => {
    const c = cases.find(x => x.id === caseId);
    setForm(f => ({ ...f, case_id: caseId, case_title: c?.title || "", client_name: c?.client_name || "", client_id: c?.client_id || "" }));
  };

  const handleSubmit = async () => {
    if (!form.client_name || !form.amount) return;
    setSaving(true);
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    const amt = parseFloat(form.amount) || 0;
    const vat = Math.round(amt * 0.15 * 100) / 100;
    await base44.entities.Invoice.create({
      ...form,
      invoice_number: invoiceNum,
      amount: amt,
      vat_amount: vat,
      total_amount: Math.round((amt + vat) * 100) / 100,
    });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto"
      style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
      <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: "#101828" }}>فاتورة جديدة</h3>
        <button onClick={onClose}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>القضية (اختياري)</label>
          <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            value={form.case_id} onChange={e => handleCaseSelect(e.target.value)}>
            <option value="">— بدون قضية —</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.title} ({c.client_name})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>اسم العميل *</label>
          <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="اسم العميل" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>وصف الخدمة *</label>
          <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="وصف الخدمة القانونية" value={form.service_description} onChange={e => setForm(f => ({ ...f, service_description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>المبلغ (ر.ق) *</label>
            <input type="number" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#6B7280" }}>تاريخ الاستحقاق</label>
            <input type="date" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
              value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
        </div>
        {form.amount && (
          <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "#F3F7FD" }}>
            <div className="flex justify-between"><span style={{ color: "#6B7280" }}>المبلغ</span><span style={{ color: "#101828" }}>{parseFloat(form.amount || 0).toLocaleString("ar")} ر.ق</span></div>
            <div className="flex justify-between mt-1"><span style={{ color: "#6B7280" }}>ضريبة 15%</span><span style={{ color: "#101828" }}>{(parseFloat(form.amount || 0) * 0.15).toFixed(2)} ر.ق</span></div>
            <div className="flex justify-between mt-1 font-bold border-t pt-1" style={{ borderColor: "#D4E4F7" }}>
              <span style={{ color: "#101828" }}>الإجمالي</span>
              <span style={{ color: "#123E7C" }}>{(parseFloat(form.amount || 0) * 1.15).toFixed(2)} ر.ق</span>
            </div>
          </div>
        )}
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={saving || !form.client_name || !form.amount}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {saving ? "جارٍ الحفظ..." : "إنشاء الفاتورة"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ──────── Expense Form ────────
function ExpenseForm({ cases, onSave, onClose }) {
  const [form, setForm] = useState({ title: "", amount: "", category: "office_supplies", date: new Date().toISOString().split("T")[0], case_id: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return;
    setSaving(true);
    const c = cases.find(x => x.id === form.case_id);
    await base44.entities.Expense.create({ ...form, amount: parseFloat(form.amount), case_title: c?.title || "" });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-5 pb-10"
      style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
      <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: "#101828" }}>مصروف جديد</h3>
        <button onClick={onClose}><X className="w-5 h-5" style={{ color: "#6B7280" }} /></button>
      </div>
      <div className="space-y-3">
        <input className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="عنوان المصروف *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            placeholder="المبلغ (ر.ق) *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <input type="date" className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
            value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          {Object.entries(expenseCategoryMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="w-full border rounded-xl px-3 h-11 text-sm outline-none" style={{ borderColor: "#E7ECF3" }}
          value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}>
          <option value="">— غير مرتبط بقضية —</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "#E7ECF3" }}
          placeholder="ملاحظات..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={saving || !form.title || !form.amount}
          className="w-full h-12 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {saving ? "جارٍ الحفظ..." : "حفظ المصروف"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ──────── Main Page ────────
export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("الفواتير");
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [inv, exp, c] = await Promise.all([
      base44.entities.Invoice.list("-created_date", 50).catch(() => []),
      base44.entities.Expense.list("-date", 50).catch(() => []),
      base44.entities.Case.filter({ status: "in_progress" }, "-updated_date", 50).catch(() => []),
    ]);
    setInvoices(inv);
    setExpenses(exp);
    setCases(c);
    setLoading(false);
  };

  // Stats
  const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPending = invoices.filter(i => ["pending", "issued"].includes(i.status)).reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalPaid - totalExpenses;

  const handleUpdateInvoiceStatus = async (inv, status) => {
    await base44.entities.Invoice.update(inv.id, { status, ...(status === "paid" ? { paid_date: new Date().toISOString().split("T")[0] } : {}) });
    loadAll();
  };

  const handleExportPDF = async () => {
    setExporting(true);
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const m = 20;
    let y = 20;

    doc.setFillColor(18, 62, 124);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text("تقرير الربحية - المكتب القانوني", pageW - m, y, { align: "right" });
    doc.setFontSize(9);
    y += 7;
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString("ar-QA")}`, pageW - m, y, { align: "right" });
    y = 42;

    doc.setTextColor(16, 24, 40);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("ملخص مالي", pageW - m, y, { align: "right" });
    y += 8;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    [
      ["إجمالي الفواتير", `${totalInvoiced.toFixed(2)} ر.ق`],
      ["المبالغ المحصلة", `${totalPaid.toFixed(2)} ر.ق`],
      ["المبالغ المعلقة", `${totalPending.toFixed(2)} ر.ق`],
      ["إجمالي المصروفات", `${totalExpenses.toFixed(2)} ر.ق`],
      ["صافي الربح", `${profit.toFixed(2)} ر.ق`],
    ].forEach(([label, val]) => {
      doc.setFillColor(247, 248, 250);
      doc.rect(m, y - 4, pageW - m * 2, 8, "F");
      doc.setTextColor(107, 114, 128);
      doc.text(label, pageW - m - 2, y, { align: "right" });
      doc.setTextColor(16, 24, 40);
      doc.setFont(undefined, "bold");
      doc.text(val, m + 2, y);
      doc.setFont(undefined, "normal");
      y += 10;
    });

    y += 5;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("الفواتير", pageW - m, y, { align: "right" });
    y += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");

    invoices.forEach(inv => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(234, 242, 255);
      doc.rect(m, y - 4, pageW - m * 2, 8, "F");
      doc.setTextColor(107, 114, 128);
      doc.text(`${inv.client_name} — ${invoiceStatusMap[inv.status]?.label || inv.status}`, pageW - m - 2, y, { align: "right" });
      doc.setTextColor(16, 24, 40);
      doc.setFont(undefined, "bold");
      doc.text(`${(inv.total_amount || 0).toFixed(2)} ر.ق`, m + 2, y);
      doc.setFont(undefined, "normal");
      y += 9;
    });

    y += 5;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("المصروفات", pageW - m, y, { align: "right" });
    y += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");

    expenses.forEach(exp => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(255, 244, 229);
      doc.rect(m, y - 4, pageW - m * 2, 8, "F");
      doc.setTextColor(107, 114, 128);
      doc.text(`${exp.title} — ${expenseCategoryMap[exp.category] || exp.category}`, pageW - m - 2, y, { align: "right" });
      doc.setTextColor(16, 24, 40);
      doc.setFont(undefined, "bold");
      doc.text(`${(exp.amount || 0).toFixed(2)} ر.ق`, m + 2, y);
      doc.setFont(undefined, "normal");
      y += 9;
    });

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("الاتفاق للمحاماة والاستشارات القانونية", pageW / 2, 290, { align: "center" });
    }

    doc.save(`تقرير-مالي-${new Date().toLocaleDateString("ar-QA").replace(/\//g, "-")}.pdf`);
    setExporting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#123E7C" }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-3 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
            <ArrowRight className="w-4 h-4" style={{ color: "#101828" }} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "#101828" }}>الفواتير والمصروفات</h1>
          </div>
          <button onClick={handleExportPDF} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "#123E7C" }}>
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={{ backgroundColor: activeTab === tab ? "#123E7C" : "#F2F4F7", color: activeTab === tab ? "white" : "#6B7280" }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">

        {/* Finance Overview Dashboard */}
        <FinanceOverview />

        <hr style={{ borderColor: '#EEF2F7' }} />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard icon={DollarSign} label="إجمالي الفواتير" value={`${totalInvoiced.toLocaleString("ar", { maximumFractionDigits: 0 })} ر.ق`} gradient={ICON_GRADIENTS[0]} />
          <SummaryCard icon={CheckCircle} label="محصّل" value={`${totalPaid.toLocaleString("ar", { maximumFractionDigits: 0 })} ر.ق`} gradient={ICON_GRADIENTS[1]} />
          <SummaryCard icon={TrendingDown} label="مصروفات" value={`${totalExpenses.toLocaleString("ar", { maximumFractionDigits: 0 })} ر.ق`} gradient={ICON_GRADIENTS[2]} />
          <SummaryCard icon={profit >= 0 ? TrendingUp : TrendingDown} label="صافي الربح" value={`${profit.toLocaleString("ar", { maximumFractionDigits: 0 })} ر.ق`} gradient={ICON_GRADIENTS[3]} />
        </div>

        {/* ── Invoices Tab ── */}
        <AnimatePresence mode="wait">
          {activeTab === "الفواتير" && (
            <motion.div key="inv" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <button onClick={() => setShowInvoiceForm(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ borderColor: "#D4E4F7", color: "#123E7C" }}>
                <Plus className="w-4 h-4" /> فاتورة جديدة
              </button>
              {invoices.length === 0 && (
                <div className="text-center py-10 text-sm" style={{ color: "#6B7280" }}>لا توجد فواتير بعد</div>
              )}
              {invoices.map((inv, i) => {
                const st = invoiceStatusMap[inv.status] || invoiceStatusMap.issued;
                return (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: "#101828" }}>{inv.client_name}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>{inv.service_description || inv.case_title || "—"}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>#{inv.invoice_number}</p>
                      </div>
                      <div className="text-left flex-shrink-0 mr-3">
                        <p className="text-base font-bold" style={{ color: "#101828" }}>{(inv.total_amount || 0).toLocaleString("ar", { maximumFractionDigits: 0 })} ر.ق</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                      </div>
                    </div>
                    {inv.due_date && (
                      <p className="text-xs mb-2" style={{ color: "#6B7280" }}>الاستحقاق: {new Date(inv.due_date).toLocaleDateString("ar-QA")}</p>
                    )}
                    {["issued", "pending"].includes(inv.status) && (
                      <button onClick={() => handleUpdateInvoiceStatus(inv, "paid")}
                        className="w-full py-2 rounded-xl text-xs font-semibold"
                        style={{ backgroundColor: "#F0FFF4", color: "#1A6E3A" }}>
                        ✓ تأكيد الدفع
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── Expenses Tab ── */}
          {activeTab === "المصروفات" && (
            <motion.div key="exp" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <button onClick={() => setShowExpenseForm(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ borderColor: "#D4E4F7", color: "#123E7C" }}>
                <Plus className="w-4 h-4" /> مصروف جديد
              </button>
              {expenses.length === 0 && (
                <div className="text-center py-10 text-sm" style={{ color: "#6B7280" }}>لا توجد مصروفات مسجلة</div>
              )}
              {expenses.map((exp, i) => (
                <motion.div key={exp.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E7ECF3" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FDECEC" }}>
                    <Receipt className="w-4 h-4" style={{ color: "#B42318" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "#101828" }}>{exp.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{expenseCategoryMap[exp.category] || exp.category} • {exp.date ? new Date(exp.date).toLocaleDateString("ar-QA") : ""}</p>
                    {exp.case_title && <p className="text-xs" style={{ color: "#6B7280" }}>قضية: {exp.case_title}</p>}
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: "#B42318" }}>{(exp.amount || 0).toLocaleString("ar")} ر.ق</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── Report Tab ── */}
          {activeTab === "التقرير" && (
            <motion.div key="rep" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
                <p className="text-sm font-bold mb-3" style={{ color: "#101828" }}>تقرير الربحية</p>
                {[
                  { label: "إجمالي الفواتير", value: totalInvoiced, color: "#123E7C" },
                  { label: "المبالغ المحصلة", value: totalPaid, color: "#1A6E3A" },
                  { label: "المبالغ المعلقة", value: totalPending, color: "#8A5A00" },
                  { label: "إجمالي المصروفات", value: totalExpenses, color: "#B42318" },
                ].map(row => {
                  const pct = totalInvoiced > 0 ? Math.round((row.value / totalInvoiced) * 100) : 0;
                  return (
                    <div key={row.label} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs" style={{ color: "#6B7280" }}>{row.label}</span>
                        <span className="text-xs font-bold" style={{ color: row.color }}>{row.value.toLocaleString("ar", { maximumFractionDigits: 0 })} ر.ق</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ backgroundColor: "#F2F4F7" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.7 }}
                          className="h-full rounded-full" style={{ backgroundColor: row.color }} />
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3 flex items-center justify-between" style={{ borderColor: "#EEF2F7" }}>
                  <span className="text-sm font-bold" style={{ color: "#101828" }}>صافي الربح</span>
                  <span className="text-base font-bold" style={{ color: profit >= 0 ? "#1A6E3A" : "#B42318" }}>
                    {profit >= 0 ? "+" : ""}{profit.toLocaleString("ar", { maximumFractionDigits: 0 })} ر.ق
                  </span>
                </div>
              </div>

              {/* Expenses by Category */}
              <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
                <p className="text-sm font-bold mb-3" style={{ color: "#101828" }}>المصروفات حسب الفئة</p>
                {Object.entries(expenseCategoryMap).map(([key, label]) => {
                  const total = expenses.filter(e => e.category === key).reduce((s, e) => s + (e.amount || 0), 0);
                  if (total === 0) return null;
                  const pct = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#F2F4F7" }}>
                      <span className="text-xs" style={{ color: "#6B7280" }}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#6B7280" }}>{pct}%</span>
                        <span className="text-xs font-bold" style={{ color: "#B42318" }}>{total.toLocaleString("ar")} ر.ق</span>
                      </div>
                    </div>
                  );
                })}
                {totalExpenses === 0 && <p className="text-xs text-center py-4" style={{ color: "#6B7280" }}>لا توجد مصروفات</p>}
              </div>

              <button onClick={handleExportPDF} disabled={exporting}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#123E7C" }}>
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {exporting ? "جارٍ التصدير..." : "تصدير تقرير PDF"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showInvoiceForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowInvoiceForm(false)} />
            <InvoiceForm cases={cases} onSave={loadAll} onClose={() => setShowInvoiceForm(false)} />
          </>
        )}
        {showExpenseForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowExpenseForm(false)} />
            <ExpenseForm cases={cases} onSave={loadAll} onClose={() => setShowExpenseForm(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}