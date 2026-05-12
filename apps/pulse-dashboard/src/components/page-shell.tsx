/**
 * Common page shell — applies consistent max-width + padding to every route
 * so the dashboard reads as one document, not seven different ones.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-[var(--color-border)] pb-6">
      {eyebrow && (
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      {description && (
        <p className="mt-3 text-[var(--color-muted)]">{description}</p>
      )}
    </header>
  );
}
