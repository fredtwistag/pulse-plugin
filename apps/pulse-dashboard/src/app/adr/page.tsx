import Link from "next/link";
import { PageHeader, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { loadView } from "@/lib/load";
import { titleOf } from "@/lib/title";

export default function AdrIndexPage() {
  const { view } = loadView();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Artifacts"
        title="Architecture decisions"
        description={`${view.adrs.length} ADR${view.adrs.length === 1 ? "" : "s"} in this project.`}
      />

      {view.adrs.length === 0 ? (
        <p className="text-[var(--color-muted)]">
          No ADRs yet — <code>/pulse-arch</code> creates them.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
          {view.adrs.map((adr) => (
            <li key={adr.id}>
              <Link
                href={`/adr/${adr.id}`}
                className="block px-4 py-3 hover:bg-[var(--color-canvas-subtle)]"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={adr.artifact.frontmatter.status as string | undefined}
                  />
                  <code className="text-xs text-[var(--color-muted)]">
                    {adr.id}
                  </code>
                </div>
                <div className="mt-1 font-medium">
                  {titleOf(adr.artifact) ?? adr.id}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
