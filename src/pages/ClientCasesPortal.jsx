import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Compat";
import { Case, ChatMessage, Conversation, Invoice } from '@/api/entities';
import { FileText, MessageCircle, DollarSign, Scale, Clock, AlertCircle, ChevronLeft, Send, CreditCard } from "lucide-react";
import InvoicePaymentModal from "@/components/billing/InvoicePaymentModal";
import ClientDocumentUpload from "@/components/vault/ClientDocumentUpload";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const DEEP = "#0D2F5F";
const BG = "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)";

export default function ClientCasesPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    loadData();
    
    // Check payment status from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") setPaymentStatus("success");
    if (params.get("payment") === "cancelled") setPaymentStatus("cancelled");
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me().catch(() => null);
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Fetch cases for this client
      const allCases = await Case.list("-updated_date", 100).catch(() => []);
      const clientCases = allCases.filter(c => c.client_name === currentUser.full_name);
      setCases(clientCases);

      // Fetch invoices for this client
      const allInvoices = await Invoice.list("-created_date", 100).catch(() => []);
      const clientInvoices = allInvoices.filter(i => i.client_name === currentUser.full_name);
      setInvoices(clientInvoices);

      // Fetch conversations for this client
      const allConversations = await Conversation.list("-updated_date", 100).catch(() => []);
      const clientConversations = allConversations.filter(c => 
        c.participant_names?.includes(currentUser.full_name)
      );
      setConversations(clientConversations);
    } catch (error) {
      console.error("خطأ في تحميل البيانات:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    try {
      const msgs = await ChatMessage.filter({ conversation_id: conversationId }, "created_date", 100).catch(() => []);
      setConversationMessages(msgs);
    } catch (error) {
      console.error("خطأ في تحميل الرسائل:", error);
    }
  };

  const handleSelectCase = (caseItem) => {
    setSelectedCase(caseItem);
    setMessageText("");
    setConversationMessages([]);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedCase) return;
    setSendingMessage(true);

    try {
      // Find or create conversation for this case
      let conversation = conversations.find(c => c.case_id === selectedCase.id);
      
      if (!conversation) {
        const newConv = await Conversation.create({
          type: "case",
          case_id: selectedCase.id,
          title: selectedCase.title,
          participants: [user.full_name, selectedCase.lead_lawyer_name || "محامٍ"],
          participant_names: [user.full_name, selectedCase.lead_lawyer_name || "محامٍ"],
        });
        conversation = newConv;
        setConversations([...conversations, newConv]);
      }

      // Create message
      await ChatMessage.create({
        conversation_id: conversation.id,
        case_id: selectedCase.id,
        sender_id: user.full_name,
        sender_name: user.full_name,
        sender_role: "client",
        content: messageText.trim(),
        message_type: "text",
      });

      setMessageText("");
      await loadConversationMessages(conversation.id);
    } catch (error) {
      console.error("خطأ في إرسال الرسالة:", error);
      alert("فشل إرسال الرسالة");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: PRIMARY }} />
          <p className="text-sm" style={{ color: TEXT_SEC }}>جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <p className="text-base font-semibold mb-4" style={{ color: TEXT }}>يرجى تسجيل الدخول أولاً</p>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="px-6 py-2.5 rounded-xl font-semibold"
            style={{ backgroundColor: PRIMARY, color: "white" }}
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  const activeConversation = conversations.find(c => c.case_id === selectedCase?.id);

  return (
    <div className="min-h-screen pb-8" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <h1 className="text-2xl font-bold" style={{ color: TEXT }}>بوابة قضاياك</h1>
        <p className="text-sm mt-1" style={{ color: TEXT_SEC }}>مرحباً {user.full_name}</p>
      </div>

      <div className="px-5 pt-5">
        {/* Overview Cards */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: "القضايا", value: cases.length, icon: Scale },
            { label: "الفواتير", value: invoices.length, icon: DollarSign },
            { label: "الرسائل", value: conversations.length, icon: MessageCircle },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl p-3 border text-center"
                style={{ borderColor: "#E7ECF3" }}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: PRIMARY }} />
                <p className="text-xs" style={{ color: TEXT_SEC }}>{item.label}</p>
                <p className="text-lg font-bold" style={{ color: DEEP }}>{item.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cases List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-white rounded-2xl p-4 border"
            style={{ borderColor: "#E7ECF3", maxHeight: "600px", overflowY: "auto" }}
          >
            <h2 className="text-base font-bold mb-3" style={{ color: TEXT }}>قضاياك</h2>
            {cases.length === 0 ? (
              <p className="text-sm" style={{ color: TEXT_SEC }}>لا توجد قضايا حالياً</p>
            ) : (
              <div className="space-y-2">
                {cases.map((caseItem) => (
                   <div key={caseItem.id} className="relative group">
                     <motion.button
                       whileTap={{ scale: 0.98 }}
                       onClick={() => handleSelectCase(caseItem)}
                       className="w-full text-right p-3 rounded-xl border transition-all"
                       style={{
                         borderColor: selectedCase?.id === caseItem.id ? PRIMARY : "#E7ECF3",
                         backgroundColor: selectedCase?.id === caseItem.id ? "#EAF2FF" : "white",
                       }}
                     >
                       <p className="text-sm font-bold truncate" style={{ color: TEXT }}>{caseItem.title}</p>
                       <p className="text-xs mt-1 flex items-center gap-1" style={{ color: TEXT_SEC }}>
                         <Clock className="w-3 h-3" />
                         {caseItem.status === "closed" ? "مغلقة" : caseItem.status === "in_progress" ? "قيد المتابعة" : "أخرى"}
                       </p>
                     </motion.button>
                     <button
                       onClick={() => navigate(`/case-tracking/${caseItem.id}`)}
                       className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-xs font-semibold"
                       style={{ backgroundColor: PRIMARY, color: "white" }}>
                       تفاصيل
                     </button>
                   </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Case Details & Chat */}
          {selectedCase ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-4"
            >
              {/* Case Details */}
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E7ECF3" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: TEXT }}>{selectedCase.title}</h2>
                    <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>رقم القضية: {selectedCase.case_number}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: selectedCase.status === "closed" ? "#ECFDF5" : "#EAF2FF",
                      color: selectedCase.status === "closed" ? "#059669" : PRIMARY,
                    }}
                  >
                    {selectedCase.status === "closed" ? "مغلقة" : "نشطة"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "نوع القضية", value: selectedCase.type },
                    { label: "المحكمة", value: selectedCase.court_name || "—" },
                    { label: "المحامي", value: selectedCase.lead_lawyer_name || "—" },
                    { label: "الحالة", value: selectedCase.status },
                  ].map((item) => (
                    <div key={item.label} className="border-t pt-3" style={{ borderColor: "#E7ECF3" }}>
                      <p style={{ color: TEXT_SEC }}>{item.label}</p>
                      <p className="font-semibold mt-1" style={{ color: TEXT }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {selectedCase.description && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: "#E7ECF3" }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: TEXT }}>الوصف</p>
                    <p className="text-sm" style={{ color: TEXT_SEC }}>{selectedCase.description}</p>
                  </div>
                )}

                {selectedCase.next_hearing_date && (
                  <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: "#F0FFF4", borderLeft: "3px solid #10B981" }}>
                    <p className="text-xs font-semibold" style={{ color: "#059669" }}>الجلسة القادمة</p>
                    <p className="text-sm font-bold mt-1" style={{ color: "#059669" }}>
                      {new Date(selectedCase.next_hearing_date).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E7ECF3" }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: TEXT }}>المعلومات المالية</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: "#E7ECF3" }}>
                    <span style={{ color: TEXT_SEC }}>المبلغ المطلوب تنفيذه</span>
                    <span className="font-bold" style={{ color: DEEP }}>{(selectedCase.amount_under_enforcement || 0).toLocaleString()} ر.ق</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: TEXT_SEC }}>المبلغ المحصل</span>
                    <span className="font-bold text-green-600">{(selectedCase.amount_recovered || 0).toLocaleString()} ر.ق</span>
                  </div>
                </div>
              </div>

              {/* Related Invoices */}
              {paymentStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg p-3 text-sm font-semibold text-center"
                  style={{
                    backgroundColor: paymentStatus === "success" ? "#ECFDF5" : "#FEE2E2",
                    color: paymentStatus === "success" ? "#059669" : "#B42318",
                  }}
                >
                  {paymentStatus === "success" ? "✓ تم الدفع بنجاح" : "✕ تم إلغاء الدفع"}
                </motion.div>
              )}
              
              {invoices.filter(i => i.case_id === selectedCase.id).length > 0 && (
                <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E7ECF3" }}>
                  <h3 className="font-bold text-sm mb-3" style={{ color: TEXT }}>فواتيرك في هذه القضية</h3>
                  <div className="space-y-2">
                    {invoices.filter(i => i.case_id === selectedCase.id).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "#E7ECF3", backgroundColor: inv.status === "paid" ? "#F0FFF4" : "white" }}>
                        <div className="flex-1">
                          <p className="text-xs font-semibold" style={{ color: TEXT }}>فاتورة {inv.invoice_number}</p>
                          <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{inv.service_description}</p>
                        </div>
                        <div className="text-right mr-3 flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: DEEP }}>{(inv.total_amount || inv.amount).toLocaleString("ar-QA")} ر.ق</p>
                          <p className="text-xs mt-1" style={{ color: inv.status === "paid" ? "#059669" : "#F59E0B" }}>
                            {inv.status === "paid" ? "مدفوعة" : "معلقة"}
                          </p>
                        </div>
                        {inv.status !== "paid" && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setPaymentModal(inv)}
                            className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 flex-shrink-0"
                            style={{ backgroundColor: PRIMARY, color: "white" }}
                          >
                            <CreditCard className="w-3 h-3" />
                            ادفع
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Upload Section */}
              <ClientDocumentUpload
                caseId={selectedCase.id}
                caseTitle={selectedCase.title}
                onUploadSuccess={() => loadData()}
              />

              {/* Chat Section */}
              <div className="bg-white rounded-2xl p-4 border flex flex-col" style={{ borderColor: "#E7ECF3", maxHeight: "400px" }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: TEXT }}>التواصل المباشر مع المحامي</h3>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-3 space-y-2">
                  {conversationMessages.length === 0 ? (
                    <p className="text-xs text-center py-6" style={{ color: TEXT_SEC }}>ابدأ محادثة مع المحامي</p>
                  ) : (
                    conversationMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_role === "client" ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-xs px-3 py-2 rounded-2xl text-xs"
                          style={{
                            backgroundColor: msg.sender_role === "client" ? PRIMARY : "#F3F4F6",
                            color: msg.sender_role === "client" ? "white" : TEXT,
                            borderRadius: msg.sender_role === "client" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="اكتب رسالتك..."
                    disabled={sendingMessage}
                    className="flex-1 rounded-lg px-3 py-2 text-sm border outline-none"
                    style={{ borderColor: "#E7ECF3", color: TEXT, direction: "rtl" }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={sendMessage}
                    disabled={sendingMessage}
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {sendingMessage ? (
                      <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "white" }} />
                    ) : (
                      <Send className="w-4 h-4 text-white" style={{ transform: "scaleX(-1)" }} />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 border text-center flex items-center justify-center"
              style={{ borderColor: "#E7ECF3", minHeight: "400px" }}>
              <div>
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: TEXT_SEC }} />
                <p style={{ color: TEXT_SEC }}>اختر قضية لعرض التفاصيل</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal && (
          <InvoicePaymentModal
            invoice={paymentModal}
            onClose={() => setPaymentModal(null)}
            onSuccess={() => {
              setPaymentModal(null);
              loadData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}