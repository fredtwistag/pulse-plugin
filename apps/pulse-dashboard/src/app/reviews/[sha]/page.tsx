import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PageHeader, PageShell } from "@/components/page-shell";
import { VerdictPill } from "@/components/verdict-pill";
import { loadView } from "@/lib/load";
import { findReviewBySha } from "@/lib/reviews";

export function generateStaticParams() {
  const { reviews } = loadView();
  // Pre-render both full and short sha. URLs in the app use short.
  return reviews.map((r) => ({ sha: r.shortSha }));
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ sha: string }>;
}) {
  const { sha } = await params;
  const { reviews, overrides } = loadView();
  const review = findReviewBySha(reviews, sha);
  if (!review) notFound();

  const reviewOverrides = overrides.filter((o) => o.sha === review.sha);

  return (
    <PageShell>
      <PageHeader
        eyebrow={<Link href="/reviews">← All reviews</Link>}
        title={
          <span className="flex items-center gap-3">
            <code className="text-2xl">{review.shortSha}</code>
            <VerdictPill verdict={review.overall} />
          </span>
        }
        description={
          <span>
            engineer <strong>{review.engineer}</strong> · base{" "}
            <code>{review.base}</code> · {review.created}
          </span>
        }
      />

      <section className="mb-8 rounded-md border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] p-5">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          Verdicts
        </h2>
        <ul className="space-y-1.5">
          {Object.entries(review.verdicts).map(([check, v]) => (
            <li key={check} className="flex items-center gap-3 text-sm">
              <span className="w-48 font-mono text-xs">{check}</span>
              <VerdictPill verdict={v} />
            </li>
          ))}
        </ul>
      </section>

      {reviewOverrides.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Overrides on this PR</h2>
          <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
            {reviewOverrides.map((o, i) => (
              <li key={i} className="p-4">
                <header className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded bg-[var(--color-canvas-subtle)] px-2 py-0.5 font-mono text-xs">
                    {o.check}
                  </span>
                  <span className="text-[var(--color-muted)]">
                    {o.engineer}
                  </span>
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
        </section>
      )}

      <article>
        <Markdown source={review.body} />
      </article>
    </PageShell>
  );
}
