import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, CheckCircle, Clock, AlertCircle, Loader2, X } from "lucide-react";
import GlassIcon from "../components/ui/GlassIcon";
import StatusChip from "../components/ui/StatusChip";
import { base44 } from "@/api/base44Compat";
import { Invoice } from '@/api/entities';
import { Capacitor } from '@capacitor/core';

const APP_BASE_URL = import.meta.env.VITE_BASE44_APP_BASE_URL || "https://aletefaq-f8753dd9.base44.app";

function getBillingReturnUrl() {
  if (Capacitor.isNativePlatform()) {
    return APP_BASE_URL + "/billing";
  }
  const origin = window.location.origin;
  if (!origin || origin === "null" || origin.startsWith("capacitor://") || origin.startsWith("ionic://")) {
    return APP_BASE_URL + "/billing";
  }
  return origin + "/billing";
}

const tabs = ["الكل", "قيد الاستحقاق", "مدفوعة"];

export default function Billing() {
  const [activeTab, setActiveTab] = useState("الكل");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    Invoice.list("-created_date", 50)
      .then(data => { setInvoices(data); setLoading(false); })
      .catch(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") setPaymentStatus("success");
    if (params.get("payment") === "cancelled") setPaymentStatus("cancelled");
  }, []);

  const pendingInvoices = invoices.filter(i => ["pending", "issued", "overdue"].includes(i.status));
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const totalDue = pendingInvoices.reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const totalPaid = paidInvoices.reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);

  const filtered = invoices.filter((inv) => {
    if (activeTab === "الكل") return true;
    if (activeTab === "قيد الاستحقاق") return ["pending", "issued", "overdue"].includes(inv.status);
    if (activeTab === "مدفوعة") return inv.status === "paid";
    return true;
  });

  const statusVariant = (status) => {
    if (status === "paid") return "active";
    if (status === "overdue") return "urgent";
    return "pending";
  };

  const handlePay = async (inv) => {
    if (window.self !== window.top) {
      alert("الدفع يعمل فقط من التطبيق المنشور وليس من وضع المعاينة");
      return;
    }
    setCheckoutLoading(inv.id);
    try {
      const returnUrl = getBillingReturnUrl();
      const res = await base44.functions.invoke("createStripeCheckout", {
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number || inv.id,
        amount: inv.total_amount || inv.amount || 0,
        clientEmail: inv.client_email || "",
        description: inv.service_description || inv.case_title || "فاتورة قانونية",
        returnUrl,
      });
      if (res.data?.checkoutUrl) {
        if (Capacitor.isNativePlatform()) {
          window.open(res.data.checkoutUrl, "_blank");
        } else {
          window.location.href = res.data.checkoutUrl;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setCheckoutLoading(null);
  };

  const statusLabel = (status) => {
    const map = { draft: "مسودة", issued: "مُصدرة", pending: "قيد الاستحقاق", paid: "مدفوعة", overdue: "متأخرة", cancelled: "ملغاة" };
    return map[status] || status;
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      <div className="px-5 pt-14 pb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #123E7C 0%, #0D2F5F 100%)" }}>
        <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full opacity-10" style={{ backgroundColor: "#C8A96B" }} />
        <p className="text-white opacity-80 text-sm relative z-10">الرصيد المستحق</p>
        <h1 className="text-white text-4xl font-bold mt-1 relative z-10">
          {loading ? "—" : `${totalDue.toLocaleString("ar-QA")} ر.ق`}
        </h1>
        {paymentStatus === "success" && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl relative z-10" style={{ backgroundColor: "rgba(5,150,105,0.2)", border: "1px solid rgba(5,150,105,0.4)" }}>
            <CheckCircle className="w-4 h-4 text-green-300" />
            <p className="text-sm text-green-200 font-semibold">تمت عملية الدفع بنجاح!</p>
          </div>
        )}
        {paymentStatus === "cancelled" && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl relative z-10" style={{ backgroundColor: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.3)" }}>
            <AlertCircle className="w-4 h-4 text-red-300" />
            <p className="text-sm text-red-200 font-semibold">تم إلغاء عملية الدفع</p>
          </div>
        )}
      </div>
      <div className="px-5 pt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "المدفوع", value: loading ? "—" : `${totalPaid.toLocaleString("ar-QA")} ر.ق`, icon: CheckCircle },
            { label: "الفواتير المعلقة", value: loading ? "—" : `${pendingInvoices.length} فواتير`, icon: Clock },
          ].map((stat, si) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-card border" style={{ borderColor: "#E7ECF3" }}>
                <div className="mb-2"><GlassIcon icon={Icon} index={si + 2} size="sm" /></div>
                <p className="text-xs" style={{ color: "#6B7280" }}>{stat.label}</p>
                <p className="text-base font-bold mt-0.5" style={{ color: "#101828" }}>{stat.value}</p>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab ? "#123E7C" : "white",
                color: activeTab === tab ? "white" : "#6B7280",
                border: `1px solid ${activeTab === tab ? "#123E7C" : "#E7ECF3"}`,
              }}>
              {tab}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-card border overflow-hidden" style={{ borderColor: "#E7ECF3" }}>
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: "#123E7C" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: "#6B7280" }}>لا توجد فواتير</p>
            </div>
          ) : filtered.map((inv, i) => (
            <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="px-4 py-4 border-b last:border-0" style={{ borderColor: "#EEF2F7" }}>
              <div className="flex items-start gap-3">
                <GlassIcon icon={CreditCard} index={4} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>فاتورة رقم {inv.invoice_number || inv.id}</p>
                      <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>{inv.service_description || inv.case_title || "فاتورة قانونية"}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{inv.client_name}</p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: "#0D2F5F" }}>{(inv.total_amount || inv.amount || 0).toLocaleString("ar-QA")} ر.ق</p>
                      <div className="mt-1"><StatusChip label={statusLabel(inv.status)} variant={statusVariant(inv.status)} /></div>
                    </div>
                  </div>
                  {["pending", "issued", "overdue"].includes(inv.status) && (
                    <div className="mt-3">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => handlePay(inv)} disabled={checkoutLoading === inv.id}
                        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)", color: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                        {checkoutLoading === inv.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            <span>Pay  •  Apple Pay</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-center" style={{ color: "#6B7280" }}>
          هل تحتاج إلى كشف حساب مفصل؟ تواصل مع قسم الفواتير.
        </p>
      </div>
    </div>
  );
}
