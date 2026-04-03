const gradients = [
  "linear-gradient(145deg, #7C3AED, #4F46E5)",
  "linear-gradient(145deg, #EC4899, #8B5CF6)",
  "linear-gradient(145deg, #3B82F6, #06B6D4)",
  "linear-gradient(145deg, #10B981, #3B82F6)",
  "linear-gradient(145deg, #F59E0B, #EF4444)",
  "linear-gradient(145deg, #8B5CF6, #EC4899)",
  "linear-gradient(145deg, #0EA5E9, #6366F1)",
  "linear-gradient(145deg, #14B8A6, #0EA5E9)",
];

export default function GlassIcon({ icon: Icon, index = 0, size = "md", gradient }) {
  const bg = gradient || gradients[index % gradients.length];
  const sz = size === "sm" ? "w-9 h-9" : size === "lg" ? "w-14 h-14" : "w-11 h-11";
  const iconSz = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <div
      className={`${sz} rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0`}
      style={{
        background: bg,
        boxShadow: "0 8px 20px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.1)",
      }}
    >
      {/* shine */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)" }}
      />
      {/* depth */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-2xl"
        style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 100%)" }}
      />
      <Icon className={`${iconSz} relative z-10`} style={{ color: "white", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }} />
    </div>
  );
}