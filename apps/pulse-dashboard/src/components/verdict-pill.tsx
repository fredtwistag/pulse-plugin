import { cn } from "@/lib/cn";
import type { CheckVerdict } from "@/lib/reviews";

const VERDICT_STYLES: Record<CheckVerdict, string> = {
  pass: "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]",
  warning:
    "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]",
  fail: "bg-[color-mix(in_srgb,var(--color-danger)_15%,transparent)] text-[var(--color-danger)] border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)]",
  overridden:
    "bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)] border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]",
};

export function VerdictPill({ verdict }: { verdict: CheckVerdict }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        VERDICT_STYLES[verdict],
      )}
    >
      {verdict}
    </span>
  );
}
