import Link from "next/link";
import { PageHeader, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { VerdictPill } from "@/components/verdict-pill";
import { loadView } from "@/lib/load";
import { titleOf } from "@/lib/title";
import { countAll } from "@/lib/parser";

export default function HomePage() {
  const { view, tree, root, reviews, overrides } = loadView();
  const counts = countAll(view);

  // Guard health: pass rate over the most recent reviews. A review counts as
  // a "pass" if every individual check passed (warnings don't disqualify;
  // overridden does — it means a fail was waved through).
  const recent = reviews.slice(0, 20);
  const passed = recent.filter((r) => r.overall === "pass").length;
  const passRate =
    recent.length > 0 ? Math.round((passed / recent.length) * 100) : null;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Pulse Dashboard · Slice 1"
        title="Project overview"
        description="Read-only viewer over docs/pulse/ and .pulse/. Specs, ADRs, DB models, API design, and the override audit log — one screen."
      />

      <section className="mb-10">
        <p className="font-mono text-xs text-[var(--color-muted)]">{root}</p>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-semibold">Counts</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {(
            [
              ["epics", counts.epics],
              ["features", counts.features],
              ["tasks", counts.tasks],
              ["adrs", counts.adrs],
              ["companions", counts.companions],
            ] as const
          ).map(([label, n]) => (
            <li
              key={label}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] px-4 py-3"
            >
              <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                {label}
              </div>
              <div className="mt-1 text-2xl font-semibold">{n}</div>
            </li>
          ))}
        </ul>
      </section>

      {reviews.length > 0 && (
        <section className="mb-12">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-semibold">Guard health</h2>
            <Link className="text-sm" href="/reviews">
              All reviews →
            </Link>
          </div>
          <div className="rounded-md border border-[var(--color-border)] p-5">
            <div className="flex flex-wrap items-baseline gap-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                  Pass rate · last {recent.length}
                </div>
                <div className="mt-1 text-3xl font-semibold">
                  {passRate === null ? "—" : `${passRate}%`}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                  Overrides
                </div>
                <div className="mt-1 text-3xl font-semibold">
                  {overrides.length}
                </div>
              </div>
              <div className="ml-auto flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <Link
                    key={r.sha}
                    href={`/reviews/${r.shortSha}`}
                    title={`${r.shortSha} · ${r.overall} · ${r.engineer}`}
                  >
                    <VerdictPill verdict={r.overall} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mb-12">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Epics</h2>
          <Link
            className="text-sm"
            href={"/epics"}
          >
            See all →
          </Link>
        </div>
        {view.epics.length === 0 ? (
          <p className="text-[var(--color-muted)]">
            No epics yet — run <code>/pulse-spec</code> to add one.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {view.epics.slice(0, 6).map((epic) => (
              <li key={epic.slug}>
                <Link
                  href={`/epics/${epic.slug}`}
                  className="block rounded-md border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)]"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={epic.spec.frontmatter.status as string | undefined}
                    />
                    <span className="text-xs text-[var(--color-muted)]">
                      {epic.slug}
                    </span>
                  </div>
                  <div className="mt-2 font-medium">
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
      </section>

      {tree.errors.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-danger)]">
            Parser errors
          </h2>
          <ul className="space-y-2 text-sm">
            {tree.errors.map((e, i) => (
              <li
                key={i}
                className="rounded border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-3 py-2"
              >
                <div className="font-mono text-xs">{e.path}</div>
                <div className="mt-1">{e.message}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {view.orphans.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-warning)]">
            Unplaced artifacts
          </h2>
          <p className="mb-2 text-sm text-[var(--color-muted)]">
            These files don't fit the docs/pulse/ convention — Slice 6 surfaces
            them on a dedicated page.
          </p>
          <ul className="space-y-1 font-mono text-xs">
            {view.orphans.map((a) => (
              <li key={a.relPath}>{a.relPath}</li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}
