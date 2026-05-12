import Link from "next/link";
import { PageHeader, PageShell } from "@/components/page-shell";
import { VerdictPill } from "@/components/verdict-pill";
import { loadView } from "@/lib/load";

export default function ReviewsPage() {
  const { reviews } = loadView();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Guard"
        title="Reviews"
        description={`${reviews.length} review${reviews.length === 1 ? "" : "s"} captured. Each entry is the structured verdict /pulse-guard wrote for one PR or push.`}
      />

      {reviews.length === 0 ? (
        <p className="text-[var(--color-muted)]">
          No reviews yet. Run <code>/pulse-guard</code> on a diff to write one.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
          {reviews.map((r) => (
            <li key={r.sha}>
              <Link
                href={`/reviews/${r.shortSha}`}
                className="block px-4 py-3 hover:bg-[var(--color-canvas-subtle)]"
              >
                <header className="flex flex-wrap items-center gap-3">
                  <VerdictPill verdict={r.overall} />
                  <code className="text-xs text-[var(--color-muted)]">
                    {r.shortSha}
                  </code>
                  <span className="text-sm">{r.engineer}</span>
                  <time className="ml-auto text-xs text-[var(--color-muted)]">
                    {r.created}
                  </time>
                </header>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {Object.entries(r.verdicts).map(([check, v]) => (
                    <span
                      key={check}
                      className="rounded border border-[var(--color-border)] px-2 py-0.5 text-xs"
                    >
                      <span className="text-[var(--color-muted)]">{check}</span>
                      <span className="mx-1 text-[var(--color-muted)]">·</span>
                      <span>{v}</span>
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
