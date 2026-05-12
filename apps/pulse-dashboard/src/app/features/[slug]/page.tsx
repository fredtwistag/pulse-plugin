import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanionBlock } from "@/components/companion-block";
import { FrontmatterCard } from "@/components/frontmatter-card";
import { Markdown } from "@/components/markdown";
import { PageHeader, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { loadView } from "@/lib/load";
import { titleOf } from "@/lib/title";
import { findFeature } from "@/lib/parser";

export function generateStaticParams() {
  const { view } = loadView();
  return view.epics.flatMap((epic) =>
    epic.features.map((f) => ({ slug: f.slug })),
  );
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { view } = loadView();
  const match = findFeature(view, slug);
  if (!match) notFound();
  const { epic, feature } = match;

  return (
    <PageShell>
      <PageHeader
        eyebrow={
          <span>
            <Link href={"/epics"}>Epics</Link>
            {" / "}
            <Link href={`/epics/${epic.slug}`}>
              {titleOf(epic.spec) ?? epic.slug}
            </Link>
          </span>
        }
        title={titleOf(feature.spec) ?? feature.slug}
      />

      <div className="mb-8">
        <FrontmatterCard fm={feature.spec.frontmatter} />
      </div>

      {feature.tasks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Tasks</h2>
          <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
            {feature.tasks.map((task) => (
              <li key={task.slug}>
                <Link
                  href={`/tasks/${task.slug}`}
                  className="block px-4 py-3 hover:bg-[var(--color-canvas-subtle)]"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={task.spec.frontmatter.status as string | undefined}
                    />
                    <code className="text-xs text-[var(--color-muted)]">
                      {task.slug}
                    </code>
                  </div>
                  <div className="mt-1 font-medium">
                    {titleOf(task.spec) ?? task.slug}
                  </div>
                  {task.companions.length > 0 && (
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      Artifacts:{" "}
                      {task.companions.map((c) => c.kind).join(" · ")}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <article>
        <Markdown source={feature.spec.body} />
      </article>

      {feature.companions.length > 0 && (
        <section className="mt-10 space-y-6">
          {feature.companions.map((c) => (
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
