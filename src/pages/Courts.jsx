import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronLeft } from "lucide-react";

export const QATAR_COURTS = [
  {
    id: "sad-criminal",
    name_ar: "محكمة السد الجنائية",
    subtitle: "ابتدائي",
    icon: "⚖️",
    color: "#FEF2F2",
    accent: "#B42318",
    description: "تختص بالنظر في القضايا الجنائية ابتداءً",
    requests: [
      { id: "r1", title: "طلب تأجيل جلسة جنائية", description: "طلب تأجيل موعد الجلسة لأسباب موضوعية", docs: ["التوكيل الرسمي", "صورة الهوية", "بيان سبب التأجيل"] },
      { id: "r2", title: "طلب الإفراج بكفالة", description: "طلب إخلاء سبيل الموكل بكفالة مالية أو شخصية", docs: ["التوكيل الرسمي", "صورة الهوية", "مستندات الكفالة"] },
      { id: "r3", title: "طلب ضم ملفات", description: "طلب ضم ملفات القضايا المترابطة", docs: ["التوكيل الرسمي", "أرقام القضايا المراد ضمها"] },
      { id: "r4", title: "طلب استلام نسخة الحكم", description: "الحصول على نسخة رسمية من الحكم الجنائي", docs: ["التوكيل الرسمي", "رقم القضية"] },
      { id: "r5", title: "طلب وقف التنفيذ", description: "طلب وقف تنفيذ العقوبة مؤقتاً", docs: ["التوكيل الرسمي", "نسخة الحكم", "مسوّغات الوقف"] },
    ],
    fees: "50 - 300 ريال",
    duration: "3 - 10 أيام عمل",
  },
  {
    id: "sad-civil-appeal",
    name_ar: "محكمة السد المدنية",
    subtitle: "ابتدائي واستئناف",
    icon: "🏛️",
    color: "#EAF2FF",
    accent: "#123E7C",
    description: "تختص بالقضايا المدنية ابتداءً واستئنافاً",
    requests: [
      { id: "r1", title: "طلب إصدار أمر أداء", description: "إلزام المدين بالسداد بدون محاكمة", docs: ["التوكيل الرسمي", "المستندات الدالة على الدين", "صورة الهوية"] },
      { id: "r2", title: "طعن بالاستئناف", description: "الطعن في حكم المحكمة الابتدائية المدنية", docs: ["نسخة الحكم المطعون فيه", "صحيفة الاستئناف", "التوكيل الرسمي"] },
      { id: "r3", title: "طلب تأجيل الجلسة", description: "طلب تأجيل الجلسة لأسباب موضوعية", docs: ["التوكيل الرسمي", "بيان سبب التأجيل"] },
      { id: "r4", title: "طلب تنفيذ حكم", description: "تنفيذ الأحكام المدنية النهائية", docs: ["نسخة الحكم النهائي", "التوكيل الرسمي"] },
      { id: "r5", title: "طلب وقف تنفيذ الحكم المستأنف", description: "طلب مؤقت لحين البت في الاستئناف", docs: ["التوكيل الرسمي", "نسخة الحكم", "كفالة إن لزم"] },
    ],
    fees: "100 - 1000 ريال",
    duration: "7 - 30 يوم عمل",
  },
  {
    id: "family-sad",
    name_ar: "محكمة الأسرة للسد",
    subtitle: "شؤون الأسرة",
    icon: "🏠",
    color: "#FFF0F5",
    accent: "#9D174D",
    description: "تختص بقضايا الأحوال الشخصية والطلاق والحضانة",
    requests: [
      { id: "r1", title: "طلب طلاق", description: "رفع دعوى طلاق أمام محكمة الأسرة", docs: ["عقد الزواج", "صور الهويات", "التوكيل الرسمي"] },
      { id: "r2", title: "طلب حضانة", description: "المطالبة بحضانة الأطفال", docs: ["عقد الزواج", "شهادات ميلاد الأطفال", "التوكيل الرسمي", "بيان الدخل"] },
      { id: "r3", title: "طلب نفقة", description: "المطالبة بالنفقة الزوجية أو نفقة الأطفال", docs: ["عقد الزواج", "إثبات الدخل", "التوكيل الرسمي"] },
      { id: "r4", title: "طلب زيارة أطفال", description: "تحديد مواعيد رؤية الأطفال", docs: ["التوكيل الرسمي", "وثيقة حكم الحضانة"] },
      { id: "r5", title: "طلب ميراث", description: "المطالبة بحق الميراث الشرعي", docs: ["شهادة الوفاة", "وثائق الملكية", "التوكيل الرسمي"] },
      { id: "r6", title: "طلب تأجيل جلسة", description: "تأجيل جلسة الأسرة لأسباب موضوعية", docs: ["التوكيل الرسمي", "بيان السبب"] },
    ],
    fees: "100 - 500 ريال",
    duration: "14 - 60 يوم",
  },
  {
    id: "notary-family",
    name_ar: "التوثيقات الأسرية (الحزم)",
    subtitle: "توثيق وثائق",
    icon: "📋",
    color: "#F5F3FF",
    accent: "#6D28D9",
    description: "توثيق عقود الزواج والطلاق والتبرعات والوصايا",
    requests: [
      { id: "r1", title: "توثيق عقد زواج", description: "توثيق عقد الزواج رسمياً", docs: ["هوية الطرفين", "شهادة الأهل", "التوكيل إن لزم"] },
      { id: "r2", title: "توثيق عقد طلاق", description: "توثيق وثيقة الطلاق", docs: ["عقد الزواج الأصلي", "هوية الطرفين", "التوكيل الرسمي"] },
      { id: "r3", title: "توثيق وصية", description: "توثيق الوصية القانونية رسمياً", docs: ["صورة الهوية", "مسودة الوصية", "شهود"] },
      { id: "r4", title: "توثيق تبرع", description: "توثيق عقد التبرع بالأملاك", docs: ["صور الهويات", "سند الملكية", "التوكيل الرسمي"] },
      { id: "r5", title: "استخراج نسخة توثيق", description: "الحصول على نسخة رسمية من وثيقة مُوثّقة", docs: ["رقم الوثيقة الأصلية", "التوكيل الرسمي", "صورة الهوية"] },
    ],
    fees: "50 - 400 ريال",
    duration: "1 - 7 أيام",
  },
  {
    id: "civil-dafna",
    name_ar: "المحاكم المدنية الدفنة",
    subtitle: "ابتدائي واستئناف",
    icon: "🏢",
    color: "#ECFDF5",
    accent: "#065F46",
    description: "تختص بالمنازعات المدنية والتجارية في منطقة الدفنة",
    requests: [
      { id: "r1", title: "طلب إصدار أمر أداء", description: "إلزام المدين بالسداد دون محاكمة", docs: ["التوكيل الرسمي", "المستندات الدالة على الدين", "صورة الهوية"] },
      { id: "r2", title: "رفع دعوى مدنية", description: "تقديم دعوى مدنية جديدة", docs: ["صحيفة الدعوى", "التوكيل الرسمي", "المستندات الداعمة"] },
      { id: "r3", title: "طعن بالاستئناف المدني", description: "الطعن في أحكام المحكمة الابتدائية", docs: ["نسخة الحكم المطعون فيه", "صحيفة الاستئناف", "التوكيل الرسمي"] },
      { id: "r4", title: "طلب تأجيل جلسة", description: "تأجيل موعد الجلسة المدنية", docs: ["التوكيل الرسمي", "بيان السبب"] },
      { id: "r5", title: "طلب تنفيذ حكم مدني", description: "تنفيذ الحكم النهائي الصادر", docs: ["نسخة الحكم النهائي", "التوكيل الرسمي"] },
    ],
    fees: "100 - 1000 ريال",
    duration: "7 - 30 يوم عمل",
  },
  {
    id: "investment",
    name_ar: "محكمة الاستثمار",
    subtitle: "ابتدائي واستئناف",
    icon: "💼",
    color: "#FFF4E5",
    accent: "#8A5A00",
    description: "تختص بمنازعات الاستثمار والشركات والعقود التجارية الكبرى",
    requests: [
      { id: "r1", title: "رفع دعوى استثمارية", description: "تقديم دعوى متعلقة بمنازعة استثمارية", docs: ["عقود الاستثمار", "صحيفة الدعوى", "التوكيل الرسمي", "مستندات الشركة"] },
      { id: "r2", title: "طعن باستئناف استثماري", description: "الطعن في حكم المحكمة الابتدائية", docs: ["نسخة الحكم", "صحيفة الاستئناف", "التوكيل الرسمي"] },
      { id: "r3", title: "طلب تدابير تحفظية", description: "طلب إجراءات احتياطية عاجلة لحماية الحقوق", docs: ["التوكيل الرسمي", "مسوغات الطلب", "مستندات الضرر"] },
      { id: "r4", title: "طلب تجميد أصول", description: "طلب تجميد أصول الطرف الآخر احترازياً", docs: ["التوكيل الرسمي", "إثبات الدعوى", "تفاصيل الأصول"] },
      { id: "r5", title: "طلب تأجيل جلسة", description: "تأجيل موعد الجلسة الاستثمارية", docs: ["التوكيل الرسمي", "بيان السبب"] },
    ],
    fees: "500 - 5000 ريال",
    duration: "14 - 90 يوم",
  },
  {
    id: "labor-disputes",
    name_ar: "فض المنازعات العمالية",
    subtitle: "الصناعية",
    icon: "👷",
    color: "#FFF9E5",
    accent: "#92400E",
    description: "فض النزاعات بين أصحاب العمل والعمال في قطر",
    requests: [
      { id: "r1", title: "طلب فض نزاع عمالي", description: "تقديم طلب لحل النزاع بين صاحب العمل والعامل", docs: ["عقد العمل", "صورة الهوية / الإقامة", "التوكيل الرسمي", "بيان النزاع"] },
      { id: "r2", title: "طلب صرف مستحقات العمال", description: "المطالبة بالرواتب والمستحقات المتأخرة", docs: ["عقد العمل", "كشف الراتب", "التوكيل الرسمي"] },
      { id: "r3", title: "طلب تعويض فسخ عقد", description: "المطالبة بتعويض إنهاء العقد بشكل تعسفي", docs: ["عقد العمل", "إشعار الفسخ", "التوكيل الرسمي"] },
      { id: "r4", title: "طلب مكافأة نهاية خدمة", description: "المطالبة بمكافأة نهاية الخدمة القانونية", docs: ["عقد العمل", "شهادة الخدمة", "التوكيل الرسمي"] },
      { id: "r5", title: "طلب رفع حظر سفر عامل", description: "رفع حظر السفر المفروض على العامل بسبب نزاع عمالي", docs: ["التوكيل الرسمي", "بيان السبب", "مستند النزاع"] },
    ],
    fees: "مجاناً - 300 ريال",
    duration: "7 - 30 يوم",
  },
  {
    id: "rent-disputes",
    name_ar: "فض المنازعات الإيجارية",
    subtitle: "نجمة",
    icon: "🔑",
    color: "#F0FFF4",
    accent: "#065F46",
    description: "فض النزاعات بين المُلاك والمستأجرين في العقارات القطرية",
    requests: [
      { id: "r1", title: "طلب فسخ عقد إيجار", description: "طلب إنهاء عقد الإيجار قضائياً", docs: ["عقد الإيجار", "صور الهويات", "بيان أسباب الفسخ", "التوكيل الرسمي"] },
      { id: "r2", title: "طلب صرف مبلغ التأمين", description: "المطالبة بإعادة مبلغ التأمين الإيجاري", docs: ["عقد الإيجار", "إيصال التأمين", "التوكيل الرسمي"] },
      { id: "r3", title: "طلب إخلاء شاغل", description: "إخلاء المستأجر المخالف لشروط العقد", docs: ["عقد الإيجار", "إشعارات الإخلاء السابقة", "التوكيل الرسمي"] },
      { id: "r4", title: "طلب استرداد إيجارات متأخرة", description: "المطالبة بالإيجارات غير المسددة", docs: ["عقد الإيجار", "كشف الحساب", "التوكيل الرسمي"] },
      { id: "r5", title: "طلب تجديد عقد إيجار", description: "إلزام المالك بتجديد عقد الإيجار بنفس الشروط", docs: ["عقد الإيجار الأصلي", "التوكيل الرسمي", "إشعار التجديد"] },
    ],
    fees: "100 - 500 ريال",
    duration: "7 - 21 يوم",
  },
  {
    id: "administrative",
    name_ar: "المحاكم الإدارية",
    subtitle: "منازعات حكومية",
    icon: "🏛️",
    color: "#EEF2FF",
    accent: "#3730A3",
    description: "تختص بالمنازعات بين الأفراد والجهات الحكومية",
    requests: [
      { id: "r1", title: "طعن في قرار إداري", description: "الطعن في قرار جهة حكومية مخالف للقانون", docs: ["القرار الإداري المطعون فيه", "التوكيل الرسمي", "مسوغات الطعن"] },
      { id: "r2", title: "طلب وقف تنفيذ قرار إداري", description: "طلب مؤقت لوقف تنفيذ قرار حكومي", docs: ["التوكيل الرسمي", "القرار المطعون فيه", "إثبات الضرر الفوري"] },
      { id: "r3", title: "دعوى تعويض إداري", description: "المطالبة بتعويض عن قرار حكومي مُضرّ", docs: ["التوكيل الرسمي", "إثبات الضرر", "القرار الإداري"] },
      { id: "r4", title: "طعن في فصل تعسفي من وظيفة حكومية", description: "الطعن في قرار إنهاء الخدمة الحكومي", docs: ["قرار الفصل", "ملف الخدمة", "التوكيل الرسمي"] },
      { id: "r5", title: "طلب تأجيل جلسة إدارية", description: "تأجيل موعد الجلسة في المحكمة الإدارية", docs: ["التوكيل الرسمي", "بيان السبب"] },
    ],
    fees: "100 - 1000 ريال",
    duration: "30 - 120 يوم",
  },
];

export default function Courts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = QATAR_COURTS.filter(c =>
    !search || c.name_ar.includes(search) || c.subtitle.includes(search)
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }} dir="rtl">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <h1 className="text-2xl font-bold mb-0.5" style={{ color: "#101828" }}>المحاكم في قطر</h1>
        <p className="text-sm mb-3" style={{ color: "#6B7280" }}>اختر المحكمة لتقديم طلبك</p>
        <div className="flex items-center gap-2 px-3 h-11 rounded-xl border" style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#6B7280" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث عن محكمة..."
            className="flex-1 text-sm bg-transparent outline-none text-right"
            style={{ color: "#101828" }}
          />
        </div>
      </div>

      <div className="px-5 pt-4 grid grid-cols-2 gap-3 pb-4">
        {filtered.map((court, i) => (
          <motion.button
            key={court.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/courts/${court.id}`)}
            className="bg-white rounded-2xl p-4 border shadow-card text-right flex flex-col"
            style={{ borderColor: "#E7ECF3", minHeight: "148px" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 flex-shrink-0"
              style={{ backgroundColor: court.color }}>
              {court.icon}
            </div>
            <p className="text-sm font-bold leading-snug" style={{ color: "#101828" }}>{court.name_ar}</p>
            <p className="text-[11px] mt-0.5 font-semibold" style={{ color: court.accent }}>{court.subtitle}</p>
            <div className="flex items-center gap-1 mt-auto pt-2">
              <span className="text-xs font-semibold" style={{ color: "#123E7C" }}>
                {court.requests.length} طلبات
              </span>
              <ChevronLeft className="w-3 h-3" style={{ color: "#123E7C" }} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}