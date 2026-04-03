const variants = {
  active: { bg: "#EAF2FF", text: "#123E7C" },
  pending: { bg: "#FFF4E5", text: "#8A5A00" },
  closed: { bg: "#EEF2F7", text: "#526071" },
  urgent: { bg: "#FDECEC", text: "#B42318" },
};

export default function StatusChip({ label, variant = "active" }) {
  const style = variants[variant] || variants.active;
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {label}
    </span>
  );
}