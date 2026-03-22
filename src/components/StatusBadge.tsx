import { TaskStatus, ProjectStatus } from "@/lib/types/database";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
  completed: "bg-primary/10 text-primary ring-primary/20",
  archived: "bg-muted text-muted-foreground ring-border",
  pending: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-700 ring-blue-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  completed: "Termine",
  archived: "Archive",
  pending: "En attente",
  in_progress: "En cours",
};

interface StatusBadgeProps {
  status: TaskStatus | ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.pending} ${className}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
