import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRIMARY = '#123E7C';
const TEXT = '#101828';
const TEXT_SEC = '#6B7280';

export default function HearingsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hearings, setHearings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHearings();
  }, []);

  const loadHearings = async () => {
    try {
      const data = await base44.entities.Hearing.filter({ status: 'scheduled' }, 'date', 200);
      setHearings(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading hearings:', error);
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getHearingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return hearings.filter(h => h.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Fill empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Fill days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const isToday = (date) => {
    const today = new Date();
    return date && date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const selectedDateHearings = selectedDate ? getHearingsForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="bg-white rounded-2xl p-4 border shadow-card" style={{ borderColor: '#E7ECF3' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" style={{ color: PRIMARY }} />
          </button>
          <h2 className="text-base font-bold" style={{ color: TEXT }}>{monthName}</h2>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: PRIMARY }} />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-semibold py-2" style={{ color: TEXT_SEC }}>
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => {
            const dayHearings = date ? getHearingsForDate(date) : [];
            const isTodayDate = isToday(date);

            return (
              <motion.button
                key={idx}
                onClick={() => date && setSelectedDate(date)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold relative transition-all p-1"
                style={{
                  backgroundColor: date ? (isTodayDate ? PRIMARY : selectedDate?.getTime() === date?.getTime() ? '#EAF2FF' : 'white') : 'transparent',
                  color: date ? (isTodayDate ? 'white' : TEXT) : TEXT_SEC,
                  border: date ? `1px solid ${dayHearings.length > 0 ? PRIMARY : '#E7ECF3'}` : 'none',
                }}
                whileHover={date ? { scale: 1.05 } : {}}
              >
                {date && (
                  <>
                    <span>{date.getDate()}</span>
                    {dayHearings.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayHearings.map((_, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: isTodayDate ? 'white' : PRIMARY }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected date details */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-4 border shadow-card"
            style={{ borderColor: '#E7ECF3' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" style={{ color: PRIMARY }} />
              <h3 className="font-bold" style={{ color: TEXT }}>
                {selectedDate.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
            </div>

            {selectedDateHearings.length === 0 ? (
              <p className="text-sm" style={{ color: TEXT_SEC }}>لا توجد جلسات في هذا التاريخ</p>
            ) : (
              <div className="space-y-2">
                {selectedDateHearings.map((hearing) => (
                  <div
                    key={hearing.id}
                    className="border rounded-xl p-3"
                    style={{ borderColor: '#E7ECF3', backgroundColor: '#F9FAFB' }}
                  >
                    <p className="text-sm font-bold mb-2" style={{ color: TEXT }}>
                      {hearing.case_title || 'جلسة'}
                    </p>
                    <div className="space-y-1 text-xs" style={{ color: TEXT_SEC }}>
                      {hearing.time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{hearing.time}</span>
                        </div>
                      )}
                      {hearing.court_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span>{hearing.court_name}</span>
                        </div>
                      )}
                      {hearing.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span>{hearing.location}</span>
                        </div>
                      )}
                    </div>
                    {hearing.notes && (
                      <p className="text-xs mt-2 pt-2 border-t" style={{ borderColor: '#E0E7FF', color: TEXT_SEC }}>
                        ملاحظات: {hearing.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming hearings summary */}
      {!loading && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border" style={{ borderColor: '#D4E4F7' }}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" style={{ color: PRIMARY }} />
            <p className="font-bold text-sm" style={{ color: PRIMARY }}>الجلسات القادمة</p>
          </div>
          <p className="text-xs" style={{ color: TEXT }}>
            {hearings.length} جلسة مجدولة
          </p>
        </div>
      )}
    </div>
  );
}