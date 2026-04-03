import { motion } from "framer-motion";
import { Calendar, Clock, Building2, Video, Scale, MapPin, Bell, BellOff, CheckCircle, X } from "lucide-react";

const locationMap = {
  office: { label: "المكتب", icon: Building2, color: "#123E7C", bg: "#EAF2FF" },
  online: { label: "أونلاين", icon: Video, color: "#6366F1", bg: "#EEF2FF" },
  court: { label: "المحكمة", icon: Scale, color: "#8A5A00", bg: "#FFF4E5" },
  other: { label: "أخرى", icon: MapPin, color: "#526071", bg: "#F2F4F7" },
};

const statusConfig = {
  scheduled: { label: "مجدول", bg: "#EAF2FF", text: "#123E7C" },
  completed: { label: "منتهي", bg: "#F0FFF4", text: "#1A6E3A" },
  cancelled: { label: "ملغي", bg: "#FDECEC", text: "#B42318" },
};

export default function MeetingCard({ meeting, index = 0, onComplete, onCancel, showActions = true }) {
  const today = new Date().toISOString().split("T")[0];
  const loc = locationMap[meeting.location] || locationMap.other;
  const LocIcon = loc.icon;
  const st = statusConfig[meeting.status] || statusConfig.scheduled;
  const isToday = meeting.date === today;
  const isTomorrow = (() => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return meeting.date === t.toISOString().split("T")[0];
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white rounded-2xl border p-4"
      style={{
        borderColor: "#E7ECF3",
        borderRightWidth: 4,
        borderRightColor: isToday ? "#123E7C" : isTomorrow ? "#C8A96B" : "#E7ECF3",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {isToday && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#123E7C", color: "white" }}>
                اليوم
              </span>
            )}
            {isTomorrow && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF4E5", color: "#8A5A00" }}>
                غداً
              </span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.text }}>
              {st.label}
            </span>
            {meeting.reminder_sent && (
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "#1A6E3A" }}>
                <Bell className="w-3 h-3" /> تم الإشعار
              </span>
            )}
          </div>
          <p className="text-sm font-bold" style={{ color: "#101828" }}>{meeting.title}</p>
          {meeting.client_name && (
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>الموكل: {meeting.client_name}</p>
          )}
          {meeting.case_title && (
            <p className="text-xs" style={{ color: "#9CA3AF" }}>القضية: {meeting.case_title}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mr-3" style={{ backgroundColor: loc.bg }}>
          <LocIcon className="w-4 h-4" style={{ color: loc.color }} />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs mb-3" style={{ color: "#6B7280" }}>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {meeting.date ? new Date(meeting.date + "T00:00:00").toLocaleDateString("ar-QA", { weekday: "short", month: "short", day: "numeric" }) : "—"}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {meeting.time || "—"} ({meeting.duration_minutes} د)
        </div>
      </div>

      {meeting.notes && (
        <p className="text-xs mb-3 px-3 py-2 rounded-xl" style={{ backgroundColor: "#F3F7FD", color: "#6B7280" }}>
          {meeting.notes}
        </p>
      )}

      {showActions && meeting.status === "scheduled" && (
        <div className="flex gap-2">
          <button onClick={() => onComplete?.(meeting)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
            style={{ backgroundColor: "#F0FFF4", color: "#1A6E3A" }}>
            <CheckCircle className="w-3.5 h-3.5" /> انتهى
          </button>
          <button onClick={() => onCancel?.(meeting)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
            style={{ backgroundColor: "#FDECEC", color: "#B42318" }}>
            <X className="w-3.5 h-3.5" /> إلغاء
          </button>
        </div>
      )}
    </motion.div>
  );
}