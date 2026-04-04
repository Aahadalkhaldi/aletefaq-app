import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Compat";
import { Sparkles, Send, Loader2, ChevronDown, ChevronUp, Lightbulb, BookOpen, ListChecks } from "lucide-react";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";

const QUICK_PROMPTS = [
  { label: "لخّص القضية", icon: BookOpen, q: "لخص هذه القضية بشكل مختصر وواضح" },
  { label: "الخطوات القادمة", icon: ListChecks, q: "اقترح الخطوات القانونية القادمة بناءً على نوع القضية وجلساتها" },
  { label: "تحليل الجلسات", icon: Sparkles, q: "حلل تاريخ الجلسات وأبرز ما يمكن استنتاجه" },
];

function AIResponseCard({ data }) {
  const [expanded, setExpanded] = useState(true);
  const sections = [
    { key: "summary", label: "الملخص", color: PRIMARY },
    { key: "hearingAnalysis", label: "تحليل الجلسات", color: "#6D28D9" },
    { key: "nextSteps", label: "الخطوات القانونية القادمة", color: "#065F46" },
    { key: "risks", label: "المخاطر والتنبيهات", color: "#B45309" },
    { key: "clientAction", label: "ما يُطلب من الموكل", color: "#B42318" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "#D4E4F7", backgroundColor: "#F8FBFF" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#D4E4F7" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold" style={{ color: PRIMARY }}>تحليل المساعد الذكي</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" style={{ color: TEXT_SEC }} /> : <ChevronDown className="w-4 h-4" style={{ color: TEXT_SEC }} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {sections.map(({ key, label, color }) => {
                const value = data[key];
                if (!value) return null;
                const isArray = Array.isArray(value);
                return (
                  <div key={key}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: color }} />
                      <p className="text-xs font-bold" style={{ color }}>{label}</p>
                    </div>
                    {isArray ? (
                      <ul className="space-y-1 pr-3">
                        {value.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-xs mt-0.5 flex-shrink-0" style={{ color }}>•</span>
                            <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{item}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{value}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CaseAIAssistant({ caseData, hearings = [], tasks = [] }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState([]);

  const buildContext = () => {
    const hearingsList = hearings.map(h =>
      `- ${h.date} في ${h.court_name}${h.status === "completed" ? " (منتهية)" : h.status === "postponed" ? " (مؤجلة)" : " (مجدولة)"}${h.notes ? ": " + h.notes : ""}${h.outcome ? " - النتيجة: " + h.outcome : ""}`
    ).join("\n");

    const tasksList = tasks.filter(t => t.status !== "completed").map(t =>
      `- ${t.title}${t.due_date ? " (الموعد: " + t.due_date + ")" : ""}${t.priority === "urgent" ? " [عاجل]" : ""}`
    ).join("\n");

    const typeMap = {
      civil: "مدنية", commercial: "تجارية", criminal: "جنائية",
      family: "أسرة", labor: "عمالية", administrative: "إدارية",
      execution: "تنفيذ", other: "أخرى",
    };

    return `
معلومات القضية:
- العنوان: ${caseData.title}
- النوع: ${typeMap[caseData.type] || caseData.type}
- الحالة: ${caseData.status}
- الموكل: ${caseData.client_name}
- المحكمة: ${caseData.court_name || "—"}
- الأولوية: ${caseData.priority || "medium"}
- وصف القضية: ${caseData.description || "—"}
- ملاحظات: ${caseData.notes || "—"}
- الأطراف: ${caseData.parties || "—"}
- تاريخ الجلسة القادمة: ${caseData.next_hearing_date || "—"}
${caseData.amount_under_enforcement ? `- المبلغ محل التنفيذ: ${caseData.amount_under_enforcement} ر.ق` : ""}

سجل الجلسات (${hearings.length} جلسة):
${hearingsList || "لا توجد جلسات مسجلة"}

المهام المعلقة:
${tasksList || "لا توجد مهام معلقة"}
    `.trim();
  };

  const analyze = async (customQ) => {
    const q = customQ ?? question;
    if (!q.trim() || loading) return;
    setQuestion("");
    setLoading(true);

    try {
      const context = buildContext();
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت محامٍ خبير ومستشار قانوني في مكتب الاتفاق للمحاماة. حلّل القضية التالية وأجب على السؤال بشكل مهني ودقيق باللغة العربية.

${context}

السؤال/الطلب: ${q}

قدّم إجابة منظمة ومفيدة تشمل ما يلزم من:
- ملخص الوضع الحالي
- تحليل الجلسات إن وجدت
- الخطوات القانونية القادمة (كقائمة مرتبة)
- المخاطر أو التنبيهات المهمة
- ما يُطلب من الموكل`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            hearingAnalysis: { type: "string" },
            nextSteps: { type: "array", items: { type: "string" } },
            risks: { type: "string" },
            clientAction: { type: "string" },
          },
        },
        model: "claude_sonnet_4_6",
      });

      setResponses(prev => [{ question: q, data: result }, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header hint */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border"
        style={{ backgroundColor: "#F8FBFF", borderColor: "#D4E4F7" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: PRIMARY }}>المساعد الذكي للقضية</p>
          <p className="text-[10px]" style={{ color: TEXT_SEC }}>تحليل ملف القضية واقتراح الخطوات القادمة</p>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {QUICK_PROMPTS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.label}
              onClick={() => analyze(p.q)}
              disabled={loading}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold disabled:opacity-50 transition-all"
              style={{ backgroundColor: "white", borderColor: "#E7ECF3", color: PRIMARY }}
            >
              <Icon className="w-3.5 h-3.5" />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 border rounded-2xl px-4 py-3" style={{ borderColor: "#E7ECF3", backgroundColor: "white" }}>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="اسأل عن القضية... (مثال: ما احتمالات النجاح؟)"
            rows={2}
            className="w-full resize-none outline-none text-sm bg-transparent"
            style={{ color: TEXT, direction: "rtl" }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyze(); } }}
          />
        </div>
        <button
          onClick={() => analyze()}
          disabled={loading || !question.trim()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          style={{ backgroundColor: PRIMARY }}
        >
          {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" style={{ transform: "scaleX(-1)" }} />}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: "#F3F7FD" }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: PRIMARY }} />
          <p className="text-xs" style={{ color: TEXT_SEC }}>المساعد يحلل القضية...</p>
        </div>
      )}

      {/* Responses */}
      <AnimatePresence>
        {responses.map((r, i) => (
          <div key={i} className="space-y-2">
            <div className="px-4 py-2.5 rounded-2xl self-start"
              style={{ backgroundColor: "#F2F4F7", color: TEXT, borderRadius: "18px 18px 18px 4px" }}>
              <p className="text-sm">{r.question}</p>
            </div>
            <AIResponseCard data={r.data} />
          </div>
        ))}
      </AnimatePresence>

      {responses.length === 0 && !loading && (
        <div className="text-center py-8">
          <Lightbulb className="w-10 h-10 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
          <p className="text-sm" style={{ color: TEXT_SEC }}>اختر سؤالاً سريعاً أو اكتب استفسارك</p>
        </div>
      )}
    </div>
  );
}