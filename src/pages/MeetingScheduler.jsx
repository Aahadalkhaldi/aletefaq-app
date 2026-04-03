import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Plus, Calendar, Bell, CheckCircle, Clock, Users, Loader2 } from "lucide-react";
import BookingCalendar from "@/components/calendar/BookingCalendar";
import BookingForm from "@/components/calendar/BookingForm";
import MeetingCard from "@/components/calendar/MeetingCard";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const BG = "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)";

export default function MeetingScheduler() {
  const [meetings, setMeetings] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [m, c] = await Promise.all([
      base44.entities.Meeting.list("-date", 100).catch(() => []),
      base44.entities.Case.filter({ status: "in_progress" }, "-updated_date", 100).catch(() => []),
    ]);
    setMeetings(m);
    setCases(c);
    setLoading(false);
  };

  const handleComplete = async (meeting) => {
    await base44.entities.Meeting.update(meeting.id, { status: "completed" });
    loadAll();
  };

  const handleCancel = async (meeting) => {
    await base44.entities.Meeting.update(meeting.id, { status: "cancelled" });
    // Create cancellation notification
    if (meeting.client_name) {
      await base44.entities.Notification.create({
        user_id: meeting.client_name,
        title: "❌ تم إلغاء الموعد",
        body: `تم إلغاء موعد "${meeting.title}" بتاريخ ${meeting.date}`,
        type: "case_update",
        related_id: meeting.id,
        related_type: "Meeting",
        action_url: "/appointments",
        is_read: false,
      }).catch(() => {});
    }
    loadAll();
  };

  const handleSelectDate = (date) => {
    setSelectedDate(prev => prev === date ? null : date);
  };

  const dayMeetings = selectedDate
    ? meetings.filter(m => m.date === selectedDate)
    : null;

  const filtered = meetings.filter(m => {
    if (selectedDate) return m.date === selectedDate;
    if (filter === "upcoming") return m.date >= today && m.status === "scheduled";
    if (filter === "today") return m.date === today;
    if (filter === "past") return m.date < today || m.status !== "scheduled";
    return true;
  });

  // Stats
  const stats = {
    upcoming: meetings.filter(m => m.date >= today && m.status === "scheduled").length,
    today: meetings.filter(m => m.date === today && m.status === "scheduled").length,
    total: meetings.length,
    pending_reminder: meetings.filter(m => m.status === "scheduled" && !m.reminder_sent && m.date >= today).length,
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold" style={{ color: TEXT }}>جدول المواعيد</h1>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowForm(true); }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)", boxShadow: "0 4px 12px rgba(18,62,124,0.3)" }}>
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
        <p className="text-xs" style={{ color: TEXT_SEC }}>إدارة مواعيد الموكلين والاستشارات</p>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "القادمة", value: stats.upcoming, icon: Calendar, color: PRIMARY, bg: "#EAF2FF" },
            { label: "اليوم", value: stats.today, icon: Clock, color: "#1A6E3A", bg: "#F0FFF4" },
            { label: "تنتظر تذكير", value: stats.pending_reminder, icon: Bell, color: "#8A5A00", bg: "#FFF4E5" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl p-3 border text-center" style={{ borderColor: "#E7ECF3" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: s.bg }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px]" style={{ color: TEXT_SEC }}>{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Calendar */}
        <BookingCalendar
          meetings={meetings}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />

        {/* Selected date indicator */}
        {selectedDate && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: "#EAF2FF" }}>
            <p className="text-sm font-semibold" style={{ color: PRIMARY }}>
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("ar-QA", { weekday: "long", month: "long", day: "numeric" })}
              {dayMeetings?.length ? ` — ${dayMeetings.length} موعد` : " — لا توجد مواعيد"}
            </p>
            <button onClick={() => setSelectedDate(null)} className="text-xs font-bold" style={{ color: PRIMARY }}>
              مسح
            </button>
          </motion.div>
        )}

        {/* Filter tabs (only when no date selected) */}
        {!selectedDate && (
          <div className="flex gap-2">
            {[
              ["upcoming", "القادمة"],
              ["today", "اليوم"],
              ["past", "السابقة"],
              ["all", "الكل"],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: filter === key ? PRIMARY : "white",
                  color: filter === key ? "white" : TEXT_SEC,
                  border: `1px solid ${filter === key ? PRIMARY : "#E7ECF3"}`,
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Add meeting button */}
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold transition-all"
          style={{ borderColor: "#D4E4F7", color: PRIMARY }}>
          <Plus className="w-4 h-4" />
          {selectedDate ? `إضافة موعد ليوم ${new Date(selectedDate + "T00:00:00").toLocaleDateString("ar-QA", { month: "short", day: "numeric" })}` : "موعد جديد"}
        </button>

        {/* Meetings list */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: PRIMARY }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border" style={{ borderColor: "#E7ECF3" }}>
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm font-medium" style={{ color: TEXT_SEC }}>
              {selectedDate ? "لا توجد مواعيد في هذا اليوم" : "لا توجد مواعيد"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((m, i) => (
                <MeetingCard key={m.id} meeting={m} index={i}
                  onComplete={handleComplete} onCancel={handleCancel} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Booking Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowForm(false)} />
            <BookingForm
              cases={cases}
              initialDate={selectedDate || ""}
              onSave={loadAll}
              onClose={() => setShowForm(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}