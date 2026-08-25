interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: JSX.Element;
  accent?: "brand" | "emerald" | "amber" | "slate";
}

const ACCENTS: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-700",
};

export function StatCard({ label, value, sublabel, icon, accent = "brand" }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${ACCENTS[accent]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {sublabel && <p className="truncate text-xs text-slate-400">{sublabel}</p>}
      </div>
    </div>
  );
}
