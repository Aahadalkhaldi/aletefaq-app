import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bell, Scale, CalendarDays, CheckSquare, Landmark,
  FileText, MessageSquare, FileWarning, ClipboardList,
  UserPlus, Megaphone, Timer, Plus, PenLine
} from "lucide-react";
import { Notification } from '@/api/entities';

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";

const actions = [
  {
    key: "reminder",
    label: "تذكير",
    desc: "إضافة تذكير عام",
    icon: Bell,
    color: "#7C3AED",
    bg: "#F3F0FF",
  },
  {
    key: "case",
    label: "دعوى جديدة",
    desc: "إضافة دعوى جديدة",
    icon: Scale,
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    key: "meeting",
    label: "اجتماع",
    desc: "إضافة اجتماع عام",
    icon: CalendarDays,
    color: "#0891B2",
    bg: "#ECFEFF",
  },
  {
    key: "task",
    label: "مُهمة يومية",
    desc: "إضافة مُهمة يومية",
    icon: CheckSquare,
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    key: "service",
    label: "خدمة جديدة",
    desc: "إضافة خدمة لموكل",
    icon: Landmark,
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    key: "request",
    label: "طلب جديد",
    desc: "تقديم طلب داخلي",
    icon: FileText,
    color: "#EA580C",
    bg: "#FFF7ED",
  },
  {
    key: "consultation",
    label: "استشارة",
    desc: "إضافة استشارة جديدة",
    icon: MessageSquare,
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    key: "complaint",
    label: "شكوى جديدة",
    desc: "إضافة شكوى جديدة",
    icon: FileWarning,
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  {
    key: "template",
    label: "نموذج جديد",
    desc: "نموذج تلقائي جديد",
    icon: ClipboardList,
    color: "#0369A1",
    bg: "#F0F9FF",
  },
  {
    key: "client",
    label: "موكل",
    desc: "إضافة موكل جديد",
    icon: UserPlus,
    color: "#166534",
    bg: "#F0FFF4",
  },
  {
    key: "announcement",
    label: "إعلان إداري",
    desc: "إعلان لجميع المستخدمين",
    icon: Megaphone,
    color: "#9333EA",
    bg: "#FAF5FF",
  },
  {
    key: "timer",
    label: "موقت العمل",
    desc: "بدء موقت العمل على الدعوى",
    icon: Timer,
    color: "#0D9488",
    bg: "#F0FDFA",
  },
  {
    key: "signature",
    label: "طلب توقيع",
    desc: "إرسال مستند للموكل للتوقيع",
    icon: PenLine,
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
];

// ─── Mini forms per action ────────────────────────────────────────────────────

function ReminderForm({ onClose }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await Notification.create({
      user_id: "general",
      title,
      body: date ? `موعد: ${date}` : "تذكير عام",
      type: "system",
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-3">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان التذكير"
        className="w-full rounded-xl border px-4 py-3 text-sm text-right outline-none"
        style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA", color: TEXT }} />
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 text-sm text-right outline-none"
        style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA", color: TEXT }} />
      <button onClick={save} disabled={saving || !title.trim()}
        className="w-full py-3 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: saving || !title.trim() ? "#9CA3AF" : PRIMARY }}>
        {saving ? "جارٍ الحفظ..." : "حفظ التذكير"}
      </button>
    </div>
  );
}

function CaseForm({ onClose }) {
  const navigate = useNavigate();
  const go = () => { navigate("/cases"); onClose(); };
  return (
    <div className="text-center py-6">
      <p className="text-sm mb-4" style={{ color: TEXT_SEC }}>سيتم توجيهك لصفحة إضافة دعوى جديدة</p>
      <button onClick={go} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: PRIMARY }}>
        الانتقال لإضافة دعوى
      </button>
    </div>
  );
}

function MeetingForm({ onClose }) {
  const navigate = useNavigate();
  const go = () => { navigate("/meetings"); onClose(); };
  return (
    <div className="text-center py-6">
      <p className="text-sm mb-4" style={{ color: TEXT_SEC }}>سيتم توجيهك لصفحة الاجتماعات</p>
      <button onClick={go} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: PRIMARY }}>
        الانتقال للاجتماعات
      </button>
    </div>
  );
}

function ClientForm({ onClose }) {
  const navigate = useNavigate();
  const go = () => { navigate("/clients"); onClose(); };
  return (
    <div className="text-center py-6">
      <p className="text-sm mb-4" style={{ color: TEXT_SEC }}>سيتم توجيهك لصفحة الموكلين</p>
      <button onClick={go} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: PRIMARY }}>
        الانتقال للموكلين
      </button>
    </div>
  );
}

function SimpleNoteForm({ label, entity, fields, onClose }) {
  const [vals, setVals] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const required = fields.find(f => f.required && !vals[f.key]?.trim());
    if (required) return;
    setSaving(true);
    await base44.entities[entity].create(vals).catch(() => {});
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-3">
      {fields.map(f => (
        f.multiline
          ? <textarea key={f.key} value={vals[f.key] || ""} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder} rows={3}
              className="w-full rounded-xl border px-4 py-3 text-sm text-right outline-none resize-none"
              style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA", color: TEXT }} />
          : <input key={f.key} value={vals[f.key] || ""} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-xl border px-4 py-3 text-sm text-right outline-none"
              style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA", color: TEXT }} />
      ))}
      <button onClick={save} disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: saving ? "#9CA3AF" : PRIMARY }}>
        {saving ? "جارٍ الحفظ..." : `حفظ ${label}`}
      </button>
    </div>
  );
}

function AnnouncementForm({ onClose }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await Notification.create({
      user_id: "all",
      title,
      body: body || title,
      type: "system",
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-3">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الإعلان"
        className="w-full rounded-xl border px-4 py-3 text-sm text-right outline-none"
        style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA", color: TEXT }} />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="نص الإعلان" rows={3}
        className="w-full rounded-xl border px-4 py-3 text-sm text-right outline-none resize-none"
        style={{ borderColor: "#E7ECF3", backgroundColor: "#F7F8FA", color: TEXT }} />
      <button onClick={save} disabled={saving || !title.trim()}
        className="w-full py-3 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: saving || !title.trim() ? "#9CA3AF" : PRIMARY }}>
        {saving ? "جارٍ الإرسال..." : "إرسال الإعلان"}
      </button>
    </div>
  );
}

function SignatureRedirect({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="text-center py-6">
      <p className="text-sm mb-4" style={{ color: TEXT_SEC }}>سيتم توجيهك لصفحة التوقيعات الإلكترونية</p>
      <button onClick={() => { navigate("/signature-requests"); onClose(); }}
        className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: PRIMARY }}>
        الانتقال للتوقيعات
      </button>
    </div>
  );
}

function getForm(key, onClose) {
  switch (key) {
    case "reminder":     return <ReminderForm onClose={onClose} />;
    case "case":         return <CaseForm onClose={onClose} />;
    case "meeting":      return <MeetingForm onClose={onClose} />;
    case "client":       return <ClientForm onClose={onClose} />;
    case "announcement": return <AnnouncementForm onClose={onClose} />;
    case "task":
      return <SimpleNoteForm label="المهمة" entity="CaseTask" onClose={onClose} fields={[
        { key: "title", placeholder: "عنوان المهمة", required: true },
        { key: "notes", placeholder: "ملاحظات (اختياري)", multiline: true },
      ]} />;
    case "service":
      return <SimpleNoteForm label="الخدمة" entity="ServiceRequest" onClose={onClose} fields={[
        { key: "title", placeholder: "عنوان الخدمة", required: true },
        { key: "client_name", placeholder: "اسم الموكل", required: true },
        { key: "description", placeholder: "تفاصيل (اختياري)", multiline: true },
      ]} />;
    case "request":
      return <SimpleNoteForm label="الطلب" entity="ServiceRequest" onClose={onClose} fields={[
        { key: "title", placeholder: "عنوان الطلب", required: true },
        { key: "description", placeholder: "تفاصيل الطلب", multiline: true },
      ]} />;
    case "consultation":
      return <SimpleNoteForm label="الاستشارة" entity="ServiceRequest" onClose={onClose} fields={[
        { key: "title", placeholder: "موضوع الاستشارة", required: true },
        { key: "client_name", placeholder: "اسم الموكل", required: true },
        { key: "description", placeholder: "تفاصيل (اختياري)", multiline: true },
      ]} />;
    case "complaint":
      return <SimpleNoteForm label="الشكوى" entity="ServiceRequest" onClose={onClose} fields={[
        { key: "title", placeholder: "موضوع الشكوى", required: true },
        { key: "client_name", placeholder: "اسم الموكل", required: true },
        { key: "description", placeholder: "تفاصيل الشكوى", multiline: true },
      ]} />;
    case "template":
      return <SimpleNoteForm label="النموذج" entity="CaseDocument" onClose={onClose} fields={[
        { key: "name", placeholder: "اسم النموذج", required: true },
        { key: "description", placeholder: "وصف النموذج", multiline: true },
      ]} />;
    case "timer":
      return (
        <div className="text-center py-6">
          <p className="text-3xl font-bold mb-4" style={{ color: PRIMARY }}>00:00:00</p>
          <p className="text-sm mb-4" style={{ color: TEXT_SEC }}>موقت العمل على الدعوى (قيد التطوير)</p>
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: PRIMARY }}>
            إغلاق
          </button>
        </div>
      );
    case "signature":
      return <SignatureRedirect onClose={onClose} />;
    default:
      return (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: TEXT_SEC }}>هذه الميزة قيد التطوير</p>
          <button onClick={onClose} className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#EAF2FF", color: PRIMARY }}>
            إغلاق
          </button>
        </div>
      );
  }
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────

export default function QuickAddSheet() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const close = () => { setOpen(false); setSelected(null); };
  const selectAction = (key) => setSelected(key);
  const back = () => setSelected(null);

  const activeAction = actions.find(a => a.key === selected);

  return (
    <>
      {/* FAB / trigger button in header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
        style={{
          background: "linear-gradient(135deg, #123E7C, #1E4E95)",
          color: "white",
          boxShadow: "0 4px 12px rgba(18,62,124,0.3)",
        }}
      >
        <Plus className="w-4 h-4" />
        <span>إضافة</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
              onClick={close}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 z-50 bg-white rounded-t-3xl"
              style={{ bottom: "72px", maxHeight: "calc(85vh - 72px)", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}
            >
              {/* Handle */}
              <div className="sticky top-0 bg-white pt-3 pb-2 px-5 z-10 rounded-t-3xl">
                <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: "#E7ECF3" }} />
                <div className="flex items-center justify-between">
                  <button onClick={selected ? back : close}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#F2F4F7" }}>
                    {selected
                      ? <span className="text-xs font-bold" style={{ color: TEXT_SEC }}>←</span>
                      : <X className="w-4 h-4" style={{ color: TEXT_SEC }} />}
                  </button>
                  <h2 className="text-base font-bold" style={{ color: TEXT }}>
                    {selected ? activeAction?.label : "إضافة سريعة"}
                  </h2>
                  <div className="w-8" />
                </div>
                <div className="h-px mt-3" style={{ backgroundColor: "#EEF2F7" }} />
              </div>

              <div className="px-5 pb-10 pt-3">
                {/* Action List */}
                {!selected && (
                  <div className="space-y-2">
                    {actions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={action.key}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => selectAction(action.key)}
                          className="w-full flex items-center gap-4 p-3.5 rounded-2xl border text-right"
                          style={{ borderColor: "#EEF2F7", backgroundColor: "#FAFAFA" }}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: action.bg }}>
                            <Icon className="w-5 h-5" style={{ color: action.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold" style={{ color: TEXT }}>{action.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{action.desc}</p>
                          </div>
                          <span className="text-lg" style={{ color: "#D1D5DB" }}>‹</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Mini Form */}
                {selected && (
                  <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                    {/* Action header */}
                    {activeAction && (
                      <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl"
                        style={{ backgroundColor: activeAction.bg }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: activeAction.bg, border: `1.5px solid ${activeAction.color}20` }}>
                          <activeAction.icon className="w-5 h-5" style={{ color: activeAction.color }} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: activeAction.color }}>{activeAction.label}</p>
                          <p className="text-xs" style={{ color: TEXT_SEC }}>{activeAction.desc}</p>
                        </div>
                      </div>
                    )}
                    {getForm(selected, close)}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}