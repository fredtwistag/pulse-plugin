import { GeneratedPage } from "@/components/generated-section";
import { PageHeader, PageShell } from "@/components/page-shell";
import { loadView } from "@/lib/load";

export default function ApiPage() {
  const { generated } = loadView();
  return (
    <PageShell>
      <PageHeader eyebrow="Project" title="API" />
      <GeneratedPage
        section={generated.api}
        title="API"
        description="Project-wide API surface. Auto-extracted from the OpenAPI spec and merged with hand-authored context."
        manualHint="add a docs/pulse/api.md with API-level conventions (auth, pagination, error shape)."
        autoHint="drop an openapi.yaml (or .json) at the repo root or under docs/ to populate this section."
      />
    </PageShell>
  );
}
