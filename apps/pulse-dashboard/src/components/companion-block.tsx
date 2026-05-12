import { Markdown } from "./markdown";

export function CompanionBlock({
  kind,
  body,
}: {
  kind: string;
  body: string;
}) {
  return (
    <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] p-5">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
        Companion · {kind}
      </h2>
      <Markdown source={body} />
    </section>
  );
}
