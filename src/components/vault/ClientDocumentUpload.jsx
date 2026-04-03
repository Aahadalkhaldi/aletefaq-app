import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const PRIMARY = '#123E7C';
const TEXT = '#101828';
const TEXT_SEC = '#6B7280';

export default function ClientDocumentUpload({ caseId, caseTitle, onUploadSuccess }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  const categories = [
    { value: 'evidence', label: 'أدلة' },
    { value: 'correspondence', label: 'مراسلات' },
    { value: 'contract', label: 'عقود' },
    { value: 'invoice', label: 'فواتير' },
    { value: 'other', label: 'أخرى' }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setStatus(null);

    try {
      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({
        file: selectedFile
      });

      const fileUrl = uploadRes.file_url;
      const fileSize = (selectedFile.size / 1024 / 1024).toFixed(2);
      const fileType = selectedFile.type || 'application/octet-stream';

      // Create document record
      const user = await base44.auth.me();
      const clientName = user?.full_name || 'عميل';

      await base44.entities.CaseDocument.create({
        case_id: caseId,
        case_title: caseTitle,
        name: selectedFile.name,
        file_url: fileUrl,
        file_type: selectedFile.name.split('.').pop(),
        file_size: `${fileSize} MB`,
        category: category,
        description: description,
        uploaded_by: clientName,
        status: 'pending_review'
      });

      // Notify lawyer
      try {
        await base44.entities.Notification.create({
          user_id: 'admin',
          title: 'مستند جديد من العميل',
          body: `رفع ${clientName} مستند جديد: ${selectedFile.name}`,
          type: 'document_required',
          related_id: caseId,
          related_type: 'Case',
          is_read: false
        });
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

      setStatus('success');
      setSelectedFile(null);
      setDescription('');
      setCategory('other');

      setTimeout(() => {
        setStatus(null);
        onUploadSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'فشل رفع المستند');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border space-y-4"
      style={{ borderColor: '#E7ECF3' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold" style={{ color: TEXT }}>رفع مستند جديد</h3>
        {status && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1"
            style={{
              color: status === 'success' ? '#10B981' : '#F59E0B'
            }}
          >
            {status === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">تم الرفع</span>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-semibold">جارٍ الرفع</span>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* File Drop Zone */}
      <label
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer block ${
          isDragging ? 'bg-blue-50' : 'bg-gray-50'
        }`}
        style={{
          borderColor: isDragging ? PRIMARY : '#D4E4F7',
          backgroundColor: isDragging ? '#EAF2FF' : '#F9FAFB'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="space-y-2">
            <FileText
              className="w-8 h-8 mx-auto"
              style={{ color: PRIMARY }}
            />
            <p className="text-sm font-semibold" style={{ color: TEXT }}>
              {selectedFile.name}
            </p>
            <p className="text-xs" style={{ color: TEXT_SEC }}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <div className="text-xs font-semibold mt-2 px-3 py-1 rounded-lg inline-block" onClick={() => setSelectedFile(null)}
              style={{ backgroundColor: '#FDECEC', color: '#B42318', cursor: 'pointer' }}>
              حذف الملف
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: PRIMARY }} />
            <p className="text-sm font-semibold mb-1" style={{ color: TEXT }}>
              اسحب الملف أو انقر لاختيار
            </p>
            <p className="text-xs" style={{ color: TEXT_SEC }}>
              PDF, صور، أو ملفات Office
            </p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="fileInput"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            <span
              onClick={() => fileInputRef.current?.click()}
              className="inline-block mt-3 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: PRIMARY, color: 'white' }}
            >
              اختر ملف
            </span>
          </>
        )}
      </label>

      {/* Category & Description */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>
              نوع المستند
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-lg px-3 h-10 text-sm outline-none"
              style={{ borderColor: '#E7ECF3', color: TEXT }}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>
              وصف المستند (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اضف وصف قصير للمستند..."
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: '#E7ECF3', color: TEXT }}
            />
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 p-3 rounded-lg"
          style={{ backgroundColor: '#FEE2E2', borderLeft: '3px solid #DC2626' }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>
        </motion.div>
      )}

      {/* Upload Button */}
      {selectedFile && !status && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: PRIMARY }}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جارٍ الرفع...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              رفع المستند
            </>
          )}
        </motion.button>
      )}
    </motion.div>
  );
}