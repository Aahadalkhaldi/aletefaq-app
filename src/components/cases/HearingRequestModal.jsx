import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Send, Clock, HelpCircle, Loader2, CheckCircle } from "lucide-react";

export default function HearingRequestModal({ hearing, caseData, onClose }) {
  const [requestType, setRequestType] = useState("inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    await base44.entities.HearingRequest.create({
      hearing_id: hearing.id,
      case_id: hearing.case_id,
      case_title: hearing.case_title || caseData?.title,
      client_name: caseData?.client_name || "",
      request_type: requestType,
      message: message.trim(),
      status: "pending",
    });
    setDone(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8"
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: "#101828" }}>
            {done ? "تم الإرسال" : "طلب بشأن الجلسة"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle className="w-14 h-14 mx-auto mb-3" style={{ color: "#1A6E3A" }} />
            <p className="text-sm font-semibold" style={{ color: "#101828" }}>تم إرسال طلبك للمحامي</p>
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>سيتم الرد عليك في أقرب وقت</p>
            <button onClick={onClose} className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#123E7C" }}>
              حسناً
            </button>
          </div>
        ) : (
          <>
            {/* Hearing info */}
            <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "#F3F7FD" }}>
              <p className="text-xs font-semibold" style={{ color: "#123E7C" }}>{hearing.court_name}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                {hearing.date ? new Date(hearing.date).toLocaleDateString("ar-QA") : ""} {hearing.time && `• ${hearing.time}`}
              </p>
            </div>

            {/* Request Type */}
            <p className="text-xs font-semibold mb-2" style={{ color: "#6B7280" }}>نوع الطلب</p>
            <div className="flex gap-2 mb-4">
              {[
                { key: "inquiry", label: "استفسار", icon: HelpCircle },
                { key: "postpone", label: "طلب تأجيل", icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setRequestType(key)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: requestType === key ? "#123E7C" : "#F7F8FA",
                    color: requestType === key ? "white" : "#6B7280",
                    border: `1px solid ${requestType === key ? "#123E7C" : "#E7ECF3"}`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Message */}
            <p className="text-xs font-semibold mb-2" style={{ color: "#6B7280" }}>
              {requestType === "postpone" ? "سبب طلب التأجيل" : "تفاصيل الاستفسار"}
            </p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder={requestType === "postpone" ? "اكتب سبب طلب التأجيل..." : "اكتب استفسارك هنا..."}
              className="w-full border rounded-xl p-3 text-sm outline-none resize-none mb-4"
              style={{ borderColor: "#E7ECF3", color: "#101828", direction: "rtl" }}
            />

            <button
              onClick={handleSubmit}
              disabled={!message.trim() || loading}
              className="w-full h-12 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#123E7C" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "جارٍ الإرسال..." : "إرسال للمحامي"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}