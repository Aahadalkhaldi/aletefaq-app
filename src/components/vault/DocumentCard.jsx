import { motion } from "framer-motion";
import { FileText, Image, File, Eye, Download, Lock, Share2, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";

const CATEGORY_CONFIG = {
  contract:          { label: "عقد",         bg: "#EAF2FF", color: "#123E7C", dot: "#2563EB" },
  court_order:       { label: "أمر محكمة",   bg: "#FFF4E5", color: "#8A5A00", dot: "#F59E0B" },
  power_of_attorney: { label: "توكيل",       bg: "#F5F3FF", color: "#6D28D9", dot: "#7C3AED" },
  evidence:          { label: "دليل",         bg: "#FEF2F2", color: "#B42318", dot: "#DC2626" },
  correspondence:    { label: "مراسلة",      bg: "#ECFDF5", color: "#065F46", dot: "#059669" },
  invoice:           { label: "فاتورة",       bg: "#F0FDF4", color: "#166534", dot: "#16A34A" },
  other:             { label: "أخرى",         bg: "#F2F4F7", color: "#374151", dot: "#6B7280" },
};

const STATUS_CONFIG = {
  pending_review: { label: "قيد المراجعة", icon: Clock, color: "#8A5A00", bg: "#FFF4E5" },
  approved:       { label: "معتمد",         icon: CheckCircle, color: "#065F46", bg: "#ECFDF5" },
  rejected:       { label: "مرفوض",         icon: XCircle, color: "#B42318", bg: "#FEF2F2" },
  archived:       { label: "مؤرشف",         icon: null, color: "#6B7280", bg: "#F2F4F7" },
};

const TYPE_ICON = { pdf: FileText, image: Image, docx: File };

export default function DocumentCard({ doc, index = 0, onDelete, showStatus = false }) {
  const cat = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other;
  const st = STATUS_CONFIG[doc.status] || null;
  const Icon = TYPE_ICON[doc.file_type] || FileText;
  const StatusIcon = st?.icon;
  const date = doc.created_date ? new Date(doc.created_date) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-3 bg-white rounded-2xl p-4 border relative overflow-hidden"
      style={{ borderColor: "#E7ECF3", boxShadow: "0 2px 8px rgba(18,62,124,0.05)" }}
    >
      {/* Color bar */}
      <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-2xl" style={{ backgroundColor: cat.dot }} />

      {/* Icon */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg }}>
        <Icon className="w-5 h-5" style={{ color: cat.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-snug truncate" style={{ color: "#101828" }}>{doc.name}</p>

        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>
            {cat.label}
          </span>
          {doc.is_confidential && (
            <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF4E5", color: "#8A5A00" }}>
              <Lock className="w-2.5 h-2.5" /> سري
            </span>
          )}
          {doc.shared_with_client && (
            <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
              <Share2 className="w-2.5 h-2.5" /> مشارك
            </span>
          )}
          {showStatus && st && (
            <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
              {StatusIcon && <StatusIcon className="w-2.5 h-2.5" />} {st.label}
            </span>
          )}
        </div>

        {doc.description && (
          <p className="text-xs mt-1 line-clamp-1" style={{ color: "#6B7280" }}>{doc.description}</p>
        )}

        <div className="flex items-center gap-2 mt-1">
          {doc.case_title && (
            <p className="text-[10px] truncate" style={{ color: "#9CA3AF" }}>📁 {doc.case_title}</p>
          )}
          {doc.file_size && (
            <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{doc.file_size}</p>
          )}
          {date && (
            <p className="text-[10px] mr-auto" style={{ color: "#9CA3AF" }}>
              {date.toLocaleDateString("ar-QA", { day: "numeric", month: "short" })}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {doc.file_url && (
          <>
            <a href={doc.file_url} target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#EAF2FF" }}>
              <Eye className="w-3.5 h-3.5" style={{ color: "#123E7C" }} />
            </a>
            <a href={doc.file_url} download
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#F2F4F7" }}>
              <Download className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
            </a>
          </>
        )}
        {onDelete && (
          <button onClick={() => onDelete(doc)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#FEF2F2" }}>
            <Trash2 className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
          </button>
        )}
      </div>
    </motion.div>
  );
}