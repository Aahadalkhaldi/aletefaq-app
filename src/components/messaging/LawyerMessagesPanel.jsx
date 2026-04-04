import { useState, useEffect } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { Conversation } from '@/api/entities';
import { useNavigate } from "react-router-dom";

export default function LawyerMessagesPanel({ caseId, clientId, clientName }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [caseId, clientId]);

  const loadConversations = async () => {
    try {
      const convs = await Conversation.filter({
        case_id: caseId,
        type: "case",
      }, "-updated_date", 10);

      setConversations(convs.filter(c => c.participant_names?.includes(clientName)));
    } catch (error) {
      console.error("خطأ:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#123E7C" }} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: "#6B7280" }}>لا توجد محادثات مع هذا العميل</p>
      ) : (
        conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => navigate(`/chat/${conv.id}`)}
            className="w-full flex items-center gap-2 p-3 rounded-xl text-sm text-right transition-colors"
            style={{ backgroundColor: "#EAF2FF", color: "#123E7C", border: "1px solid #D7E1EE" }}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{conv.title}</p>
              {conv.last_message && (
                <p className="text-xs mt-0.5 truncate opacity-70">{conv.last_message}</p>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}