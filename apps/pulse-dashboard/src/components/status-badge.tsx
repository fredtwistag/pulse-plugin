import { cn } from "@/lib/cn";

const STATUS_STYLES: Record<string, string> = {
  draft:
    "bg-[var(--color-canvas-subtle)] text-[var(--color-muted)] border-[var(--color-border)]",
  proposed:
    "bg-[var(--color-canvas-subtle)] text-[var(--color-muted)] border-[var(--color-border)]",
  active:
    "bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)] border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]",
  accepted:
    "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]",
  shipped:
    "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]",
  superseded:
    "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]",
  archived:
    "bg-[var(--color-canvas-subtle)] text-[var(--color-muted)] border-[var(--color-border)]",
};

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles,
      )}
    >
      {status}
    </span>
  );
}
