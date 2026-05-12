import Link from "next/link";
import { loadView } from "@/lib/load";
import { titleOf } from "@/lib/title";
import { SidebarLink } from "./sidebar-link";

/**
 * Sidebar — server component. Walks docs/pulse/ at request time and renders
 * a collapsible tree. Auto-built from the artifact convention; no separate
 * config needed.
 */
export function Sidebar() {
  const { view } = loadView();

  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-canvas-subtle)] py-6 md:block">
      <div className="px-6 pb-6">
        <Link
          href="/"
          className="block text-base font-semibold text-[var(--color-fg)] hover:text-[var(--color-accent)]"
        >
          Pulse Dashboard
        </Link>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          read-only artifact wiki
        </p>
      </div>

      <SidebarSection label="Overview">
        <SidebarLink href="/">Home</SidebarLink>
      </SidebarSection>

      <SidebarSection label={`Epics (${view.epics.length})`}>
        {view.epics.length === 0 && (
          <Empty>No epics yet — run /pulse-spec to add one.</Empty>
        )}
        {view.epics.map((epic) => (
          <div key={epic.slug}>
            <SidebarLink href={`/epics/${epic.slug}`}>
              <span title={epic.spec.frontmatter.id as string | undefined}>
                {titleOf(epic.spec) ?? epic.slug}
              </span>
            </SidebarLink>
            {epic.features.map((feature) => (
              <div key={feature.slug}>
                <SidebarLink
                  href={`/features/${feature.slug}`}
                  depth={1}
                >
                  {titleOf(feature.spec) ?? feature.slug}
                </SidebarLink>
                {feature.tasks.map((task) => (
                  <SidebarLink
                    key={task.slug}
                    href={`/tasks/${task.slug}`}
                    depth={2}
                  >
                    {titleOf(task.spec) ?? task.slug}
                  </SidebarLink>
                ))}
              </div>
            ))}
          </div>
        ))}
      </SidebarSection>

      <SidebarSection label={`ADRs (${view.adrs.length})`}>
        {view.adrs.length === 0 && (
          <Empty>No ADRs yet — run /pulse-arch on a task.</Empty>
        )}
        {view.adrs.map((adr) => (
          <SidebarLink key={adr.id} href={`/adr/${adr.id}`}>
            {titleOf(adr.artifact) ?? adr.id}
          </SidebarLink>
        ))}
      </SidebarSection>
    </aside>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-2">
      <div className="px-6 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </div>
      <nav>{children}</nav>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-6 py-2 text-xs italic text-[var(--color-muted)]">
      {children}
    </p>
  );
}

