import Link from "next/link";
import { PageHeader, PageShell } from "@/components/page-shell";
import { loadView } from "@/lib/load";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ check?: string; engineer?: string }>;
}) {
  const { check: checkFilter, engineer: engineerFilter } = await searchParams;
  const { overrides } = loadView();

  const filtered = overrides.filter((o) => {
    if (checkFilter && o.check !== checkFilter) return false;
    if (engineerFilter && o.engineer !== engineerFilter) return false;
    return true;
  });

  const checks = [...new Set(overrides.map((o) => o.check))].sort();
  const engineers = [...new Set(overrides.map((o) => o.engineer))].sort();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Guard"
        title="Override audit"
        description={`${overrides.length} override${overrides.length === 1 ? "" : "s"} recorded. Each entry is append-only, attributed, and timestamped.`}
      />

      {overrides.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] p-3 text-sm">
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
            Filters
          </span>
          <FilterGroup
            label="check"
            current={checkFilter}
            options={checks}
            paramName="check"
            otherParams={{ engineer: engineerFilter }}
          />
          <FilterGroup
            label="engineer"
            current={engineerFilter}
            options={engineers}
            paramName="engineer"
            otherParams={{ check: checkFilter }}
          />
          {(checkFilter || engineerFilter) && (
            <Link href="/audit" className="ml-auto text-xs">
              clear all
            </Link>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-[var(--color-muted)]">
          {overrides.length === 0
            ? "No overrides yet. Every override is logged here when /pulse-guard --override is run."
            : "No overrides match these filters."}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
          {filtered.map((o, i) => (
            <li key={`${o.sha}-${o.check}-${i}`} className="p-4">
              <header className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href={`/reviews/${o.shortSha}`}
                  className="font-mono text-xs"
                >
                  {o.shortSha}
                </Link>
                <span className="rounded bg-[var(--color-canvas-subtle)] px-2 py-0.5 font-mono text-xs">
                  {o.check}
                </span>
                <span className="text-[var(--color-muted)]">{o.engineer}</span>
                {o.secondEngineer && (
                  <span className="text-xs text-[var(--color-muted)]">
                    + {o.secondEngineer}
                  </span>
                )}
                <time className="ml-auto text-xs text-[var(--color-muted)]">
                  {o.created}
                </time>
              </header>
              <p className="mt-2 text-sm">{o.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

function FilterGroup({
  label,
  current,
  options,
  paramName,
  otherParams,
}: {
  label: string;
  current: string | undefined;
  options: string[];
  paramName: string;
  otherParams: Record<string, string | undefined>;
}) {
  if (options.length === 0) return null;
  const baseParams = Object.entries(otherParams)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join("&");
  const sep = baseParams ? "&" : "";

  return (
    <span className="flex items-center gap-1">
      <span className="text-xs text-[var(--color-muted)]">{label}:</span>
      {options.map((opt) => {
        const active = current === opt;
        const href = active
          ? `/audit${baseParams ? `?${baseParams}` : ""}`
          : `/audit?${baseParams}${sep}${paramName}=${encodeURIComponent(opt)}`;
        return (
          <Link
            key={opt}
            href={href}
            className={
              "rounded border px-2 py-0.5 text-xs " +
              (active
                ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] hover:border-[var(--color-accent)]")
            }
          >
            {opt}
          </Link>
        );
      })}
    </span>
  );
}
