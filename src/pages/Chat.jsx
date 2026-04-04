import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Paperclip, Send, Shield, AlertCircle, Download, FileText, Image, Loader2 } from "lucide-react";
import { ChatMessage, Conversation } from '@/api/entities';

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversation();
    const unsub = ChatMessage.subscribe((event) => {
      if (event.data?.conversation_id === id) {
        loadMessages();
      }
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async () => {
    try {
      const conv = await Conversation.filter({ id }, undefined, 1);
      if (conv.length > 0) {
        setConversation(conv[0]);
      }
      await loadMessages();
    } catch (error) {
      console.error("خطأ:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await ChatMessage.filter({ conversation_id: id }, "created_date", 200);
      setMessages(msgs);
    } catch (error) {
      console.error("خطأ في تحميل الرسائل:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      
      // Create message with file
      await ChatMessage.create({
        conversation_id: id,
        sender_id: "client",
        sender_name: "أنت",
        sender_role: "client",
        content: `📎 ${file.name}`,
        message_type: "file",
        file_url: uploadResponse.file_url,
        file_name: file.name,
      });

      await loadMessages();
    } catch (error) {
      console.error("خطأ في رفع الملف:", error);
      alert("فشل رفع الملف");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await ChatMessage.create({
        conversation_id: id,
        sender_id: "client",
        sender_name: "أنت",
        sender_role: "client",
        content: text.trim(),
        message_type: "text",
      });
      setText("");
      await loadMessages();
    } catch (error) {
      console.error("خطأ:", error);
      alert("فشل إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#123E7C" }} />
        <p className="text-sm mt-3" style={{ color: "#6B7280" }}>جارٍ تحميل المحادثة...</p>
      </div>
    );
  }

  const lawyerName = conversation?.participant_names?.find(n => n !== "client") || "محامٍ";
  const initials = lawyerName.charAt(0);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b flex items-center gap-3" style={{ borderColor: "#EEF2F7" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
          <ArrowRight className="w-4 h-4" style={{ color: "#101828" }} />
        </button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
          {initials}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "#101828" }}>{lawyerName}</p>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ color: "#123E7C" }} />
            <p className="text-xs" style={{ color: "#123E7C" }}>محادثة مشفرة</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#6B7280" }}>ابدأ محادثتك مع المحامي</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender_role === "client" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[80%]">
                {msg.message_type === "file" ? (
                  <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
                    style={{
                      backgroundColor: msg.sender_role === "client" ? "#EAF2FF" : "#F2F4F7",
                      color: "#123E7C",
                      borderRadius: msg.sender_role === "client" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      textDecoration: "none",
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="underline">{msg.file_name || "ملف مرفق"}</span>
                    <Download className="w-3 h-3 ml-auto" />
                  </a>
                ) : (
                  <div
                    className="px-4 py-3 rounded-2xl text-sm"
                    style={{
                      backgroundColor: msg.sender_role === "client" ? "#EAF2FF" : "#F2F4F7",
                      color: "#101828",
                      borderRadius: msg.sender_role === "client" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    }}
                  >
                    {msg.content}
                  </div>
                )}
                <p className="text-[10px] mt-1 px-1" style={{ color: "#6B7280", textAlign: msg.sender_role === "client" ? "right" : "left" }}>
                  {new Date(msg.created_date).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Escalate Strip */}
      <div className="px-5 py-2 border-t" style={{ borderColor: "#EEF2F7" }}>
        <button className="w-full py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5" style={{ borderColor: "#D7E1EE", color: "#123E7C" }}>
          <AlertCircle className="w-3.5 h-3.5" />
          تصعيد إلى الفريق القانوني
        </button>
      </div>

      {/* Composer */}
      <div className="px-5 py-3 border-t flex items-end gap-3" style={{ borderColor: "#EEF2F7", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          style={{ backgroundColor: "#F7F8FA" }}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#123E7C" }} />
          ) : (
            <Paperclip className="w-4 h-4" style={{ color: "#6B7280" }} />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="*"
        />
        <div className="flex-1 min-h-[44px] max-h-24 overflow-hidden rounded-2xl border flex items-center px-4" style={{ borderColor: "#E7ECF3" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب رسالتك..."
            rows={1}
            className="w-full resize-none outline-none text-sm bg-transparent"
            style={{ color: "#101828", direction: "rtl" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={sending}
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={send}
          disabled={sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4 text-white" style={{ transform: "scaleX(-1)" }} />
          )}
        </motion.button>
      </div>
    </div>
  );
}