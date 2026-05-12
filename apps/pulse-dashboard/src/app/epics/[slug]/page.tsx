import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanionBlock } from "@/components/companion-block";
import { FrontmatterCard } from "@/components/frontmatter-card";
import { Markdown } from "@/components/markdown";
import { PageHeader, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { loadView } from "@/lib/load";
import { titleOf } from "@/lib/title";
import { findEpic } from "@/lib/parser";

export function generateStaticParams() {
  const { view } = loadView();
  return view.epics.map((e) => ({ slug: e.slug }));
}

export default async function EpicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { view } = loadView();
  const epic = findEpic(view, slug);
  if (!epic) notFound();

  return (
    <PageShell>
      <PageHeader
        eyebrow={
          <Link href={"/epics"}>← All epics</Link>
        }
        title={titleOf(epic.spec) ?? epic.slug}
      />

      <div className="mb-8">
        <FrontmatterCard fm={epic.spec.frontmatter} />
      </div>

      {epic.features.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Features</h2>
          <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
            {epic.features.map((feature) => (
              <li key={feature.slug}>
                <Link
                  href={`/features/${feature.slug}`}
                  className="block px-4 py-3 hover:bg-[var(--color-canvas-subtle)]"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={feature.spec.frontmatter.status as string | undefined}
                    />
                    <code className="text-xs text-[var(--color-muted)]">
                      {feature.slug}
                    </code>
                  </div>
                  <div className="mt-1 font-medium">
                    {titleOf(feature.spec) ?? feature.slug}
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-muted)]">
                    {feature.tasks.length} task
                    {feature.tasks.length === 1 ? "" : "s"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <article>
        <Markdown source={epic.spec.body} />
      </article>

      {epic.companions.length > 0 && (
        <section className="mt-10 space-y-6">
          {epic.companions.map((c) => (
            <CompanionBlock
              key={c.kind}
              kind={c.kind}
              body={c.artifact.body}
            />
          ))}
        </section>
      )}
    </PageShell>
  );
}

