import type { Frontmatter } from "@/lib/parser";
import { AcceptanceList } from "./acceptance-list";
import { StatusBadge } from "./status-badge";

/**
 * Renders the structured fields of an artifact's frontmatter at the top of
 * a detail page. Anything not modeled here is ignored (it remains available
 * to the markdown body if the engineer chose to mention it).
 */
export function FrontmatterCard({ fm }: { fm: Frontmatter }) {
  const id = fm.id as string | undefined;
  const type = fm.type as string | undefined;
  const owners = Array.isArray(fm.owners) ? (fm.owners as string[]) : [];
  const created = fm.created as string | undefined;
  const updated = fm.updated as string | undefined;
  const links = (fm.links ?? {}) as Record<string, unknown>;
  const parent =
    typeof links.parent === "string" && links.parent.length > 0
      ? (links.parent as string)
      : null;
  const adrLinks = Array.isArray(links.adr) ? (links.adr as string[]) : [];
  const related = Array.isArray(links.related)
    ? (links.related as string[])
    : [];

  return (
    <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] p-5">
      <header className="flex flex-wrap items-center gap-3">
        {type && (
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            {type}
          </span>
        )}
        <StatusBadge status={fm.status as string | undefined} />
        {id && (
          <code className="text-xs text-[var(--color-muted)]">{id}</code>
        )}
      </header>

      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        {owners.length > 0 && (
          <Row label="Owners">{owners.join(", ")}</Row>
        )}
        {created && <Row label="Created">{created}</Row>}
        {updated && <Row label="Updated">{updated}</Row>}
        {parent && <Row label="Parent">{parent}</Row>}
        {adrLinks.length > 0 && (
          <Row label="ADRs">{adrLinks.join(", ")}</Row>
        )}
        {related.length > 0 && (
          <Row label="Related">{related.join(", ")}</Row>
        )}
      </dl>

      {Array.isArray(fm.acceptance) && fm.acceptance.length > 0 && (
        <div className="mt-5 border-t border-[var(--color-border)] pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Acceptance
          </p>
          <AcceptanceList items={fm.acceptance} />
        </div>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
