import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Shield, MessageCircle, Clock } from "lucide-react";
import GlassIcon from "../components/ui/GlassIcon";
import { ChatMessage, Conversation } from '@/api/entities';

export default function Messages() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    loadConversations();
    
    const unsub = ChatMessage.subscribe((event) => {
      if (event.type === "create") {
        loadConversations();
      }
    });

    return unsub;
  }, []);

  const loadConversations = async () => {
    try {
      const msgs = await ChatMessage.list("-created_date", 500);
      
      // Group by conversation_id
      const grouped = {};
      msgs.forEach(msg => {
        if (!grouped[msg.conversation_id]) {
          grouped[msg.conversation_id] = [];
        }
        grouped[msg.conversation_id].push(msg);
      });

      // Get conversation details
      const convs = await Conversation.list("-updated_date", 100);
      
      const enriched = convs.map(conv => {
        const conv_msgs = grouped[conv.id] || [];
        const lastMsg = conv_msgs[0];
        const unread = conv_msgs.filter(m => !m.is_read && m.sender_id !== "client").length;
        
        return {
          ...conv,
          last_message: lastMsg?.content || conv.last_message || "لا توجد رسائل",
          last_message_date: lastMsg?.created_date || conv.last_message_date,
          unread_count: unread,
        };
      });

      setConversations(enriched.filter(c => c.participant_names?.length > 0));
      setLoading(false);
    } catch (error) {
      console.error("خطأ في تحميل الرسائل:", error);
      setLoading(false);
    }
  };

  const filtered = conversations.filter(
    (c) => c.title?.includes(search) || 
           c.last_message?.includes(search) ||
           c.participant_names?.some(n => n.includes(search))
  );

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#101828" }}>الرسائل</h1>

        {/* Security Strip */}
        <div className="flex items-center gap-1.5 mb-4">
          <Shield className="w-3.5 h-3.5" style={{ color: "#123E7C" }} />
          <span className="text-xs font-semibold" style={{ color: "#123E7C" }}>المراسلات المشفرة</span>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="البحث في الرسائل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-xl px-4 pr-10 text-sm outline-none"
            style={{
              backgroundColor: "#F7F8FA",
              border: "1px solid #E7ECF3",
              color: "#101828",
              direction: "rtl",
            }}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
        </div>
      </div>

      {/* Thread List */}
      <div className="divide-y" style={{ borderColor: "#EEF2F7" }}>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: "#123E7C" }} />
            <p className="text-sm mt-3" style={{ color: "#6B7280" }}>جارٍ تحميل الرسائل...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-5">
            <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm font-medium" style={{ color: "#6B7280" }}>لا توجد محادثات بعد</p>
          </div>
        ) : (
          filtered.map((conv, i) => {
            const lawyerName = conv.participant_names?.find(n => n !== "client") || "محامٍ";
            const initials = lawyerName.charAt(0);
            return (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="w-full px-5 py-4 flex items-center gap-3 text-right hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white" 
                  style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
                  {initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>{lawyerName}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>{conv.title || "محادثة عامة"}</p>
                      <p className="text-xs mt-1 truncate line-clamp-1" style={{ color: "#6B7280" }}>
                        {conv.case_id ? "📎 ملف القضية: " : ""}{conv.last_message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}>
                        <Clock className="w-3 h-3" />
                        {new Date(conv.last_message_date).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {conv.unread_count > 0 && (
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: "#B42318" }}
                        >
                          {conv.unread_count > 9 ? "9+" : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}