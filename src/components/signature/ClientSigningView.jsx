import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SignatureRequest } from '@/api/entities';
import { FileText, PenLine, Check, Trash2, Loader2, ChevronLeft, ZoomIn } from "lucide-react";

export default function ClientSigningView({ request, onSigned, onBack }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    initCanvas();
  }, []);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0D2F5F";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    initCanvas();
    setHasDrawing(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    setSaving(true);
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "signature.png", { type: "image/png" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await SignatureRequest.update(request.id, {
        signature_url: file_url,
        status: "signed",
        signed_at: new Date().toISOString(),
      });
      setSaving(false);
      onSigned?.();
    });
  };

  if (showPdf) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#EEF2F7" }}>
          <button onClick={() => setShowPdf(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
            <ChevronLeft className="w-4 h-4" style={{ color: "#101828" }} />
          </button>
          <p className="text-sm font-bold" style={{ color: "#101828" }}>{request.document_name}</p>
        </div>
        <iframe src={request.document_url} className="flex-1 w-full" title="PDF" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col min-h-screen"
      style={{ background: "linear-gradient(160deg, #D6E8FF 0%, #EAF2FF 30%, #F3F7FD 60%, #F7F8FA 100%)" }}
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-white flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F8FA" }}>
          <ChevronLeft className="w-4 h-4" style={{ color: "#101828" }} />
        </button>
        <div>
          <p className="text-base font-bold" style={{ color: "#101828" }}>توقيع المستند</p>
          <p className="text-xs" style={{ color: "#6B7280" }}>{request.case_title}</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Document Card */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: "#E7ECF3" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EAF2FF" }}>
              <FileText className="w-5 h-5" style={{ color: "#123E7C" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "#101828" }}>{request.document_name}</p>
              {request.notes && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{request.notes}</p>}
            </div>
          </div>
          <button
            onClick={() => setShowPdf(true)}
            className="w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold"
            style={{ borderColor: "#D4E4F7", color: "#123E7C" }}
          >
            <ZoomIn className="w-4 h-4" />
            مراجعة المستند قبل التوقيع
          </button>
        </div>

        {/* Signature Area */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E7ECF3" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#EEF2F7", backgroundColor: "#F7F8FA" }}>
            <div className="flex items-center gap-2">
              <PenLine className="w-4 h-4" style={{ color: "#123E7C" }} />
              <p className="text-sm font-bold" style={{ color: "#101828" }}>وقّع بإصبعك هنا</p>
            </div>
            {hasDrawing && (
              <button onClick={clearCanvas} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#B42318" }}>
                <Trash2 className="w-3.5 h-3.5" /> مسح
              </button>
            )}
          </div>

          <div className="p-3">
            <p className="text-xs text-center mb-2" style={{ color: "#9CA3AF" }}>المربع أدناه لتوقيعك الإلكتروني</p>
            <div
              className="rounded-xl border-2 border-dashed overflow-hidden"
              style={{ borderColor: hasDrawing ? "#123E7C" : "#D4E4F7", touchAction: "none" }}
            >
              <canvas
                ref={canvasRef}
                width={600}
                height={220}
                className="w-full"
                style={{ cursor: "crosshair", display: "block", backgroundColor: "#fff" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            {!hasDrawing && (
              <p className="text-center text-xs mt-2" style={{ color: "#C8A96B" }}>✍️ حرك إصبعك لبدء التوقيع</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving || !hasDrawing}
          className="w-full h-14 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C", boxShadow: "0 8px 24px rgba(18,62,124,0.3)" }}
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ الحفظ...</>
          ) : (
            <><Check className="w-5 h-5" /> تأكيد التوقيع وحفظ المستند</>
          )}
        </motion.button>

        <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
          بالتوقيع توافق على أن هذا التوقيع الإلكتروني ملزم قانونياً
        </p>
      </div>
    </motion.div>
  );
}