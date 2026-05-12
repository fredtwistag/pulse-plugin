import type { ArtifactsView } from "./parser";

/**
 * Resolve a frontmatter link slug (whatever appears under `links.parent`,
 * `links.adr`, `links.related`, etc.) to a dashboard route. Returns null if
 * the slug does not match any known artifact — caller renders it as plain
 * text in that case.
 */
export function resolveLink(view: ArtifactsView, slug: string): string | null {
  if (!slug) return null;

  // ADRs use a stable `ADR-NNN-…` id; treat anything starting with `ADR-`
  // as an ADR slug to avoid scanning epic/feature/task lists.
  if (/^ADR-\d+/i.test(slug)) {
    return view.adrs.some((a) => a.id === slug) ? `/adr/${slug}` : null;
  }

  if (view.epics.some((e) => e.slug === slug)) return `/epics/${slug}`;
  for (const epic of view.epics) {
    if (epic.features.some((f) => f.slug === slug)) return `/features/${slug}`;
    for (const feature of epic.features) {
      if (feature.tasks.some((t) => t.slug === slug)) return `/tasks/${slug}`;
    }
  }
  return null;
}
