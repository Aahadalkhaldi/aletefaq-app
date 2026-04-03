import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, FileText, CheckSquare, DollarSign, Send, Paperclip, ChevronLeft, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { QATAR_COURTS } from "./Courts";

const tabs = [
  { key: "requests", label: "الطلبات", icon: FileText },
  { key: "checklist", label: "المستندات", icon: CheckSquare },
  { key: "fees", label: "الرسوم والمدة", icon: DollarSign },
];

export default function CourtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const court = QATAR_COURTS.find(c => c.id === id) || QATAR_COURTS[0];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      const reqNum = `SR-${Date.now().toString().slice(-6)}`;

      await base44.entities.ServiceRequest.create({
        request_number: reqNum,
        court_id: court.id,
        court_name: court.name_ar,
        request_type: selectedRequest.title,
        title: `${selectedRequest.title} — ${court.name_ar}`,
        description: selectedRequest.description,
        client_id: user?.id || "",
        client_name: user?.full_name || "عميل",
        status: "submitted",
        priority: "normal",
        notes: notes || "",
        form_data: {
          court_subtitle: court.subtitle,
          required_docs: selectedRequest.docs,
        },
      });

      // Notify all lawyers — create notifications for each
      // We create a general notification (user_id = "all" will show to all lawyers)
      await base44.entities.Notification.create({
        user_id: "all",
        title: `📋 طلب جديد: ${selectedRequest.title}`,
        body: `من ${user?.full_name || "عميل"} — ${court.name_ar} (${court.subtitle})${notes ? "\n" + notes : ""}`,
        type: "service_request_update",
        related_id: reqNum,
        related_type: "ServiceRequest",
        action_url: "/services",
        is_read: false,
      });

      setSubmitted(true);
      setNotes("");
      setTimeout(() => {
        setSubmitted(false);
        setSelectedRequest(null);
      }, 2500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "#F7F8FA" }} dir="rtl">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
            <ArrowRight className="w-4 h-4" style={{ color: "#101828" }} />
          </button>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: court.color }}>
            {court.icon}
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: "#101828" }}>{court.name_ar}</h1>
            <p className="text-xs font-semibold" style={{ color: court.accent }}>{court.subtitle}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isActive ? "#123E7C" : "#F2F4F7",
                  color: isActive ? "white" : "#6B7280",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-5 py-4 pb-28">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Requests */}
            {activeTab === "requests" && (
              <div className="space-y-3">
                {court.requests.map((req, i) => (
                  <motion.button
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedRequest(req); setNotes(""); }}
                    className="w-full bg-white rounded-2xl p-4 border shadow-card text-right flex items-center justify-between"
                    style={{ borderColor: "#E7ECF3" }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: "#101828" }}>{req.title}</p>
                      <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{req.description}</p>
                      <p className="text-[10px] mt-1.5 font-semibold" style={{ color: court.accent }}>
                        {req.docs.length} مستندات مطلوبة
                      </p>
                    </div>
                    <div className="mr-3 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: court.color, color: court.accent }}>
                      تقديم
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Checklist */}
            {activeTab === "checklist" && (
              <div className="space-y-3">
                {court.requests.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl p-4 border shadow-card" style={{ borderColor: "#E7ECF3" }}>
                    <p className="text-sm font-bold mb-3" style={{ color: "#101828" }}>{req.title}</p>
                    <div className="space-y-2">
                      {req.docs.map((doc, j) => (
                        <div key={j} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: court.color }}>
                            <span className="text-[10px] font-bold" style={{ color: court.accent }}>{j + 1}</span>
                          </div>
                          <p className="text-sm" style={{ color: "#101828" }}>{doc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fees */}
            {activeTab === "fees" && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 border shadow-card" style={{ borderColor: "#E7ECF3" }}>
                  <p className="text-xs mb-1" style={{ color: "#6B7280" }}>الرسوم التقديرية</p>
                  <p className="text-lg font-bold" style={{ color: "#0D2F5F" }}>{court.fees}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border shadow-card" style={{ borderColor: "#E7ECF3" }}>
                  <p className="text-xs mb-1" style={{ color: "#6B7280" }}>المدة التقديرية</p>
                  <p className="text-lg font-bold" style={{ color: "#0D2F5F" }}>{court.duration}</p>
                </div>
                <div className="rounded-2xl p-3 border" style={{ backgroundColor: "#FFF4E5", borderColor: "#F5C97A" }}>
                  <p className="text-xs" style={{ color: "#8A5A00" }}>⚠️ الرسوم والمدد تقديرية وقد تختلف حسب طبيعة الطلب. تواصل مع الفريق القانوني للتفاصيل.</p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Request Submission Sheet */}
      <AnimatePresence>
        {selectedRequest && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
              onClick={() => { if (!submitting) setSelectedRequest(null); }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-6"
              style={{ maxHeight: "85vh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 gap-4"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#ECFDF5" }}>
                    <CheckCircle className="w-8 h-8" style={{ color: "#059669" }} />
                  </div>
                  <p className="text-base font-bold text-center" style={{ color: "#101828" }}>تم إرسال طلبك بنجاح!</p>
                  <p className="text-sm text-center" style={{ color: "#6B7280" }}>سيتابع معك فريق المحامين قريباً</p>
                </motion.div>
              ) : (
                <>
                  {/* Court badge */}
                  <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl w-fit"
                    style={{ backgroundColor: court.color }}>
                    <span className="text-sm">{court.icon}</span>
                    <span className="text-xs font-semibold" style={{ color: court.accent }}>{court.name_ar}</span>
                  </div>

                  <h2 className="text-lg font-bold mb-1" style={{ color: "#101828" }}>{selectedRequest.title}</h2>
                  <p className="text-sm mb-4" style={{ color: "#6B7280" }}>{selectedRequest.description}</p>

                  {/* Required docs reminder */}
                  <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "#F7F8FA" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "#101828" }}>المستندات المطلوبة:</p>
                    <div className="space-y-1">
                      {selectedRequest.docs.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: court.accent }} />
                          <p className="text-xs" style={{ color: "#6B7280" }}>{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <textarea
                    placeholder="أضف ملاحظات أو تفاصيل إضافية للطلب..."
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border rounded-xl p-3 text-sm outline-none resize-none mb-4"
                    style={{ borderColor: "#E7ECF3", direction: "rtl", color: "#101828" }}
                  />

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: "#123E7C" }}
                  >
                    {submitting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />
                    }
                    {submitting ? "جارٍ الإرسال..." : "إرسال الطلب للمحامين"}
                  </motion.button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}