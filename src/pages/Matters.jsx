import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ArrowRight, User } from "lucide-react";
import GlassIcon from "../components/ui/GlassIcon";
import StatusChip from "../components/ui/StatusChip";

const executionData = {
  title: "ملف التنفيذ رقم 11831/2025",
  status: "تنفيذ نشط",
  progress: 65,
  lastAction: "25 مارس 2026",
  secondary: "المكتب يتابع الإجراءات التنفيذية وفق التسلسل الإجرائي المحدث",
  amountUnderEnforcement: "120,000",
  amountRecovered: "35,000",
  remainingBalance: "85,000",
};

const timelineSteps = [
  { title: "إعلان المنفذ ضده", note: "تم إعلان المنفذ ضده بالإجراءات التنفيذية", done: true },
  { title: "تقديم طلب الحجز على الحسابات", note: "تم تقديم الطلب لدى الجهة المختصة", done: true },
  { title: "قيد اعتراض المنفذ ضده", note: "الاعتراض مقيد وجارٍ عرضه", done: true },
  { title: "انتظار قرار المحكمة", note: "الملف بانتظار القرار التالي", done: false },
  { title: "الانتقال إلى الإجراء التالي", note: "", done: false },
];

const attachments = [
  { type: "الحجز على الحساب البنكي", entity: "البنك التجاري", status: "قيد المراجعة", statusVariant: "pending" },
  { type: "الحجز لدى الغير", entity: "جهة خارجية", status: "مقدم", statusVariant: "active" },
  { type: "الاستعلام عن الأصول", entity: "", status: "مقدم", statusVariant: "active" },
];

const objections = [
  { title: "اعتراض المنفذ ضده على الحجز", date: "10 مارس 2026", status: "قيد الدراسة", statusVariant: "pending" },
];

export default function Matters() {
  const [activeTab, setActiveTab] = useState("execution");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: "#F7F8FA" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white">
        <h1 className="text-2xl font-bold" style={{ color: "#101828" }}>الملفات والقضايا</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>ملفاتك القانونية النشطة</p>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Execution Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 shadow-card border"
          style={{ borderColor: "#E7ECF3", backgroundColor: "#F8FBFF" }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: "#101828" }}>{executionData.title}</h2>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                آخر تحديث قضائي: {executionData.lastAction}
              </p>
            </div>
            <StatusChip label={executionData.status} variant="active" />
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: "#0D2F5F" }}>نسبة الإنجاز</span>
              <span className="text-xs font-bold" style={{ color: "#123E7C" }}>{executionData.progress}٪</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E8EEF8" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${executionData.progress}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: "#123E7C" }}
              />
            </div>
          </div>

          <p className="text-xs mt-3" style={{ color: "#6B7280" }}>{executionData.secondary}</p>
        </motion.div>

        {/* Financial Tiles */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "المبلغ محل التنفيذ", value: `${executionData.amountUnderEnforcement} ر.ق` },
            { label: "المبلغ المحصل", value: `${executionData.amountRecovered} ر.ق` },
            { label: "الرصيد المتبقي", value: `${executionData.remainingBalance} ر.ق` },
          ].map((tile, i) => (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-white rounded-2xl p-3 shadow-card border text-center"
              style={{ borderColor: "#E7ECF3" }}
            >
              <p className="text-[11px] leading-tight" style={{ color: "#6B7280" }}>{tile.label}</p>
              <p className="text-sm font-bold mt-1" style={{ color: "#0D2F5F" }}>{tile.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Court Action Timeline */}
        <div className="bg-white rounded-2xl p-4 shadow-card border" style={{ borderColor: "#E7ECF3" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#101828" }}>الخط الزمني للإجراءات</h3>
          <div className="space-y-0">
            {timelineSteps.map((step, i) => (
              <div key={i} className="flex gap-3 relative">
                {/* Line */}
                {i < timelineSteps.length - 1 && (
                  <div
                    className="absolute top-5 right-[7px] w-0.5 h-full"
                    style={{ backgroundColor: step.done ? "#123E7C" : "#E7ECF3" }}
                  />
                )}
                {/* Node */}
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 mt-1 flex-shrink-0 z-10"
                  style={{
                    backgroundColor: step.done ? "#123E7C" : "white",
                    borderColor: "#123E7C",
                  }}
                />
                <div className="pb-4 flex-1">
                  <p className={`text-sm font-semibold ${!step.done ? "opacity-50" : ""}`} style={{ color: "#101828" }}>
                    {step.title}
                  </p>
                  {step.note && (
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{step.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attachment Requests */}
        <div className="bg-white rounded-2xl p-4 shadow-card border" style={{ borderColor: "#E7ECF3" }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: "#101828" }}>طلبات الحجز</h3>
          <div className="space-y-3">
            {attachments.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#EEF2F7" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#101828" }}>{item.type}</p>
                  {item.entity && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{item.entity}</p>}
                </div>
                <StatusChip label={item.status} variant={item.statusVariant} />
              </div>
            ))}
          </div>
        </div>

        {/* Objections */}
        <div className="bg-white rounded-2xl p-4 shadow-card border" style={{ borderColor: "#E7ECF3" }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: "#101828" }}>الاعتراضات</h3>
          {objections.map((obj, i) => (
            <div key={i} className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#101828" }}>{obj.title}</p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>تاريخ التقديم: {obj.date}</p>
                <div className="mt-2">
                  <StatusChip label={obj.status} variant={obj.statusVariant} />
                </div>
              </div>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-xl mt-1" style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}>
                فتح التفاصيل
              </button>
            </div>
          ))}
        </div>

        {/* Next Recommended Action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-4 border"
          style={{ backgroundColor: "#F3F7FD", borderColor: "#D4E4F7" }}
        >
          <h3 className="text-sm font-bold mb-2" style={{ color: "#0D2F5F" }}>الإجراء الموصى به</h3>
          <p className="text-sm leading-relaxed" style={{ color: "#101828" }}>
            بانتظار قرار المحكمة الإجراء الموصى به بشأن طلب الحجز. يمكنكم الاطلاع على المستندات الداعمة ومراسلة فريق التنفيذ مباشرة من هذه الصفحة
          </p>
          <div className="flex gap-2 mt-3">
            <button
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#123E7C", color: "white" }}
              onClick={() => navigate("/vault")}
            >
              عرض المستندات
            </button>
            <button
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "#123E7C", color: "#123E7C", backgroundColor: "white" }}
              onClick={() => navigate("/messages")}
            >
              مراسلة فريق التنفيذ
            </button>
          </div>
        </motion.div>

        {/* Legal Team Card */}
        <div className="bg-white rounded-2xl p-4 shadow-card border" style={{ borderColor: "#E7ECF3" }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: "#101828" }}>فريق العمل القانوني</h3>
          <div className="flex items-center gap-3">
            <GlassIcon icon={User} index={0} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#101828" }}>الدكتور أحمد زايد</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>متخصص في التحكيم والتنفيذ</p>
            </div>
            <button
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: "#EAF2FF", color: "#123E7C" }}
              onClick={() => navigate("/messages")}
            >
              مراسلة
            </button>
          </div>
        </div>

        {/* Next Required Action Card */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: "#EAF2FF", borderColor: "#C5D9F5" }}>
          <p className="text-sm font-bold" style={{ color: "#0D2F5F" }}>
            يرجى رفع التفويض قبل 30 مارس 2026
          </p>
          <button
            className="mt-2 text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ backgroundColor: "#123E7C", color: "white" }}
            onClick={() => navigate("/vault")}
          >
            رفع الآن
          </button>
        </div>
      </div>
    </div>
  );
}