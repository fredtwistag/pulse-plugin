import { ARTIFACTS_ROOT } from "@/lib/config";
import { walkArtifacts } from "@/lib/parser";

export default function HomePage() {
  const tree = walkArtifacts(ARTIFACTS_ROOT);

  const byType = new Map<string, number>();
  for (const a of tree.artifacts) {
    const t = (a.frontmatter.type as string) ?? "unknown";
    byType.set(t, (byType.get(t) ?? 0) + 1);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 border-b border-[var(--color-border)] pb-6">
        <p className="text-sm uppercase tracking-wider text-[var(--color-muted)]">
          Pulse Dashboard · Slice 0
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Read-only viewer over <code>docs/pulse/</code>
        </h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Slice 0 wires the parser and renders raw frontmatter. Slice 1 builds
          the sidebar tree + Mermaid rendering and the per-artifact detail
          pages.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-lg font-semibold">Artifacts root</h2>
        <p className="mt-1 font-mono text-sm text-[var(--color-muted)]">
          {ARTIFACTS_ROOT}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold">Summary</h2>
        {tree.artifacts.length === 0 ? (
          <p className="mt-2 text-[var(--color-muted)]">
            No artifacts found. Run <code>/pulse-spec</code> against this
            project or point <code>PULSE_ARTIFACTS_ROOT</code> at a real repo.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[...byType.entries()].map(([type, n]) => (
              <li
                key={type}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] px-4 py-3"
              >
                <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                  {type}
                </div>
                <div className="mt-1 text-2xl font-semibold">{n}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold">Artifact list</h2>
        <ul className="mt-3 divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
          {tree.artifacts.map((a) => (
            <li key={a.relPath} className="px-4 py-3">
              <div className="font-mono text-sm">{a.relPath}</div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">
                {(a.frontmatter.type as string) ?? "(no type)"} ·{" "}
                {(a.frontmatter.status as string) ?? "(no status)"} · id:{" "}
                {(a.frontmatter.id as string) ?? "—"}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {tree.errors.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-danger)]">
            Parser errors
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
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
    </main>
  );
}
