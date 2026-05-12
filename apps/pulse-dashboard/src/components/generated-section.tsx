import { Markdown } from "./markdown";
import type { GeneratedSection } from "@/lib/generators";

export function GeneratedPage({
  section,
  title,
  description,
  manualHint,
  autoHint,
}: {
  section: GeneratedSection;
  title: string;
  description: string;
  manualHint: string;
  autoHint: string;
}) {
  const hasManual = section.manual.trim().length > 0;
  const hasAuto = section.auto.trim().length > 0;

  return (
    <>
      <p className="mb-8 text-[var(--color-muted)]">{description}</p>

      {!hasManual && !hasAuto && (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] p-5 text-sm text-[var(--color-muted)]">
          <p className="font-medium text-[var(--color-fg)]">
            Nothing to show yet.
          </p>
          <ul className="mt-2 list-disc pl-5">
            <li>
              Narrative: {manualHint}
            </li>
            <li>
              Auto-extract: {autoHint}
            </li>
          </ul>
        </div>
      )}

      {hasManual && (
        <section className="mb-10">
          <SectionHeader
            label="Narrative"
            hint="hand-authored at docs/pulse/{slug}.md"
            slug={section.kind}
          />
          <article>
            <Markdown source={section.manual} />
          </article>
        </section>
      )}

      {hasAuto && (
        <section>
          <SectionHeader
            label="Auto-extracted"
            hint={
              section.sourceLabel
                ? `from \`${section.sourceLabel}\``
                : "from project source"
            }
            slug={section.kind}
          />
          <article>
            <Markdown source={section.auto} />
          </article>
        </section>
      )}
    </>
  );

  // Inline so the parent route can pass title/description without a wrapper.
  function SectionHeader({
    label,
    hint,
  }: {
    label: string;
    hint: string;
    slug: string;
  }) {
    return (
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </h2>
        <span className="text-xs text-[var(--color-muted)]">{hint}</span>
      </div>
    );
  }
}
