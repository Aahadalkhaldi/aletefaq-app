import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPullDist(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDist >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDist(THRESHOLD);
      await onRefresh?.();
      setRefreshing(false);
    }
    setPullDist(0);
    startY.current = null;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative flex-1 overflow-y-auto h-full"
      style={{ overscrollBehavior: "none" }}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDist > 10 || refreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
            style={{ height: refreshing ? THRESHOLD : pullDist }}
          >
            <motion.div
              animate={{ rotate: refreshing ? 360 : (pullDist / THRESHOLD) * 360 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : {}}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "#EAF2FF",
                opacity: Math.min(pullDist / THRESHOLD, 1),
              }}
            >
              <RefreshCw className="w-4 h-4" style={{ color: "#123E7C" }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: refreshing ? THRESHOLD : pullDist > 0 ? pullDist : 0 }}
        transition={pullDist === 0 ? { type: "spring", damping: 20 } : { duration: 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}