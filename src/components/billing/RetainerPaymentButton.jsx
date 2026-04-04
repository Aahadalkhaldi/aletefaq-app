import { useState } from "react";
import { CreditCard, Loader2, Lock } from "lucide-react";
import { base44 } from "@/api/base44Compat";

export default function RetainerPaymentButton({ invoice, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    // Check if running in iframe (preview mode)
    if (window.self !== window.top) {
      alert("الدفع يعمل فقط من التطبيق المنشور. يرجى فتح الرابط المنشور لإتمام الدفع.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke("createRetainerCheckout", {
        amount: invoice.total_amount || invoice.amount,
        caseTitle: invoice.case_title || "قضية قانونية",
        caseId: invoice.case_id || "",
        clientName: invoice.client_name || "",
        currency: "usd", // Change to "qar" when live if supported
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        setError("حدث خطأ أثناء إنشاء جلسة الدفع");
      }
    } catch (err) {
      console.error(err);
      setError("فشل الاتصال بخادم الدفع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold transition-all"
        style={{
          background: loading ? "#D1D5DB" : "linear-gradient(135deg, #123E7C, #1E4E95)",
          color: "white",
          boxShadow: loading ? "none" : "0 4px 16px rgba(18,62,124,0.35)",
        }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        {loading ? "جارٍ التحويل..." : "ادفع الآن"}
      </button>

      {!loading && (
        <div className="flex items-center justify-center gap-1 mt-2">
          <Lock className="w-3 h-3" style={{ color: "#9CA3AF" }} />
          <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
            دفع آمن عبر Stripe
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-center mt-2" style={{ color: "#B42318" }}>{error}</p>
      )}
    </div>
  );
}