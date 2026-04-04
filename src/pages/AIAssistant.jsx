import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Compat";
import { Sparkles, Send, MessageCircle, Loader2, Bell, Calendar, CreditCard, AlertTriangle, ChevronLeft } from "lucide-react";
import GlassIcon from "../components/ui/GlassIcon";
import { useNavigate } from "react-router-dom";

const proactiveAlerts = [
  {
    id: 1,
    type: "appointment",
    icon: Calendar,
    title: "موعد قريب",
    message: "استشارة قانونية مع د. أحمد زايد — غداً الساعة 10:00 ص",
    urgency: "warning",
    action: "عرض الموعد",
    path: "/appointments",
  },
  {
    id: 2,
    type: "invoice",
    icon: CreditCard,
    title: "فاتورة مستحقة",
    message: "الفاتورة رقم 2041 — 5,000 ر.ق • موعد الاستحقاق: 30 مارس 2026",
    urgency: "danger",
    action: "عرض الفاتورة",
    path: "/billing",
  },
  {
    id: 3,
    type: "document",
    icon: AlertTriangle,
    title: "مستند مطلوب",
    message: "يرجى رفع التفويض الموقع قبل 30 مارس 2026",
    urgency: "warning",
    action: "رفع الآن",
    path: "/vault",
  },
];

const suggestedPrompts = [
  "لخص آخر تحديث في قضيتي",
  "ما هي الخطوة التالية في ملف التنفيذ؟",
  "اعرض الفواتير غير المسددة",
  "اشرح هذا المستند بلغة مبسطة",
  "جهز لي أسئلة الاجتماع القادم",
];

const urgencyStyles = {
  warning: { bg: "#FFF4E5", border: "#F5C97A", icon: "#8A5A00", text: "#8A5A00", dot: "#F5A623" },
  danger: { bg: "#FDECEC", border: "#F5A8A8", icon: "#B42318", text: "#B42318", dot: "#B42318" },
};

export default function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const navigate = useNavigate();

  const visibleAlerts = proactiveAlerts.filter((a) => !dismissedAlerts.includes(a.id));

  const submit = async (customQuestion) => {
    const q = customQuestion ?? question;
    if (!q.trim()) return;

    const userMsg = { role: "user", text: q };
    setChatHistory((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت مساعد قانوني متخصص في مكتب الاتفاق للمحاماة. أجب بشكل مهني ومختصر باللغة العربية الفصيحة.
        
        سياق الملف: ملف التنفيذ رقم 11831/2025، القضية: ماتركس تريدنغ ضد فندق VIP، المرحلة: التنفيذ النشط، التحديث الأخير: 25 مارس 2026.
        
        سؤال العميل: ${q}
        
        اجب بشكل منظم مع: الملخص، الإجراء التالي، وما نحتاجه من العميل.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            nextStep: { type: "string" },
            clientAction: { type: "string" },
          },
        },
      });

      const aiMsg = { role: "ai", data: result };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (e) {
      const fallback = {
        summary: "الملف لا يزال في مرحلة التنفيذ النشط.",
        nextStep: "بانتظار الإجراء القضائي التالي.",
        clientAction: "لا يوجد إجراء مطلوب منك حالياً.",
      };
      setChatHistory((prev) => [...prev, { role: "ai", data: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white">
        {/* Hero Card */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: "#F8FBFF", borderColor: "#D4E4F7" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: "#C8A96B" }} />
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#101828" }}>المساعد القانوني الذكي VIP</h1>
              <p className="text-xs" style={{ color: "#6B7280" }}>إرشاد سريع وخاص مرتبط بملفاتك وإجراءاتك الحالية.</p>
            </div>
            <Sparkles className="w-5 h-5 mr-auto" style={{ color: "#C8A96B" }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Proactive Alerts */}
        <AnimatePresence>
          {visibleAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Bell className="w-3.5 h-3.5" style={{ color: "#123E7C" }} />
                <p className="text-xs font-bold" style={{ color: "#123E7C" }}>تنبيهات استباقية</p>
              </div>
              {visibleAlerts.map((alert) => {
                const Icon = alert.icon;
                const s = urgencyStyles[alert.urgency];
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
                    className="rounded-2xl p-3 border"
                    style={{ backgroundColor: s.bg, borderColor: s.border }}
                  >
                    <div className="flex items-start gap-3">
                      <GlassIcon icon={Icon} index={alert.id - 1} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: s.text }}>{alert.title}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#101828" }}>{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => navigate(alert.path)}
                            className="flex items-center gap-1 text-xs font-semibold"
                            style={{ color: s.text }}
                          >
                            {alert.action}
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => setDismissedAlerts((prev) => [...prev, alert.id])}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ color: s.text, backgroundColor: "rgba(255,255,255,0.5)" }}
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggested Prompts (show only if no chat) */}
        {chatHistory.length === 0 && (
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "#6B7280" }}>اقتراحات سريعة</p>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => submit(prompt)}
                  className="w-full bg-white rounded-2xl px-4 py-3 text-right shadow-card border"
                  style={{ borderColor: "#E7ECF3" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "#0D2F5F" }}>{prompt}</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Chat History */}
        <AnimatePresence>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
            >
              {msg.role === "user" ? (
                <div
                  className="max-w-[85%] px-4 py-3 rounded-2xl text-sm"
                  style={{
                    backgroundColor: "#F2F4F7",
                    color: "#101828",
                    borderRadius: "18px 18px 18px 4px",
                  }}
                >
                  {msg.text}
                </div>
              ) : (
                <div
                  className="w-full rounded-2xl p-4 shadow-card border"
                  style={{ backgroundColor: "#F3F7FD", borderColor: "#D4E4F7" }}
                >
                  {[
                    { label: "الملخص", value: msg.data?.summary },
                    { label: "الإجراء التالي", value: msg.data?.nextStep },
                    { label: "ما نحتاجه منك", value: msg.data?.clientAction },
                  ].map(({ label, value }) => value && (
                    <div key={label} className="mb-3 last:mb-0">
                      <p className="text-xs font-bold mb-1" style={{ color: "#0D2F5F" }}>{label}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#101828" }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-end">
            <div className="px-4 py-3 rounded-2xl" style={{ backgroundColor: "#F3F7FD" }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#123E7C" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-4 bg-white border-t space-y-3" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex gap-2">
          <div className="flex-1 min-h-[48px] border rounded-2xl px-4 py-3 flex items-center" style={{ borderColor: "#E7ECF3" }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="اكتب سؤالك القانوني المرتبط بملفك..."
              rows={1}
              className="w-full resize-none outline-none text-sm bg-transparent"
              style={{ color: "#101828", direction: "rtl" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => submit()}
            disabled={loading || !question.trim()}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            style={{ backgroundColor: "#123E7C" }}
          >
            <Send className="w-4 h-4 text-white" style={{ transform: "scaleX(-1)" }} />
          </motion.button>
        </div>

        <button
          className="w-full py-2.5 rounded-2xl text-sm font-semibold border flex items-center justify-center gap-2"
          style={{ borderColor: "#D7E1EE", color: "#123E7C", backgroundColor: "white" }}
        >
          <MessageCircle className="w-4 h-4" />
          التحدث إلى الفريق القانوني
        </button>
      </div>
    </div>
  );
}