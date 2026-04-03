import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowRight, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import SignaturePadComponent from './SignaturePadComponent';

const PRIMARY = '#123E7C';
const TEXT = '#101828';
const TEXT_SEC = '#6B7280';

export default function ClientSigningViewNew({ request, onSigned, onBack }) {
  const [step, setStep] = useState('review'); // review | sign | confirm | done
  const [signature, setSignature] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSignatureCapture = (signatureData) => {
    setSignature(signatureData);
    setStep('confirm');
  };

  const handleConfirmSign = async () => {
    setSaving(true);
    setError('');

    try {
      // Upload signature image
      const blob = dataURLtoBlob(signature);
      const formData = new FormData();
      formData.append('file', blob, 'signature.png');

      const signatureUploadRes = await base44.integrations.Core.UploadFile({
        file: blob
      });

      const signatureUrl = signatureUploadRes.file_url;

      // Create signed document (in real app, merge signature with PDF)
      // For now, we'll save the signature URL as proof
      await base44.entities.SignatureRequest.update(request.id, {
        status: 'signed',
        signature_url: signatureUrl,
        signed_document_url: request.document_url, // Should be merged PDF in production
        signed_at: new Date().toISOString()
      });

      // Notify lawyer
      await base44.entities.Notification.create({
        user_id: 'admin', // In real app, get lawyer's ID
        title: 'تم توقيع مستند',
        body: `وقّع ${request.client_name} على المستند: ${request.document_name}`,
        type: 'document_signed',
        related_id: request.id,
        related_type: 'SignatureRequest'
      });

      setStep('done');
      setTimeout(() => onSigned(), 2000);
    } catch (err) {
      console.error('Error signing document:', err);
      setError('فشل عملية التوقيع. يرجى المحاولة مجددًا');
      setSaving(false);
    }
  };

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return (
    <div className="min-h-screen pb-8" style={{ background: 'linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b" style={{ borderColor: '#EEF2F7' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold mb-4"
          style={{ color: PRIMARY }}
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </button>
        <h1 className="text-xl font-bold" style={{ color: TEXT }}>التوقيع الإلكتروني</h1>
        <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>وقّع على المستند بشكل آمن</p>
      </div>

      <div className="px-5 pt-5 max-w-2xl mx-auto space-y-4">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2">
          {[
            { key: 'review', label: 'المراجعة' },
            { key: 'sign', label: 'التوقيع' },
            { key: 'confirm', label: 'التأكيد' },
            { key: 'done', label: 'تم' }
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: ['review', 'sign', 'confirm', 'done'].indexOf(step) >= i ? PRIMARY : '#E7ECF3',
                  color: ['review', 'sign', 'confirm', 'done'].indexOf(step) >= i ? 'white' : TEXT_SEC
                }}
              >
                {i + 1}
              </div>
              {i < arr.length - 1 && (
                <div
                  className="h-1 flex-1"
                  style={{
                    backgroundColor: ['review', 'sign', 'confirm', 'done'].indexOf(step) > i ? PRIMARY : '#E7ECF3'
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Document Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border"
          style={{ borderColor: '#E7ECF3' }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EAF2FF' }}>
              <FileText className="w-6 h-6" style={{ color: PRIMARY }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold" style={{ color: TEXT }}>{request.document_name}</h2>
              <p className="text-sm mt-1" style={{ color: TEXT_SEC }}>{request.case_title}</p>
              {request.notes && (
                <p className="text-xs mt-2 p-2 rounded-lg" style={{ color: TEXT_SEC, backgroundColor: '#F3F7FD' }}>
                  ملاحظات: {request.notes}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#E7ECF3' }}>
                <h3 className="text-base font-bold mb-3" style={{ color: TEXT }}>معلومات المستند</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between pb-2 border-b" style={{ borderColor: '#F2F4F7' }}>
                    <span style={{ color: TEXT_SEC }}>اسم المستند:</span>
                    <span style={{ color: TEXT }} className="font-semibold">{request.document_name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b" style={{ borderColor: '#F2F4F7' }}>
                    <span style={{ color: TEXT_SEC }}>القضية:</span>
                    <span style={{ color: TEXT }} className="font-semibold">{request.case_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: TEXT_SEC }}>طاريخ الطلب:</span>
                    <span style={{ color: TEXT }} className="font-semibold">
                      {new Date(request.created_date).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border rounded-2xl p-4" style={{ borderColor: '#D4E4F7' }}>
                <p className="text-sm" style={{ color: PRIMARY }}>
                  اضغط على "ابدأ التوقيع" لتوقيع المستند بشكل إلكتروني وآمن.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('sign')}
                className="w-full py-3 rounded-xl text-white font-semibold"
                style={{ backgroundColor: PRIMARY }}
              >
                ابدأ التوقيع
              </motion.button>
            </motion.div>
          )}

          {step === 'sign' && (
            <motion.div
              key="sign"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <SignaturePadComponent
                onSignatureCapture={handleSignatureCapture}
                onCancel={() => setStep('review')}
              />
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#E7ECF3' }}>
                <h3 className="text-base font-bold mb-4" style={{ color: TEXT }}>مراجعة التوقيع</h3>
                {signature && (
                  <div className="bg-gray-100 rounded-xl p-4 mb-4">
                    <img src={signature} alt="توقيعك" className="w-full h-auto" />
                  </div>
                )}
                <p className="text-sm mb-4" style={{ color: TEXT_SEC }}>
                  يرجى التأكد من التوقيع قبل المتابعة. بعد الموافقة، سيتم حفظ التوقيع بشكل دائم.
                </p>
              </div>

              {error && (
                <div className="flex gap-2 p-3 rounded-lg" style={{ backgroundColor: '#FEE2E2', borderLeft: '3px solid #DC2626' }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#DC2626' }} />
                  <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('sign')}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-semibold border"
                  style={{ borderColor: '#E7ECF3', color: TEXT_SEC }}
                >
                  تعديل التوقيع
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmSign}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جارٍ الحفظ...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      تأكيد وحفظ
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 bg-white rounded-2xl border"
              style={{ borderColor: '#E7ECF3' }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F0FFF4' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#10B981' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: TEXT }}>تم التوقيع بنجاح!</h3>
              <p className="text-sm mb-6" style={{ color: TEXT_SEC }}>
                تم حفظ توقيعك بشكل آمن وسيتم إخطار المحامي فوراً
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="px-6 py-2.5 rounded-xl text-white font-semibold"
                style={{ backgroundColor: PRIMARY }}
              >
                العودة
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}