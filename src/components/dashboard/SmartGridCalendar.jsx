import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Plus, Bell, Scale, ChevronDown, ChevronUp } from "lucide-react";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAYS_AR = ["الخميس","الجمعة","السبت","الأحد","الاثنين","الثلاثاء","الأربعاء"];
const DAY_ORDER = [4, 5, 6, 0, 1, 2, 3]; // Thu..Wed

const EVENTS = [
  { date: "2026-03-29", type: "reminder", label: "سالم المناعي", icon: "bell" },
  { date: "2026-03-29", type: "reminder", label: "تذكير جلسة لدعوى رقم 45593/2025", icon: "bell" },
  { date: "2026-03-30", type: "reminder", label: "التركية", icon: "bell" },
  { date: "2026-03-31", type: "hearing", label: "الحوستني", icon: "bell" },
  { date: "2026-03-31", type: "hearing", label: "تذكير جلسة لدعوى رقم 2026/01184", icon: "bell" },
  { date: "2026-04-01", type: "case", label: "متابعة الحكم لدعوى رقم 2025/02131", icon: "scale" },
  { date: "2026-04-01", type: "reminder", label: "تذكير جلسة لدعوى رقم 108", icon: "bell" },
];

function getEventsForDate(dateStr) {
  return EVENTS.filter(e => e.date === dateStr);
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function EventChip({ ev }) {
  const isCase = ev.icon === "scale";
  return (
    <div
      className="flex items-start gap-1 rounded px-1 py-0.5 mb-0.5"
      style={{
        backgroundColor: isCase ? "#EAF2FF" : "#F0FFF4",
        borderRight: `2px solid ${isCase ? "#123E7C" : "#34D399"}`
      }}
    >
      {isCase
        ? <Scale className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" style={{ color: "#123E7C" }} />
        : <Bell className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" style={{ color: "#059669" }} />
      }
      <span className="text-[9px] leading-tight line-clamp-2" style={{ color: "#101828" }}>{ev.label}</span>
    </div>
  );
}

function DayCell({ day, month, year, today, compact }) {
  if (!day) return <div className="border-l last:border-l-0" style={{ borderColor: "#EEF2F7", minHeight: compact ? "60px" : "72px" }} />;
  
  const dateStr = toDateStr(year, month, day);
  const events = getEventsForDate(dateStr);
  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div
      className="border-l last:border-l-0 p-1.5 flex flex-col"
      style={{
        borderColor: "#EEF2F7",
        backgroundColor: isToday ? "#F0F7FF" : "transparent",
        minHeight: compact ? "60px" : "72px",
      }}
    >
      <div className="mb-1">
        <span className="text-[10px] font-bold" style={{ color: isToday ? "#123E7C" : "#6B7280" }}>
          {day} {MONTHS_AR[month].slice(0, 3)}
        </span>
      </div>
      <div className="flex-1">
        {events.slice(0, compact ? 1 : 2).map((ev, i) => <EventChip key={i} ev={ev} />)}
        {events.length > (compact ? 1 : 2) && (
          <span className="text-[9px]" style={{ color: "#6B7280" }}>+{events.length - (compact ? 1 : 2)}</span>
        )}
      </div>
      {!compact && (
        <button className="mt-auto self-start opacity-40 hover:opacity-100 transition-opacity">
          <Plus className="w-3.5 h-3.5" style={{ color: "#123E7C" }} />
        </button>
      )}
    </div>
  );
}

export default function SmartGridCalendar() {
  const today = new Date(2026, 2, 29);
  const [expanded, setExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const colIndex = (dow) => DAY_ORDER.indexOf(dow);
  const firstCol = colIndex(firstDow);

  // Build full grid
  const cells = [];
  for (let i = 0; i < firstCol; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  // Find today's row index
  const todayIdx = cells.findIndex(d => d === today.getDate());
  const todayRowIdx = Math.floor(todayIdx / 7);
  const weekRow = rows[todayRowIdx] || rows[0];

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 4px 20px rgba(18,62,124,0.10), inset 0 1px 1px rgba(255,255,255,0.8)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b cursor-pointer select-none"
        style={{ borderColor: "#EEF2F7" }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          {expanded && (
            <button
              onClick={e => { e.stopPropagation(); setViewDate(new Date(year, month - 1, 1)); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#F7F8FA" }}
            >
              <ChevronRight className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
            </button>
          )}
          <p className="text-sm font-bold" style={{ color: "#101828" }}>
            {MONTHS_AR[month]} {year}
          </p>
          {expanded && (
            <button
              onClick={e => { e.stopPropagation(); setViewDate(new Date(year, month + 1, 1)); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#F7F8FA" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "#6B7280" }}>{expanded ? "تصغير" : "عرض الشهر"}</span>
          {expanded
            ? <ChevronUp className="w-4 h-4" style={{ color: "#123E7C" }} />
            : <ChevronDown className="w-4 h-4" style={{ color: "#123E7C" }} />
          }
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: "#EEF2F7" }}>
        {DAYS_AR.map(d => (
          <div key={d} className="text-center py-2 text-[10px] font-bold border-l last:border-l-0" style={{ color: "#6B7280", borderColor: "#EEF2F7" }}>
            {d.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Collapsed: single week row */}
      {!expanded && (
        <div className="grid grid-cols-7">
          {weekRow.map((day, ci) => (
            <DayCell key={ci} day={day} month={month} year={year} today={today} compact />
          ))}
        </div>
      )}

      {/* Expanded: full month */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            {rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 border-b last:border-b-0" style={{ borderColor: "#EEF2F7" }}>
                {row.map((day, ci) => (
                  <DayCell key={ci} day={day} month={month} year={year} today={today} compact={false} />
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}