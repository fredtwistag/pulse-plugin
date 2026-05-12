import { GeneratedPage } from "@/components/generated-section";
import { PageHeader, PageShell } from "@/components/page-shell";
import { loadView } from "@/lib/load";

export default function DesignPage() {
  const { generated } = loadView();
  return (
    <PageShell>
      <PageHeader eyebrow="Project" title="Design system" />
      <GeneratedPage
        section={generated.design}
        title="Design system"
        description="Project-wide design tokens. Auto-extracted from Tailwind v4 @theme blocks and merged with hand-authored context."
        manualHint="add a docs/pulse/design.md to describe the system's intent: when each token is used, what's brand vs semantic, etc."
        autoHint="any CSS file in this repo with an @theme { } block populates the auto-extracted section."
      />
    </PageShell>
  );
}
