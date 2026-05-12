import type { ArtifactsView } from "./parser";
import type { Generated } from "./generators";
import type { ReviewRecord } from "./reviews";
import { titleOf } from "./title";

export interface SearchHit {
  href: string;
  title: string;
  kind: string;
  /** A short excerpt around the first match — for the result list. */
  excerpt: string;
  score: number;
}

const MAX_HITS = 50;
const EXCERPT_WINDOW = 80;

/**
 * Build a flat searchable index from every artifact, review, and
 * generated section. Built per-request — small enough that the cost is
 * trivial and the freshness is worth it. (At >10k artifacts this should
 * move to a build-time prebuilt index; v1 doesn't need that.)
 */
interface Indexed {
  href: string;
  title: string;
  kind: string;
  body: string;
}

export function buildSearchIndex(
  view: ArtifactsView,
  reviews: ReviewRecord[],
  generated: Generated,
): Indexed[] {
  const docs: Indexed[] = [];

  for (const epic of view.epics) {
    docs.push({
      href: `/epics/${epic.slug}`,
      title: titleOf(epic.spec) ?? epic.slug,
      kind: "epic",
      body: epic.spec.body,
    });
    for (const c of epic.companions) {
      docs.push({
        href: `/epics/${epic.slug}`,
        title: `${titleOf(epic.spec) ?? epic.slug} · ${c.kind}`,
        kind: `epic-${c.kind}`,
        body: c.artifact.body,
      });
    }
    for (const feature of epic.features) {
      docs.push({
        href: `/features/${feature.slug}`,
        title: titleOf(feature.spec) ?? feature.slug,
        kind: "feature",
        body: feature.spec.body,
      });
      for (const task of feature.tasks) {
        docs.push({
          href: `/tasks/${task.slug}`,
          title: titleOf(task.spec) ?? task.slug,
          kind: "task",
          body: task.spec.body,
        });
        for (const c of task.companions) {
          docs.push({
            href: `/tasks/${task.slug}`,
            title: `${titleOf(task.spec) ?? task.slug} · ${c.kind}`,
            kind: `task-${c.kind}`,
            body: c.artifact.body,
          });
        }
      }
    }
  }
  for (const adr of view.adrs) {
    docs.push({
      href: `/adr/${adr.id}`,
      title: titleOf(adr.artifact) ?? adr.id,
      kind: "adr",
      body: adr.artifact.body,
    });
  }
  for (const r of reviews) {
    docs.push({
      href: `/reviews/${r.shortSha}`,
      title: `Guard review · ${r.shortSha}`,
      kind: "review",
      body: r.body,
    });
  }
  for (const section of [generated.db, generated.api, generated.design]) {
    const slug = section.kind;
    docs.push({
      href: `/${slug}`,
      title: slug === "db" ? "Database" : slug === "api" ? "API" : "Design system",
      kind: slug,
      body: section.manual + "\n\n" + section.auto,
    });
  }

  return docs;
}

export function search(index: Indexed[], rawQuery: string): SearchHit[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const hits: SearchHit[] = [];
  for (const doc of index) {
    const haystack = (doc.title + "\n" + doc.body).toLowerCase();
    let score = 0;
    let firstHit = -1;
    for (const term of terms) {
      const idx = haystack.indexOf(term);
      if (idx === -1) {
        score = 0;
        break;
      }
      // Title matches are worth more than body matches.
      const inTitle = doc.title.toLowerCase().includes(term);
      score += inTitle ? 10 : 1;
      if (firstHit === -1 || idx < firstHit) firstHit = idx;
    }
    if (score === 0) continue;

    const body = doc.body;
    const start = Math.max(0, firstHit - EXCERPT_WINDOW);
    const end = Math.min(body.length, firstHit + EXCERPT_WINDOW);
    let excerpt = body.slice(start, end).replace(/\s+/g, " ").trim();
    if (start > 0) excerpt = "… " + excerpt;
    if (end < body.length) excerpt = excerpt + " …";

    hits.push({
      href: doc.href,
      title: doc.title,
      kind: doc.kind,
      excerpt,
      score,
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, MAX_HITS);
}
