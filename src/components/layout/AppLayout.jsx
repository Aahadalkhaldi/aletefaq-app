import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, MessageSquare, User, Scale, FileText, Bell, BarChart2, Landmark, MoreHorizontal, X, ChevronLeft, CalendarDays } from "lucide-react";
import LegalAssistantBubble from "@/components/chat/LegalAssistantBubble";
import { Notification } from '@/api/entities';

const tabs = [
  { path: "/dashboard", label: "الرئيسية", icon: Home },
  { path: "/matters", label: "ملفاتي", icon: Scale },
  { path: "/billing", label: "الفواتير", icon: FileText },
  { path: "/messages", label: "الرسائل", icon: MessageSquare },
  { path: "/profile", label: "حسابي", icon: User },
];

const extraTabs = [
  { path: "/my-hearings", label: "جلساتي", icon: CalendarDays, color: "#123E7C", bg: "#EAF2FF" },
  { path: "/my-vault", label: "ملفاتي", icon: FileText, color: "#6D28D9", bg: "#F5F3FF" },
  { path: "/analytics", label: "التحليلات", icon: BarChart2, color: "#6366F1", bg: "#EEF2FF" },
  { path: "/services", label: "الخدمات القضائية", icon: Landmark, color: "#1A6E3A", bg: "#F0FFF4" },
  { path: "/courts", label: "المحاكم", icon: Scale, color: "#123E7C", bg: "#EAF2FF" },

];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [showMore, setShowMore] = useState(false);

  const isExtraActive = extraTabs.some(t => location.pathname === t.path);

  useEffect(() => {
    Notification.filter({ is_read: false }, "-created_date", 10)
      .then(n => setUnread(n.length))
      .catch(() => {});

    const unsub = Notification.subscribe((event) => {
      if (event.type === "create") setUnread(prev => prev + 1);
    });
    return unsub;
  }, []);

  const handleTabClick = (tabPath) => {
    if (location.pathname === tabPath) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(tabPath);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {/* Top Bell Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-end px-5 pb-2 pointer-events-none"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}>
        <button
          onClick={() => navigate("/notifications")}
          className="pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center shadow-md relative"
          style={{ backgroundColor: "white", border: "1px solid #E7ECF3" }}
        >
          <Bell className="w-4 h-4" style={{ color: "#123E7C" }} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: "#B42318" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24" id="main-scroll-container">
        <Outlet />
      </main>

      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 z-50 bg-white rounded-t-3xl p-5 pb-6"
              style={{ bottom: "72px", maxHeight: "calc(85vh - 72px)", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold" style={{ color: "#101828" }}>صفحات أخرى</h3>
                <button onClick={() => setShowMore(false)}>
                  <X className="w-5 h-5" style={{ color: "#6B7280" }} />
                </button>
              </div>
              <div className="space-y-2">
                {extraTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.path}
                      onClick={() => { navigate(tab.path); setShowMore(false); }}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl border text-right"
                      style={{ borderColor: "#E7ECF3" }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: tab.bg }}>
                        <Icon className="w-5 h-5" style={{ color: tab.color }} />
                      </div>
                      <span className="text-sm font-semibold flex-1" style={{ color: "#101828" }}>{tab.label}</span>
                      <ChevronLeft className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Assistant Bubble */}
      <LegalAssistantBubble />

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around px-2 z-50"
        style={{ borderColor: "#EEF2F7", height: "72px", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab.path)}
              className="flex flex-col items-center gap-1 min-w-0 flex-1 py-2"
            >
              <motion.div
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ duration: 0.15 }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={isActive ? {
                  background: "linear-gradient(145deg, #123E7C, #1E4E95)",
                  boxShadow: "0 6px 16px rgba(18,62,124,0.35), inset 0 1px 1px rgba(255,255,255,0.4)",
                } : { background: "transparent" }}
              >
                {isActive && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)" }} />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-2xl" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)" }} />
                  </>
                )}
                <Icon
                  className="w-5 h-5 relative z-10"
                  style={{ color: isActive ? "white" : "#6B7280", filter: isActive ? "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" : "none" }}
                />
              </motion.div>
              <span
                className="text-[9px] font-semibold truncate"
                style={{ color: isActive ? "#123E7C" : "#6B7280" }}
              >
                {tab.label}
                </span>
                </button>
                );
                })}

        {/* More Button */}
        <button
          onClick={() => setShowMore(true)}
          className="flex flex-col items-center gap-1 min-w-0 flex-1 py-2"
        >
          <motion.div
            animate={{ scale: isExtraActive ? 1.05 : 1 }}
            transition={{ duration: 0.15 }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center relative overflow-hidden"
            style={isExtraActive ? {
              background: "linear-gradient(145deg, #123E7C, #1E4E95)",
              boxShadow: "0 6px 16px rgba(18,62,124,0.35)",
            } : { background: "transparent" }}
          >
            <MoreHorizontal
              className="w-5 h-5"
              style={{ color: isExtraActive ? "white" : "#6B7280" }}
            />
          </motion.div>
          <span className="text-[9px] font-semibold" style={{ color: isExtraActive ? "#123E7C" : "#6B7280" }}>
            المزيد
          </span>
        </button>
      </nav>
    </div>
  );
}