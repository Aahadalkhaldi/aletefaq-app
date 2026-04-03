import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

export default function StartConversationButton({ caseId, caseTitle, lawyerName }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    setLoading(true);
    try {
      const conv = await base44.entities.Conversation.create({
        type: "case",
        case_id: caseId,
        title: `${caseTitle} - محادثة`,
        participants: ["client", lawyerName],
        participant_names: ["client", lawyerName],
      });

      navigate(`/chat/${conv.id}`);
    } catch (error) {
      console.error("خطأ:", error);
      alert("فشل فتح المحادثة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
      style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageSquare className="w-4 h-4" />
      )}
      {loading ? "جارٍ الفتح..." : "تحدث مع المحامي"}
    </button>
  );
}