import Link from "next/link";
import { PageHeader, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { loadView } from "@/lib/load";
import { titleOf } from "@/lib/title";

export default function EpicsPage() {
  const { view } = loadView();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Artifacts"
        title="Epics"
        description={`${view.epics.length} epic${view.epics.length === 1 ? "" : "s"} in this project.`}
      />

      {view.epics.length === 0 ? (
        <p className="text-[var(--color-muted)]">
          No epics yet — run <code>/pulse-spec</code> to add one.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
          {view.epics.map((epic) => (
            <li key={epic.slug}>
              <Link
                href={`/epics/${epic.slug}`}
                className="block px-4 py-3 hover:bg-[var(--color-canvas-subtle)]"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={epic.spec.frontmatter.status as string | undefined}
                  />
                  <code className="text-xs text-[var(--color-muted)]">
                    {epic.slug}
                  </code>
                </div>
                <div className="mt-1 font-medium">
                  {titleOf(epic.spec) ?? epic.slug}
                </div>
                <div className="mt-1 text-xs text-[var(--color-muted)]">
                  {epic.features.length} feature
                  {epic.features.length === 1 ? "" : "s"} ·{" "}
                  {epic.features.reduce((n, f) => n + f.tasks.length, 0)} tasks
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
