import { GeneratedPage } from "@/components/generated-section";
import { PageHeader, PageShell } from "@/components/page-shell";
import { loadView } from "@/lib/load";

export default function DbPage() {
  const { generated } = loadView();
  return (
    <PageShell>
      <PageHeader eyebrow="Project" title="Database" />
      <GeneratedPage
        section={generated.db}
        title="Database"
        description="Project-wide data model. Auto-extracted from the Prisma schema and merged with hand-authored context."
        manualHint="add a docs/pulse/db.md alongside docs/pulse/epics/ to write the prose half."
        autoHint="drop a prisma/schema.prisma in the repo root to populate this section automatically."
      />
    </PageShell>
  );
}
