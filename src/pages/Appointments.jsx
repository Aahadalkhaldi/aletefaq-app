import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Compat";
import { Meeting } from '@/api/entities';
import { Calendar, Plus, Bell, Clock, Loader2 } from "lucide-react";
import BookingCalendar from "@/components/calendar/BookingCalendar";
import BookingForm from "@/components/calendar/BookingForm";
import MeetingCard from "@/components/calendar/MeetingCard";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const BG = "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)";

export default function Appointments() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const [user, setUser] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    base44.auth.me().catch(() => null).then(u => setUser(u));
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    const all = await Meeting.list("-date", 100).catch(() => []);
    setMeetings(all);
    setLoading(false);
  };

  const filtered = meetings.filter(m => {
    if (selectedDate) return m.date === selectedDate;
    if (filter === "upcoming") return m.date >= today && m.status === "scheduled";
    if (filter === "past") return m.date < today || m.status !== "scheduled";
    return true;
  });

  const stats = {
    upcoming: meetings.filter(m => m.date >= today && m.status === "scheduled").length,
    today: meetings.filter(m => m.date === today).length,
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: BG }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: TEXT }}>مواعيدي</h1>
            <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>
              {stats.upcoming} موعد قادم {stats.today > 0 ? `• ${stats.today} اليوم` : ""}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowForm(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)", boxShadow: "0 4px 14px rgba(18,62,124,0.35)" }}>
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Today banner */}
        {stats.today > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)", boxShadow: "0 6px 20px rgba(18,62,124,0.25)" }}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">لديك {stats.today} موعد اليوم</p>
              <p className="text-xs text-white/70">تحقق من تفاصيل مواعيدك أدناه</p>
            </div>
          </motion.div>
        )}

        {/* Calendar */}
        <BookingCalendar
          meetings={meetings}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(prev => prev === d ? null : d)}
        />

        {/* Selected date */}
        {selectedDate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: "#EAF2FF" }}>
            <p className="text-sm font-semibold" style={{ color: PRIMARY }}>
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("ar-QA", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <button onClick={() => setSelectedDate(null)} className="text-xs font-bold" style={{ color: PRIMARY }}>مسح</button>
          </motion.div>
        )}

        {/* Filters */}
        {!selectedDate && (
          <div className="flex gap-2">
            {[["upcoming", "القادمة"], ["past", "السابقة"], ["all", "الكل"]].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: filter === k ? PRIMARY : "white",
                  color: filter === k ? "white" : TEXT_SEC,
                  border: `1px solid ${filter === k ? PRIMARY : "#E7ECF3"}`,
                }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Book button */}
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ borderColor: "#D4E4F7", color: PRIMARY }}>
          <Plus className="w-4 h-4" /> طلب موعد جديد
        </button>

        {/* List */}
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="w-7 h-7 animate-spin mx-auto" style={{ color: PRIMARY }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border" style={{ borderColor: "#E7ECF3" }}>
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm" style={{ color: TEXT_SEC }}>لا توجد مواعيد</p>
            <button onClick={() => setShowForm(true)}
              className="mt-3 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: PRIMARY }}>
              احجز موعدك الآن
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m, i) => (
              <MeetingCard key={m.id} meeting={m} index={i} showActions={false} />
            ))}
          </div>
        )}

        {/* Reminder notice */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border" style={{ borderColor: "#E7ECF3", backgroundColor: "white" }}>
          <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#C8A96B" }} />
          <p className="text-xs" style={{ color: TEXT_SEC }}>
            ستصلك رسالة تذكير تلقائية قبل 24 ساعة من موعدك
          </p>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowForm(false)} />
            <BookingForm
              initialDate={selectedDate || ""}
              isClientView={true}
              onSave={loadMeetings}
              onClose={() => setShowForm(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}