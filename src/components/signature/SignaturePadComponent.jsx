import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';

const PRIMARY = '#123E7C';
const TEXT = '#101828';
const TEXT_SEC = '#6B7280';

export default function SignaturePadComponent({ onSignatureCapture, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left || e.touches?.[0]?.clientX - rect.left;
    const y = e.clientY - rect.top || e.touches?.[0]?.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left || e.touches?.[0]?.clientX - rect.left;
    const y = e.clientY - rect.top || e.touches?.[0]?.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = PRIMARY;
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onSignatureCapture(signatureData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-5 border space-y-4"
      style={{ borderColor: '#E7ECF3' }}
    >
      <h3 className="text-base font-bold" style={{ color: TEXT }}>رسم التوقيع</h3>
      
      <div className="border-2 border-dashed rounded-xl overflow-hidden" style={{ borderColor: '#D4E4F7' }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={150}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full bg-white cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>

      <p className="text-xs text-center" style={{ color: TEXT_SEC }}>
        وقّع هنا بالماوس أو بإصبعك
      </p>

      <div className="flex gap-2">
        <button
          onClick={clearSignature}
          disabled={isEmpty}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border disabled:opacity-50"
          style={{ borderColor: '#E7ECF3', color: TEXT_SEC }}
        >
          <Trash2 className="w-4 h-4" />
          محو
        </button>
        <button
          onClick={handleConfirm}
          disabled={isEmpty}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: PRIMARY }}
        >
          <Check className="w-4 h-4" />
          تأكيد التوقيع
        </button>
      </div>
    </motion.div>
  );
}