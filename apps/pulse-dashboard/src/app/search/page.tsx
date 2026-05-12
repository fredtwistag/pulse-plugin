import Link from "next/link";
import { PageHeader, PageShell } from "@/components/page-shell";
import { loadView } from "@/lib/load";
import { buildSearchIndex, search } from "@/lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const { view, reviews, generated } = loadView();
  const index = buildSearchIndex(view, reviews, generated);
  const hits = query ? search(index, query) : [];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Search"
        title={query ? `Results for "${query}"` : "Search"}
        description={
          query
            ? `${hits.length} match${hits.length === 1 ? "" : "es"} across ${index.length} indexed documents.`
            : `Searches across every spec, ADR, review, and generated artifact (${index.length} documents in this project).`
        }
      />

      <form action="/search" className="mb-8">
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Search specs, ADRs, reviews, schema, API…"
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-base focus:border-[var(--color-accent)] focus:outline-none"
        />
      </form>

      {query && hits.length === 0 && (
        <p className="text-[var(--color-muted)]">No matches.</p>
      )}

      {hits.length > 0 && (
        <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
          {hits.map((h, i) => (
            <li key={`${h.href}-${i}`}>
              <Link
                href={h.href}
                className="block px-4 py-3 hover:bg-[var(--color-canvas-subtle)]"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--color-canvas-subtle)] px-2 py-0.5 text-xs">
                    {h.kind}
                  </span>
                  <span className="font-medium">{h.title}</span>
                </div>
                {h.excerpt && (
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {h.excerpt}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
