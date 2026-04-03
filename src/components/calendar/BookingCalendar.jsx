import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";

const DAYS_AR = ["الأح", "الاث", "الثل", "الأر", "الخم", "الجم", "الس"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function BookingCalendar({ meetings = [], onSelectDate, selectedDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // meetings grouped by date string
  const meetingMap = {};
  meetings.forEach(m => {
    if (!m.date) return;
    if (!meetingMap[m.date]) meetingMap[m.date] = [];
    meetingMap[m.date].push(m);
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F3F7FD" }}>
          <ChevronRight className="w-4 h-4" style={{ color: "#123E7C" }} />
        </button>
        <p className="text-sm font-bold" style={{ color: "#101828" }}>
          {MONTHS_AR[viewMonth]} {viewYear}
        </p>
        <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F3F7FD" }}>
          <ChevronLeft className="w-4 h-4" style={{ color: "#123E7C" }} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_AR.map(d => (
          <div key={d} className="text-center text-[10px] font-bold py-1" style={{ color: "#9CA3AF" }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasMeeting = !!meetingMap[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isPast = dateStr < todayStr;

          return (
            <motion.button
              key={day}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelectDate(dateStr)}
              className="relative mx-auto w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
              style={{
                backgroundColor: isSelected ? "#123E7C" : isToday ? "#EAF2FF" : "transparent",
                color: isSelected ? "white" : isToday ? "#123E7C" : isPast ? "#CBD5E1" : "#101828",
              }}
            >
              {day}
              {hasMeeting && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: isToday ? "#123E7C" : "#C8A96B" }} />
              )}
              {hasMeeting && isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: "#F2F4F7" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C8A96B" }} />
          <span className="text-[10px]" style={{ color: "#6B7280" }}>يوجد موعد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#123E7C" }} />
          <span className="text-[10px]" style={{ color: "#6B7280" }}>اليوم</span>
        </div>
      </div>
    </div>
  );
}