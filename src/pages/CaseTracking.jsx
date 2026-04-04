import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Case, CaseDocument, ChatMessage } from '@/api/entities';
import {
  ArrowRight, FileText, User, Calendar, AlertCircle,
  CheckCircle, Clock, Phone, Mail, Download, MessageSquare,
  Loader2, Share2
} from "lucide-react";

const statusMap = {
  new: { label: "جديدة", color: "#0EA5E9", icon: "📋", bg: "#F0F9FF" },
  in_progress: { label: "قيد المتابعة", color: "#8B5CF6", icon: "⚙️", bg: "#F5F3FF" },
  court: { label: "في المحكمة", color: "#DC2626", icon: "⚖️", bg: "#FEF2F2" },
  waiting_docs: { label: "انتظار مستندات", color: "#F59E0B", icon: "📄", bg: "#FFFBEB" },
  closed: { label: "مغلقة", color: "#059669", icon: "✓", bg: "#F0FFF4" },
  archived: { label: "مؤرشفة", color: "#6B7280", icon: "📦", bg: "#F9FAFB" },
};

function CaseTimeline({ caseData }) {
  const events = [
    { date: caseData?.created_date, title: "تم إنشاء القضية", type: "create", icon: "📝" },
    { date: caseData?.next_hearing_date, title: "الجلسة القادمة", type: "hearing", icon: "📅" },
  ].filter(e => e.date);

  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E7ECF3" }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: "#101828" }}>المسار الزمني</h3>
      <div className="space-y-4">
        {events.map((event, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
                {event.icon}
              </div>
              {i < events.length - 1 && <div className="w-0.5 h-8" style={{ backgroundColor: "#D1D5DB" }} />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold" style={{ color: "#101828" }}>{event.title}</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {event.date ? new Date(event.date).toLocaleDateString("ar-QA") : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LawyerCard({ lawyerName, lawyerId }) {
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // للتطبيق العملي، نستخدم البيانات المتوفرة
    setLawyer({ name: lawyerName, email: "lawyer@aletefaq.com", phone: "+974 4444 5555" });
    setLoading(false);
  }, [lawyerName]);

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E7ECF3" }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: "#101828" }}>المحامي المسؤول</h3>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)", color: "white" }}>
          {lawyer?.name?.split(" ")[0]?.charAt(0) || "م"}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "#101828" }}>{lawyer?.name}</p>
          <div className="flex flex-col gap-1 mt-1">
            {lawyer?.email && (
              <a href={`mailto:${lawyer.email}`} className="flex items-center gap-1.5 text-xs" style={{ color: "#123E7C" }}>
                <Mail className="w-3 h-3" />
                {lawyer.email}
              </a>
            )}
            {lawyer?.phone && (
              <a href={`tel:${lawyer.phone}`} className="flex items-center gap-1.5 text-xs" style={{ color: "#123E7C" }}>
                <Phone className="w-3 h-3" />
                {lawyer.phone}
              </a>
            )}
          </div>
        </div>
      </div>
      <button className="w-full mt-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
        style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
        <MessageSquare className="w-3.5 h-3.5" />
        تواصل مباشر
      </button>
    </div>
  );
}

function DocumentsSection({ caseId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CaseDocument.filter({ case_id: caseId }, "-created_date", 50)
      .then(docs => { setDocuments(docs); setLoading(false); })
      .catch(() => setLoading(false));
  }, [caseId]);

  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E7ECF3" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold" style={{ color: "#101828" }}>المستندات المرفقة</h3>
        {documents.length > 0 && (
          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
            {documents.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#123E7C" }} />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-xs" style={{ color: "#6B7280" }}>لا توجد مستندات حالياً</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc, i) => (
            <motion.div key={doc.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
                <FileText className="w-4 h-4" style={{ color: "#123E7C" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "#101828" }}>{doc.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#6B7280" }}>{doc.category || "مستند"} • {doc.file_size || ""}</p>
              </div>
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function CaseUpdates({ caseId }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // نجلب الرسائل والتحديثات المرتبطة بالقضية
    ChatMessage.filter({ case_id: caseId }, "-created_date", 20)
      .then(msgs => {
        const updates = msgs
          .filter(m => m.sender_role === "lawyer" || m.message_type === "system")
          .slice(0, 5);
        setUpdates(updates);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [caseId]);

  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E7ECF3" }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: "#101828" }}>آخر التحديثات</h3>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#123E7C" }} />
        </div>
      ) : updates.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-xs" style={{ color: "#6B7280" }}>لا توجد تحديثات حالياً</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update, i) => (
            <motion.div key={update.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl border"
              style={{ borderColor: "#EEF2F7", backgroundColor: "#F7F8FA" }}>
              <div className="flex items-start gap-2 mb-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ backgroundColor: update.sender_role === "lawyer" ? "#EAF2FF" : "#F0FFF4", color: update.sender_role === "lawyer" ? "#123E7C" : "#1A6E3A" }}>
                  {update.sender_role === "lawyer" ? "م" : "✓"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: "#101828" }}>
                    {update.sender_name || "تحديث النظام"}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6B7280" }}>
                    {new Date(update.created_date).toLocaleDateString("ar-QA")}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#526071" }}>{update.content}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CaseTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Case.filter({ id }, "-created_date", 1)
      .then(cases => {
        if (cases.length > 0) {
          setCaseData(cases[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#123E7C" }} />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12" style={{ color: "#D1D5DB" }} />
        <p className="text-sm" style={{ color: "#6B7280" }}>لم يتم العثور على القضية</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#123E7C" }}>
          رجوع
        </button>
      </div>
    );
  }

  const st = statusMap[caseData.status] || statusMap.new;

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F3F7FD" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b px-5 pt-4 pb-4" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F7F8FA" }}>
            <ArrowRight className="w-4 h-4" style={{ color: "#101828" }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: "#6B7280" }}>{caseData.type || "قضية"}</p>
            <h1 className="text-lg font-bold truncate" style={{ color: "#101828" }}>{caseData.title}</h1>
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F7F8FA" }}>
            <Share2 className="w-4 h-4" style={{ color: "#123E7C" }} />
          </button>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: st.bg }}>
          <span className="text-base">{st.icon}</span>
          <span className="text-xs font-bold" style={{ color: st.color }}>{st.label}</span>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Key Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "رقم القضية", value: caseData.case_number || "—", icon: "📋" },
            { label: "نوع المحكمة", value: caseData.court_type || "—", icon: "⚖️" },
            { label: "الموكل", value: caseData.client_name || "—", icon: "👤" },
            { label: "الأولوية", value: caseData.priority === "urgent" ? "عاجل" : "عادية", icon: "⚡" },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border p-3" style={{ borderColor: "#E7ECF3" }}>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>{item.label}</p>
              <p className="text-sm font-bold mt-1" style={{ color: "#101828" }}>{item.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Sections */}
        <LawyerCard lawyerName={caseData.lead_lawyer_name} lawyerId={caseData.lead_lawyer_id} />
        <CaseTimeline caseData={caseData} />
        <CaseUpdates caseId={id} />
        <DocumentsSection caseId={id} />

        {/* Case Description */}
        {caseData.description && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E7ECF3" }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "#101828" }}>وصف القضية</h3>
            <p className="text-xs leading-relaxed" style={{ color: "#526071" }}>{caseData.description}</p>
          </div>
        )}

        {/* Next Hearing */}
        {caseData.next_hearing_date && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E7ECF3" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: "#123E7C" }} />
                <div>
                  <p className="text-xs" style={{ color: "#6B7280" }}>الجلسة القادمة</p>
                  <p className="text-sm font-bold" style={{ color: "#101828" }}>
                    {new Date(caseData.next_hearing_date).toLocaleDateString("ar-QA")}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5" style={{ color: "#1A6E3A" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}