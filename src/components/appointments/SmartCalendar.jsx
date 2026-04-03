import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, Video, MapPin } from "lucide-react";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];
const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// أيام الجلسات (day: 1-31, month: 0-indexed, year)
const sessionDays = [
  { day: 28, month: 2, year: 2026, label: "استشارة قانونية", lawyer: "د. أحمد زايد", time: "10:00 ص", type: "video" },
  { day: 2,  month: 3, year: 2026, label: "متابعة ملف التنفيذ", lawyer: "د. خالد المنصور", time: "2:00 م", type: "inperson" },
];

function isSameDay(d, day, month, year) {
  return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
}

export default function SmartCalendar() {
  const today = new Date(2026, 2, 27); // تاريخ اليوم المحاكى
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const getSession = (day) => sessionDays.find((s) => s.day === day && s.month === month && s.year === year);

  const isToday = (day) => isSameDay(today, day, month, year);

  const selectedSession = selectedDay ? getSession(selectedDay) : null;

  // Build grid cells: empty + day numbers
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card border" style={{ borderColor: "#E7ECF3" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
          <ChevronRight className="w-4 h-4" style={{ color: "#6B7280" }} />
        </button>
        <p className="text-sm font-bold" style={{ color: "#101828" }}>
          {MONTHS_AR[month]} {year}
        </p>
        <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
          <ChevronLeft className="w-4 h-4" style={{ color: "#6B7280" }} />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_AR.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold pb-1" style={{ color: "#6B7280" }}>
            {d.slice(0, 2)}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const session = getSession(day);
          const today_ = isToday(day);
          const selected = selectedDay === day;

          return (
            <motion.button
              key={day}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedDay(selected ? null : day)}
              className="relative flex flex-col items-center justify-center h-9 rounded-xl text-xs font-semibold transition-all mx-0.5"
              style={{
                backgroundColor: selected
                  ? "#123E7C"
                  : today_
                  ? "#EAF2FF"
                  : "transparent",
                color: selected ? "white" : today_ ? "#123E7C" : "#101828",
              }}
            >
              {day}
              {session && (
                <span
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: selected ? "white" : "#C8A96B" }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: "#EEF2F7" }}>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C8A96B" }} />
          <span className="text-[11px]" style={{ color: "#6B7280" }}>يوم جلسة</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#EAF2FF", border: "1.5px solid #123E7C" }} />
          <span className="text-[11px]" style={{ color: "#6B7280" }}>اليوم</span>
        </div>
      </div>

      {/* Session Detail */}
      {selectedSession && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-2xl p-3 border"
          style={{ backgroundColor: "#F3F7FD", borderColor: "#D4E4F7" }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
              {selectedSession.type === "video"
                ? <Video className="w-4 h-4" style={{ color: "#123E7C" }} />
                : <MapPin className="w-4 h-4" style={{ color: "#123E7C" }} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "#101828" }}>{selectedSession.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{selectedSession.lawyer}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                {selectedSession.day} {MONTHS_AR[selectedSession.month]} {selectedSession.year} • {selectedSession.time}
              </p>
            </div>
            <button
              className="text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: "#123E7C", color: "white" }}
            >
              {selectedSession.type === "video" ? "انضمام" : "تفاصيل"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}