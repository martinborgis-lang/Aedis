import { TaskStatus } from "@/lib/types/database";

const BAR_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
};

interface ProgressBarProps {
  progress: number;
  status?: TaskStatus;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ progress, status, showLabel = true, className = "" }: ProgressBarProps) {
  const barColor = status ? (BAR_COLORS[status] || "bg-muted-foreground") : "bg-primary";

  return (
    <div className={className}>
      <div className="h-1.5 rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-1 inline-block">{progress}%</span>
      )}
    </div>
  );
}
