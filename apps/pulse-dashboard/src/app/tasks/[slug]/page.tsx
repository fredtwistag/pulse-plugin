import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanionBlock } from "@/components/companion-block";
import { FrontmatterCard } from "@/components/frontmatter-card";
import { Markdown } from "@/components/markdown";
import { PageHeader, PageShell } from "@/components/page-shell";
import { loadView } from "@/lib/load";
import { titleOf } from "@/lib/title";
import { findTask } from "@/lib/parser";

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
