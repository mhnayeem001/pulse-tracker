import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "sky" | "purple" | "emerald" | "amber" | "rose";
}

const COLOR_MAP = {
  sky: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "sky",
}: MetricCardProps) {
  const styles = COLOR_MAP[color];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg ${styles.bg} ${styles.border} border flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${styles.text}`} />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
  );
}
