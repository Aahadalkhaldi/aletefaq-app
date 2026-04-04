import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Case, CaseDocument, Client, Invoice } from '@/api/entities';
import {
  ArrowRight, Phone, Mail, Edit2, Save, X, Loader2,
  Scale, FileText, DollarSign, AlertCircle, Check,
  MapPin, Smartphone, User, Calendar
} from "lucide-react";

const PRIMARY = "#123E7C";
const TEXT = "#101828";
const TEXT_SEC = "#6B7280";
const SUCCESS = "#10B981";

export default function ClientProfile() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      // Get client from URL or latest viewed
      const allClients = await Client.list("-created_date", 100).catch(() => []);
      const allCases = await Case.list("-updated_date", 200).catch(() => []);
      const allInvoices = await Invoice.list("-created_date", 100).catch(() => []);
      const allDocuments = await CaseDocument.list("-created_date", 100).catch(() => []);

      // Use first client or derive from cases
      let selectedClient = allClients[0];
      if (!selectedClient && allCases.length > 0) {
        selectedClient = {
          id: allCases[0].client_id || allCases[0].client_name,
          full_name: allCases[0].client_name,
          phone: "",
          email: "",
          id_number: "",
          nationality: "",
          address: "",
          notes: ""
        };
      }

      if (selectedClient) {
        setClient(selectedClient);
        setFormData({
          full_name: selectedClient.full_name || "",
          phone: selectedClient.phone || "",
          email: selectedClient.email || "",
          id_number: selectedClient.id_number || "",
          nationality: selectedClient.nationality || "",
          address: selectedClient.address || "",
          notes: selectedClient.notes || ""
        });

        // Filter data for this client
        const clientCases = allCases.filter(c => c.client_name === selectedClient.full_name);
        const clientInvoices = allInvoices.filter(i => i.client_name === selectedClient.full_name);
        const clientDocuments = allDocuments.filter(d =>
          clientCases.some(c => c.id === d.case_id)
        );

        setCases(clientCases);
        setInvoices(clientInvoices);
        setDocuments(clientDocuments);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading client data:", error);
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await Client.update(client.id, formData);
      setClient({ ...client, ...formData });
      setEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("فشل حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F3F7FD" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F3F7FD" }}>
        <div className="text-center">
          <p className="text-sm" style={{ color: TEXT_SEC }}>لم يتم العثور على موكل</p>
          <button
            onClick={() => navigate("/clients")}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            العودة للموكلين
          </button>
        </div>
      </div>
    );
  }

  const activeCases = cases.filter(c => ["in_progress", "court"].includes(c.status));
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.total_amount || i.amount || 0), 0);
  const paidAmount = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total_amount || i.amount || 0), 0);

  return (
    <div className="min-h-screen pb-8" style={{ background: "#F3F7FD" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: "#EEF2F7" }}>
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center gap-2 mb-4 text-sm font-semibold"
          style={{ color: PRIMARY }}
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </button>
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1E4E95)` }}
          >
            <span className="text-2xl font-bold text-white">
              {client.full_name?.charAt(0) || "م"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: TEXT }}>{client.full_name}</h1>
            <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>ID: {client.id}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "القضايا", value: cases.length, icon: Scale, color: PRIMARY, bg: "#EAF2FF" },
            { label: "النشطة", value: activeCases.length, icon: AlertCircle, color: "#F59E0B", bg: "#FFF4E5" },
            { label: "الفواتير", value: invoices.length, icon: DollarSign, color: SUCCESS, bg: "#F0FFF4" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-3 border text-center"
                style={{ borderColor: "#E7ECF3" }}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
                <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>{stat.label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border"
          style={{ borderColor: "#E7ECF3" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: TEXT }}>البيانات الشخصية</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: "#EAF2FF", color: PRIMARY }}
              >
                <Edit2 className="w-3 h-3" /> تحرير
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>الاسم الكامل</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full border rounded-xl px-3 h-11 text-sm outline-none"
                    style={{ borderColor: "#E7ECF3" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>الهاتف</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border rounded-xl px-3 h-11 text-sm outline-none"
                      style={{ borderColor: "#E7ECF3" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border rounded-xl px-3 h-11 text-sm outline-none"
                      style={{ borderColor: "#E7ECF3" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>رقم الهوية/الإقامة</label>
                    <input
                      type="text"
                      value={formData.id_number}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                      className="w-full border rounded-xl px-3 h-11 text-sm outline-none"
                      style={{ borderColor: "#E7ECF3" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>الجنسية</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full border rounded-xl px-3 h-11 text-sm outline-none"
                      style={{ borderColor: "#E7ECF3" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>العنوان</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border rounded-xl px-3 h-11 text-sm outline-none"
                    style={{ borderColor: "#E7ECF3" }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>ملاحظات</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none"
                    style={{ borderColor: "#E7ECF3" }}
                  />
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                  </motion.button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: "#E7ECF3", color: TEXT_SEC }}
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[
                  { icon: User, label: "الاسم", value: client.full_name },
                  { icon: Smartphone, label: "الهاتف", value: client.phone || "—" },
                  { icon: Mail, label: "البريد", value: client.email || "—" },
                  { icon: FileText, label: "الهوية", value: client.id_number || "—" },
                  { icon: MapPin, label: "العنوان", value: client.address || "—" },
                  { icon: Calendar, label: "الجنسية", value: client.nationality || "—" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 pb-3 border-b last:border-0" style={{ borderColor: "#F2F4F7" }}>
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs" style={{ color: TEXT_SEC }}>{item.label}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: TEXT }}>{item.value}</p>
                      </div>
                    </div>
                  );
                })}
                {client.notes && (
                  <div className="pt-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#F3F7FD" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: TEXT_SEC }}>ملاحظات</p>
                    <p className="text-sm" style={{ color: TEXT }}>{client.notes}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Financial Summary */}
        {invoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 border"
            style={{ borderColor: "#E7ECF3" }}
          >
            <h2 className="text-base font-bold mb-4" style={{ color: TEXT }}>الملخص المالي</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: "#F2F4F7" }}>
                <span style={{ color: TEXT_SEC }}>إجمالي الفواتير</span>
                <span className="font-bold" style={{ color: PRIMARY }}>{totalRevenue.toLocaleString()} ر.ق</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: "#F2F4F7" }}>
                <span style={{ color: TEXT_SEC }}>المبالغ المحصلة</span>
                <span className="font-bold" style={{ color: SUCCESS }}>{paidAmount.toLocaleString()} ر.ق</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: TEXT_SEC }}>المبالغ المعلقة</span>
                <span className="font-bold" style={{ color: "#F59E0B" }}>
                  {(totalRevenue - paidAmount).toLocaleString()} ر.ق
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cases Section */}
        {cases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h2 className="text-base font-bold px-2" style={{ color: TEXT }}>القضايا ({cases.length})</h2>
            {cases.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="w-full bg-white rounded-2xl p-4 border text-right"
                style={{ borderColor: "#E7ECF3" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-shrink-0">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: ["in_progress", "court"].includes(c.status) ? "#F0FFF4" : "#F2F4F7",
                        color: ["in_progress", "court"].includes(c.status) ? "#1A6E3A" : "#526071"
                      }}
                    >
                      {c.status === "in_progress" ? "قيد المتابعة" : c.status === "court" ? "أمام المحكمة" : "مغلقة"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-bold" style={{ color: TEXT }}>{c.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>
                      {c.type} • {c.court_name || "—"}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: TEXT_SEC }} />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Invoices Section */}
        {invoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <h2 className="text-base font-bold px-2" style={{ color: TEXT }}>الفواتير ({invoices.length})</h2>
            {invoices.slice(0, 5).map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-4 border"
                style={{ borderColor: "#E7ECF3" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: TEXT_SEC }}>#{inv.invoice_number}</p>
                    <p className="text-sm font-bold mt-1" style={{ color: TEXT }}>{inv.service_description || inv.case_title || "فاتورة"}</p>
                    <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>
                      الاستحقاق: {inv.due_date ? new Date(inv.due_date).toLocaleDateString("ar-SA") : "—"}
                    </p>
                  </div>
                  <div className="text-left flex-shrink-0 ml-3">
                    <p className="font-bold" style={{ color: PRIMARY }}>
                      {(inv.total_amount || inv.amount || 0).toLocaleString()} ر.ق
                    </p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full block mt-1 text-center"
                      style={{
                        backgroundColor: inv.status === "paid" ? "#F0FFF4" : "#FFF4E5",
                        color: inv.status === "paid" ? "#1A6E3A" : "#8A5A00"
                      }}
                    >
                      {inv.status === "paid" ? "مدفوعة" : "معلقة"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            {invoices.length > 5 && (
              <p className="text-xs text-center" style={{ color: TEXT_SEC }}>
                وغيرها من الفواتير...
              </p>
            )}
          </motion.div>
        )}

        {/* Documents Section */}
        {documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h2 className="text-base font-bold px-2" style={{ color: TEXT }}>المستندات ({documents.length})</h2>
            {documents.slice(0, 5).map((doc, i) => (
              <motion.a
                key={doc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl p-4 border flex items-center gap-3"
                style={{ borderColor: "#E7ECF3" }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EAF2FF" }}>
                  <FileText className="w-5 h-5" style={{ color: PRIMARY }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: TEXT }}>{doc.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{doc.category || "مستند"}</p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: TEXT_SEC }} />
              </motion.a>
            ))}
            {documents.length > 5 && (
              <p className="text-xs text-center" style={{ color: TEXT_SEC }}>
                وغيرها من المستندات...
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}