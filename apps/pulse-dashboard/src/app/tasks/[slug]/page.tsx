import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanionBlock } from "@/components/companion-block";
import { FrontmatterCard } from "@/components/frontmatter-card";
import { Markdown } from "@/components/markdown";
import { PageHeader, PageShell } from "@/components/page-shell";
import { SlugLink } from "@/components/slug-link";
import { loadView } from "@/lib/load";
import { titleOf } from "@/lib/title";
import { findAdr, findTask } from "@/lib/parser";

export function generateStaticParams() {
  const { view } = loadView();
  return view.epics.flatMap((epic) =>
    epic.features.flatMap((feature) =>
      feature.tasks.map((t) => ({ slug: t.slug })),
    ),
  );
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { view } = loadView();
  const match = findTask(view, slug);
  if (!match) notFound();
  const { epic, feature, task } = match;

  const adrSlugs = (
    (task.spec.frontmatter.links as { adr?: string[] } | undefined)?.adr ?? []
  ).filter((s): s is string => typeof s === "string");
  const linkedAdrs = adrSlugs
    .map((id) => findAdr(view, id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

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
            {" / "}
            <Link href={`/features/${feature.slug}`}>
              {titleOf(feature.spec) ?? feature.slug}
            </Link>
          </span>
        }
        title={titleOf(task.spec) ?? task.slug}
      />

      <div className="mb-8">
        <FrontmatterCard fm={task.spec.frontmatter} />
      </div>

      {linkedAdrs.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Architecture decisions</h2>
          <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
            {linkedAdrs.map((adr) => (
              <li key={adr.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-[var(--color-muted)]">
                    {adr.id}
                  </code>
                </div>
                <div className="mt-1 font-medium">
                  <SlugLink slug={adr.id} />
                  <span className="ml-2 text-[var(--color-fg)]">
                    {titleOf(adr.artifact) ?? ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <article>
        <Markdown source={task.spec.body} />
      </article>

      {task.companions.length > 0 && (
        <section className="mt-10 space-y-6">
          {task.companions.map((c) => (
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
