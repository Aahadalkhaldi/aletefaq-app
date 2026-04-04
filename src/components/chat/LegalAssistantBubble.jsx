import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Compat";
import { MessageCircle, X, Send, Bot, User, Loader2, CalendarCheck, Phone, CheckCircle2 } from "lucide-react";

const PRIMARY = "#123E7C";
const DEEP = "#0D2F5F";

const QUICK_PROMPTS = [
  "كيف أرفع مستنداً؟",
  "أريد حجز استشارة",
  "ما إجراءات القضية؟",
  "تواصل مع محامي",
];

function ActionCard({ action }) {
  if (!action) return null;
  if (action.action === "book_meeting" || action.action === "book_consultation") {
    return (
      <div className="mt-2 rounded-xl p-3 flex items-center gap-2"
        style={{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }}>
        <CalendarCheck className="w-4 h-4 flex-shrink-0" style={{ color: "#059669" }} />
        <p className="text-xs font-semibold" style={{ color: "#065F46" }}>
          تم حجز موعد استشارة — سيتواصل معك المكتب قريباً ✓
        </p>
      </div>
    );
  }
  if (action.action === "contact_lawyer") {
    return (
      <div className="mt-2 rounded-xl p-3 flex items-center gap-2"
        style={{ backgroundColor: "#EAF2FF", border: "1px solid #BFDBFE" }}>
        <Phone className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
        <p className="text-xs font-semibold" style={{ color: DEEP }}>
          تم إرسال رسالتك للمحامي المختص ✓
        </p>
      </div>
    );
  }
  return null;
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  // Remove JSON from display text
  const displayText = msg.content?.replace(/\{[\s\S]*"action"[\s\S]*\}/, "").trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ backgroundColor: isUser ? "#EAF2FF" : PRIMARY }}>
        {isUser
          ? <User className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
          : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>

      <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
          style={{
            backgroundColor: isUser ? PRIMARY : "white",
            color: isUser ? "white" : "#101828",
            border: isUser ? "none" : "1px solid #E7ECF3",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          }}>
          {displayText}
        </div>
        {msg.action && <ActionCard action={msg.action} />}
      </div>
    </motion.div>
  );
}

export default function LegalAssistantBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "مرحباً! أنا مساعدك القانوني الذكي 👋\nيمكنني مساعدتك في الإجراءات، حجز مواعيد الاستشارات، أو التواصل مع المحامي المختص.\nكيف يمكنني مساعدتك اليوم؟",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const send = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const userMsg = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await base44.functions.invoke("legalAssistant", { messages: apiMessages });
      const { reply, action } = res.data;
      setMessages(prev => [...prev, { role: "assistant", content: reply, action }]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "عذراً، حدث خطأ مؤقت. يرجى المحاولة مجدداً أو التواصل مباشرة مع المكتب."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bubble Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(true)}
            className="fixed z-50 flex items-center justify-center rounded-full shadow-xl"
            style={{
              bottom: "90px", left: "20px",
              width: "56px", height: "56px",
              background: "linear-gradient(135deg, #123E7C, #1E4E95)",
              boxShadow: "0 8px 24px rgba(18,62,124,0.4)",
            }}
          >
            <Bot className="w-6 h-6 text-white" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: "#B42318" }}>
                {unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed z-50 flex flex-col bg-white rounded-3xl overflow-hidden"
            style={{
              bottom: "90px", left: "12px", right: "12px",
              height: "70vh", maxHeight: "560px",
              boxShadow: "0 20px 60px rgba(18,62,124,0.22), 0 4px 16px rgba(0,0,0,0.1)",
              border: "1px solid #E7ECF3",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${DEEP}, ${PRIMARY})` }}>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-2.5 text-right">
                <div>
                  <p className="text-sm font-bold text-white">المساعد القانوني</p>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>متاح الآن</p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{ backgroundColor: "#F7F8FA", direction: "rtl" }}>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: PRIMARY }}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                    style={{ backgroundColor: "white", border: "1px solid #E7ECF3" }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#9CA3AF" }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0"
                style={{ scrollbarWidth: "none", direction: "rtl", borderTop: "1px solid #EEF2F7" }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => send(p)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                    style={{ backgroundColor: "#EAF2FF", color: PRIMARY, border: "1px solid #D4E4F7" }}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
              style={{ borderTop: "1px solid #EEF2F7", backgroundColor: "white", direction: "rtl" }}>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                style={{ backgroundColor: input.trim() && !loading ? PRIMARY : "#E7ECF3" }}>
                <Send className="w-4 h-4" style={{ color: input.trim() && !loading ? "white" : "#9CA3AF" }} />
              </motion.button>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none text-right"
                style={{ backgroundColor: "#F7F8FA", border: "1px solid #E7ECF3", color: "#101828", direction: "rtl" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}