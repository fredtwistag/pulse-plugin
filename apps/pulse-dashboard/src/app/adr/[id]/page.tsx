import Link from "next/link";
import { notFound } from "next/navigation";
import { FrontmatterCard } from "@/components/frontmatter-card";
import { Markdown } from "@/components/markdown";
import { PageHeader, PageShell } from "@/components/page-shell";
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

  return (
    <PageShell>
      <PageHeader
        eyebrow={<Link href={"/adr"}>← All ADRs</Link>}
        title={titleOf(adr.artifact) ?? adr.id}
      />

      <div className="mb-8">
        <FrontmatterCard fm={adr.artifact.frontmatter} />
      </div>

      <article>
        <Markdown source={adr.artifact.body} />
      </article>
    </PageShell>
  );
}
