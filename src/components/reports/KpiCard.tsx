interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
}

export default function KpiCard({ label, value, sublabel }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
      {sublabel && <div className="mt-0.5 text-xs text-neutral-500">{sublabel}</div>}
    </div>
  );
}
