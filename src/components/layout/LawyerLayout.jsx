import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Scale, CalendarDays,
  Bell, DollarSign, BarChart2, UserCircle, Shield, ClipboardList,
  RefreshCw, X, MoreHorizontal
} from "lucide-react";
import { base44 } from "@/api/base44Compat";
import { HearingRequest, Notification, ServiceRequest, SignatureRequest } from '@/api/entities';
import QuickAddSheet from "@/components/lawyer/QuickAddSheet";

// التبويبات الرئيسية — القضايا والجلسات فقط + زر المزيد
const mainTabs = [
  { path: "/cases", label: "القضايا", icon: Scale },
  { path: "/hearings", label: "الجلسات", icon: CalendarDays },
];

// تبويبات "المزيد" المنبثقة
const moreTabs = [
  { path: "/court-requests", label: "الطلبات", icon: ClipboardList, color: "#123E7C", bg: "#EAF2FF" },
  { path: "/followups", label: "المتابعات", icon: RefreshCw, color: "#7C3AED", bg: "#F5F3FF" },
  { path: "/finance", label: "الحسابات", icon: DollarSign, color: "#059669", bg: "#ECFDF5" },
  { path: "/lawyer-dashboard", label: "الرئيسية", icon: LayoutDashboard, color: "#101828", bg: "#F2F4F7" },
  { path: "/clients", label: "الموكلين", icon: UserCircle, color: "#0369A1", bg: "#F0F9FF" },
  { path: "/office-analytics", label: "التحليلات", icon: BarChart2, color: "#D97706", bg: "#FFFBEB" },
];

export default function LawyerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => { if (u?.role === "admin") setIsAdmin(true); }).catch(() => {});
  }, []);

  useEffect(() => {
    Notification.filter({ is_read: false }, "-created_date", 10)
      .then(n => setUnread(n.length)).catch(() => {});


    Promise.all([
      HearingRequest.filter({ status: "pending" }, "-created_date", 20).catch(() => []),
      SignatureRequest.filter({ status: "pending" }, "-created_date", 20).catch(() => []),
    ]).then(([hr, sig]) => setPendingCount(hr.length + sig.length));

    ServiceRequest.filter({ status: "submitted" }, "-created_date", 50)
      .then(r => setNewRequestsCount(r.length)).catch(() => {});

    const unsubReq = ServiceRequest.subscribe(e => {
      if (e.type === "create") setNewRequestsCount(prev => prev + 1);
      if (e.type === "update") ServiceRequest.filter({ status: "submitted" }, "-created_date", 50).then(r => setNewRequestsCount(r.length)).catch(() => {});
    });
    const unsub = Notification.subscribe((event) => {
      if (event.type === "create") setUnread(prev => prev + 1);
    });
    return () => { unsub(); unsubReq(); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col" dir="rtl"
      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", backgroundColor: "#F3F7FD" }}>

      {/* Top Header Bar - Lawyer Style */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", borderColor: "#E7ECF3", boxShadow: "0 1px 8px rgba(18,62,124,0.06)" }}>
        <div className="flex items-center justify-between px-4" style={{ height: "52px" }}>
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #123E7C, #1E4E95)" }}>
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold" style={{ color: "#101828" }}>الاتفاق</p>
              <p className="text-[10px]" style={{ color: "#6B7280" }}>لوحة المحامي</p>
            </div>
          </div>

          {/* Right Actions — compact row */}
          <div className="flex items-center gap-1.5">
            <QuickAddSheet />

            <button onClick={() => navigate("/office-analytics")}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: location.pathname === "/office-analytics" ? "#EAF2FF" : "#F3F7FD" }}>
              <BarChart2 className="w-4 h-4" style={{ color: "#123E7C" }} />
            </button>

            {isAdmin && (
              <button onClick={() => navigate("/monitoring")}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: location.pathname === "/monitoring" ? "#FDECEC" : "#F3F7FD" }}>
                <Shield className="w-4 h-4" style={{ color: location.pathname === "/monitoring" ? "#B42318" : "#123E7C" }} />
              </button>
            )}

            <button onClick={() => navigate("/notifications")}
              className="relative w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#F3F7FD" }}>
              <Bell className="w-4 h-4" style={{ color: "#123E7C" }} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ backgroundColor: "#B42318" }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            <button onClick={() => navigate("/lawyer-profile")}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#F3F7FD" }}>
              <UserCircle className="w-4 h-4" style={{ color: "#123E7C" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" id="lawyer-main-scroll" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", paddingBottom: "80px" }}>
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
              style={{ bottom: "72px", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#E7ECF3" }} />
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setShowMore(false)}>
                  <X className="w-5 h-5" style={{ color: "#6B7280" }} />
                </button>
                <h3 className="text-base font-bold" style={{ color: "#101828" }}>القائمة</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {moreTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = location.pathname === tab.path ||
                    (tab.path === "/cases" && location.pathname.startsWith("/cases"));
                  return (
                    <button
                      key={tab.path}
                      onClick={() => { navigate(tab.path); setShowMore(false); }}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border"
                      style={{ borderColor: isActive ? tab.color + "40" : "#E7ECF3", backgroundColor: isActive ? tab.bg : "white" }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tab.bg }}>
                        <Icon className="w-5 h-5" style={{ color: tab.color }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: isActive ? tab.color : "#101828" }}>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar — القضايا + الجلسات + المزيد */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t"
        style={{ borderColor: "#E7ECF3", height: "72px", paddingBottom: "env(safe-area-inset-bottom, 0px)", boxShadow: "0 -2px 12px rgba(18,62,124,0.07)" }}>
        <div className="flex items-center h-full px-4 gap-3">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path ||
              (tab.path === "/cases" && location.pathname.startsWith("/cases")) ||
              (tab.path === "/hearings" && location.pathname.startsWith("/hearings"));
            return (
              <Link key={tab.path} to={tab.path}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
                <motion.div animate={{ scale: isActive ? 1.05 : 1 }} transition={{ duration: 0.15 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                  style={isActive ? {
                    background: "linear-gradient(145deg, #123E7C, #1E4E95)",
                    boxShadow: "0 4px 12px rgba(18,62,124,0.3)",
                  } : { backgroundColor: "#F7F8FA" }}>
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl"
                      style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)" }} />
                  )}
                  <Icon className="w-5 h-5 relative z-10"
                    style={{ color: isActive ? "white" : "#9CA3AF" }} />
                </motion.div>
                <span className="text-[10px] font-bold"
                  style={{ color: isActive ? "#123E7C" : "#9CA3AF" }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* زر المزيد */}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
          >
            <motion.div
              animate={{ scale: showMore ? 1.05 : 1 }}
              transition={{ duration: 0.15 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={showMore ? {
                background: "linear-gradient(145deg, #123E7C, #1E4E95)",
                boxShadow: "0 4px 12px rgba(18,62,124,0.3)",
              } : { backgroundColor: "#F7F8FA" }}>
              <MoreHorizontal className="w-5 h-5" style={{ color: showMore ? "white" : "#9CA3AF" }} />
            </motion.div>
            <span className="text-[10px] font-bold" style={{ color: showMore ? "#123E7C" : "#9CA3AF" }}>المزيد</span>
          </button>
        </div>
      </nav>
    </div>
  );
}