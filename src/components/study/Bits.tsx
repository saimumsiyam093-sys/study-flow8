import type { ReactNode } from "react";
import type { Subject } from "@/lib/study-store";

export function SubjectDot({ subject }: { subject?: Subject | undefined }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: subject?.color ?? "var(--color-muted-foreground)" }}
      />
      {subject?.name ?? "General"}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: "primary" | "success" | "warning";
}) {
  const toneBg =
    tone === "success"
      ? "bg-success/15 text-success"
      : tone === "warning"
        ? "bg-warning/20 text-warning"
        : "bg-primary/12 text-primary";
  return (
    <div className="card-surface card-surface-hover animate-rise p-5">
      <div className={`mb-3 grid size-10 place-items-center rounded-xl ${toneBg}`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card-surface bg-gradient-soft p-10 text-center">
      <p className="font-semibold">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}