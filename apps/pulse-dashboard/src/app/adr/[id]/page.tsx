import Link from "next/link";
import { notFound } from "next/navigation";
import { FrontmatterCard } from "@/components/frontmatter-card";
import { Markdown } from "@/components/markdown";
import { PageHeader, PageShell } from "@/components/page-shell";
import { SlugLink } from "@/components/slug-link";
import { loadView } from "@/lib/load";
import { titleOf } from "@/lib/title";
import { findAdr } from "@/lib/parser";

export function generateStaticParams() {
  const { view } = loadView();
  return view.adrs.map((a) => ({ id: a.id }));
}

export default async function AdrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { view } = loadView();
  const adr = findAdr(view, id);
  if (!adr) notFound();

  const links = (adr.artifact.frontmatter.links ?? {}) as Record<
    string,
    unknown
  >;
  const linkedTask =
    typeof links.task === "string" ? (links.task as string) : null;
  const supersedes =
    typeof links.supersedes === "string"
      ? (links.supersedes as string)
      : null;
  const supersededBy =
    typeof links["superseded-by"] === "string"
      ? (links["superseded-by"] as string)
      : null;

  return (
    <PageShell>
      <PageHeader
        eyebrow={<Link href={"/adr"}>← All ADRs</Link>}
        title={titleOf(adr.artifact) ?? adr.id}
      />

      <div className="mb-8">
        <FrontmatterCard fm={adr.artifact.frontmatter} />
      </div>

      {(linkedTask || supersedes || supersededBy) && (
        <section className="mb-8 rounded-md border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] p-5 text-sm">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Decision graph
          </h2>
          <dl className="grid grid-cols-1 gap-y-2 sm:grid-cols-[8rem_1fr]">
            {linkedTask && (
              <>
                <dt className="text-[var(--color-muted)]">Decides</dt>
                <dd>
                  <SlugLink slug={linkedTask} />
                </dd>
              </>
            )}
            {supersedes && (
              <>
                <dt className="text-[var(--color-muted)]">Supersedes</dt>
                <dd>
                  <SlugLink slug={supersedes} />
                </dd>
              </>
            )}
            {supersededBy && (
              <>
                <dt className="text-[var(--color-muted)]">Superseded by</dt>
                <dd>
                  <SlugLink slug={supersededBy} />
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      <article>
        <Markdown source={adr.artifact.body} />
      </article>
    </PageShell>
  );
}
