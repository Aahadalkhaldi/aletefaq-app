import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Loader2, AlertCircle, CheckCircle } from "lucide-react";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";

export default function InvoicePaymentModal({ invoice, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      // Check if in iframe
      if (window.self !== window.top) {
        setError("يرجى فتح الدفع من صفحة منشورة وليس من داخل iframe");
        setLoading(false);
        return;
      }

      // Create checkout session
      const response = await base44.functions.invoke("createStripeCheckout", {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.total_amount || invoice.amount,
        clientEmail: invoice.client_name,
      });

      if (response.data?.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = response.data.checkoutUrl;
      } else {
        setError("فشل إنشاء جلسة الدفع");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "حدث خطأ في معالجة الدفع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-black/40"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full bg-white rounded-t-3xl p-5 shadow-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#F3F7FD" }}
          >
            <X className="w-4 h-4" style={{ color: TEXT }} />
          </button>
          <h2 className="text-lg font-bold flex-1 text-center" style={{ color: TEXT }}>
            دفع الفاتورة
          </h2>
          <div className="w-8" />
        </div>

        {/* Invoice Details */}
        <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-2xl p-4 mb-4">
          <p className="text-xs mb-1" style={{ color: TEXT_SEC }}>رقم الفاتورة</p>
          <p className="text-lg font-bold mb-3" style={{ color: PRIMARY }}>#{invoice.invoice_number}</p>

          <div className="space-y-2 text-sm">
            {invoice.service_description && (
              <div className="flex justify-between">
                <span style={{ color: TEXT_SEC }}>الخدمة:</span>
                <span style={{ color: TEXT }}>{invoice.service_description}</span>
              </div>
            )}
            {invoice.case_title && (
              <div className="flex justify-between">
                <span style={{ color: TEXT_SEC }}>القضية:</span>
                <span style={{ color: TEXT }}>{invoice.case_title}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t" style={{ borderColor: "#D4E4F7" }}>
              <span style={{ color: TEXT_SEC }}>المبلغ:</span>
              <span className="font-bold" style={{ color: PRIMARY }}>
                {(invoice.total_amount || invoice.amount).toLocaleString("ar-QA")} ر.ق
              </span>
            </div>
            {invoice.vat_amount && (
              <div className="flex justify-between text-xs">
                <span style={{ color: TEXT_SEC }}>الضريبة:</span>
                <span style={{ color: TEXT }}>{invoice.vat_amount.toLocaleString("ar-QA")} ر.ق</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex gap-2 p-3 rounded-lg mb-4" style={{ backgroundColor: "#FDECEC", borderLeft: "3px solid #B42318" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#B42318", marginTop: "2px" }} />
            <p className="text-xs" style={{ color: "#B42318" }}>{error}</p>
          </div>
        )}

        {/* Payment Info */}
        <div className="bg-blue-50 rounded-xl p-3 mb-4 text-xs" style={{ backgroundColor: "#F3F7FD" }}>
          <div className="flex gap-2 mb-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
            <span style={{ color: TEXT }}>آمن ومشفر تماماً</span>
          </div>
          <p style={{ color: TEXT_SEC }}>سيتم معالجة الدفع عبر بوابة Stripe الآمنة</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold border"
            style={{
              borderColor: "#E7ECF3",
              color: PRIMARY,
              backgroundColor: "white",
            }}
          >
            إلغاء
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: PRIMARY }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              "ادفع الآن"
            )}
          </motion.button>
        </div>

        {/* Security Info */}
        <p className="text-xs text-center mt-4" style={{ color: TEXT_SEC }}>
          بالدفع، أنت توافق على شروط الدفع والخصوصية
        </p>
      </motion.div>
    </motion.div>
  );
}