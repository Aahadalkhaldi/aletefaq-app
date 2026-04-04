import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pen, Upload, Trash2, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Compat";

export default function SignaturePad({ onSave, onCancel, existingSignatureUrl }) {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState("draw"); // "draw" | "upload"
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();
  const lastPos = useRef(null);

  useEffect(() => {
    if (mode === "draw") {
      setTimeout(() => initCanvas(), 50);
    }
  }, [mode]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#101828";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const getPos = (e, canvas) => {
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
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    let signatureUrl = null;

    if (mode === "draw") {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        const file = new File([blob], "signature.png", { type: "image/png" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        signatureUrl = file_url;
        setSaving(false);
        onSave(signatureUrl);
      });
      return;
    }

    if (mode === "upload" && uploadedFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedFile });
      signatureUrl = file_url;
    }

    setSaving(false);
    if (signatureUrl) onSave(signatureUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border shadow-card overflow-hidden"
      style={{ borderColor: "#E7ECF3" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#EEF2F7" }}>
        <p className="text-sm font-bold" style={{ color: "#101828" }}>التوقيع الإلكتروني</p>
        <button onClick={onCancel}><X className="w-4 h-4" style={{ color: "#6B7280" }} /></button>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 p-3 border-b" style={{ borderColor: "#EEF2F7" }}>
        {[
          { key: "draw", label: "التوقيع بالإصبع", icon: Pen },
          { key: "upload", label: "رفع صورة التوقيع", icon: Upload },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              backgroundColor: mode === key ? "#123E7C" : "#F7F8FA",
              color: mode === key ? "white" : "#6B7280",
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Draw Mode */}
        {mode === "draw" && (
          <div>
            <p className="text-xs mb-2 text-center" style={{ color: "#6B7280" }}>وقّع بإصبعك في المربع أدناه</p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E7ECF3", touchAction: "none" }}>
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
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
            <button
              onClick={clearCanvas}
              className="mt-2 flex items-center gap-1 text-xs"
              style={{ color: "#B42318" }}
            >
              <Trash2 className="w-3.5 h-3.5" /> مسح التوقيع
            </button>
          </div>
        )}

        {/* Upload Mode */}
        {mode === "upload" && (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {uploadedPreview ? (
              <div>
                <img src={uploadedPreview} alt="توقيع" className="w-full h-40 object-contain rounded-xl border" style={{ borderColor: "#E7ECF3" }} />
                <button onClick={() => { setUploadedPreview(null); setUploadedFile(null); }} className="mt-2 flex items-center gap-1 text-xs" style={{ color: "#B42318" }}>
                  <Trash2 className="w-3.5 h-3.5" /> حذف الصورة
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2"
                style={{ borderColor: "#D4E4F7" }}
              >
                <Upload className="w-8 h-8" style={{ color: "#123E7C" }} />
                <p className="text-sm font-semibold" style={{ color: "#123E7C" }}>اختر صورة التوقيع</p>
                <p className="text-xs" style={{ color: "#6B7280" }}>PNG أو JPG</p>
              </button>
            )}
          </div>
        )}

        {/* Existing Signature */}
        {existingSignatureUrl && (
          <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: "#F3F7FD" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#6B7280" }}>التوقيع الحالي:</p>
            <img src={existingSignatureUrl} alt="التوقيع الحالي" className="h-16 object-contain" />
          </div>
        )}

        {/* Save Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving || (mode === "draw" && !hasDrawing) || (mode === "upload" && !uploadedFile)}
          className="w-full h-12 rounded-2xl text-white text-sm font-semibold mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#123E7C" }}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Check className="w-4 h-4" /> حفظ التوقيع</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}