import type { Artifact } from "./types";

/**
 * Path-driven structure derived from the `docs/pulse/` convention:
 *
 *   epics/<epic>/spec.md                                                  ← EpicNode.spec
 *   epics/<epic>/arch.md                                                  ← EpicNode.companions
 *   epics/<epic>/features/<feature>/spec.md                               ← FeatureNode.spec
 *   epics/<epic>/features/<feature>/tasks/<task>/spec.md                  ← TaskNode.spec
 *   epics/<epic>/features/<feature>/tasks/<task>/{db,api,design}.md       ← TaskNode.companions
 *   adr/ADR-NNN-<slug>.md                                                 ← Adr
 *
 * `spec.md` defines a node; sibling `.md` files in the same directory are
 * companion artifacts (db diagrams, API design, UI design notes) of that node.
 */

export interface CompanionArtifact {
  /** Filename without extension: "db", "api", "design", "arch", etc. */
  kind: string;
  artifact: Artifact;
}

export interface TaskNode {
  slug: string;
  spec: Artifact;
  companions: CompanionArtifact[];
  /** Path of segments: [epicSlug, featureSlug, taskSlug]. */
  path: [string, string, string];
}

export interface FeatureNode {
  slug: string;
  spec: Artifact;
  companions: CompanionArtifact[];
  tasks: TaskNode[];
  path: [string, string];
}

export interface EpicNode {
  slug: string;
  spec: Artifact;
  companions: CompanionArtifact[];
  features: FeatureNode[];
  path: [string];
}

export interface Adr {
  id: string;
  artifact: Artifact;
}

export interface ArtifactsView {
  epics: EpicNode[];
  adrs: Adr[];
  /** Artifacts the structural walker could not place (kept for /audit-style debug). */
  orphans: Artifact[];
}

const SEP = "/";

function segments(relPath: string): string[] {
  return relPath.split(SEP);
}

/**
 * Build the structured view from a flat list of artifacts. Stable order:
 * epics sorted by their spec's `id`, features and tasks by their slug.
 */
export function buildView(artifacts: Artifact[]): ArtifactsView {
  const epicsBySlug = new Map<string, EpicNode>();
  const featuresByKey = new Map<string, FeatureNode>(); // key: `${epic}/${feature}`
  const tasksByKey = new Map<string, TaskNode>(); // key: `${epic}/${feature}/${task}`
  const adrs: Adr[] = [];
  const orphans: Artifact[] = [];

  // First pass: every spec.md becomes a node.
  for (const a of artifacts) {
    const segs = segments(a.relPath);
    const last = segs[segs.length - 1];

    if (segs[0] === "adr" && segs.length === 2 && last.endsWith(".md")) {
      adrs.push({
        id: (a.frontmatter.id as string) ?? last.replace(/\.md$/, ""),
        artifact: a,
      });
      continue;
    }

    if (last !== "spec.md") continue; // companions handled in second pass

    // epics/<epic>/spec.md
    if (segs.length === 3 && segs[0] === "epics") {
      const slug = segs[1];
      epicsBySlug.set(slug, {
        slug,
        spec: a,
        companions: [],
        features: [],
        path: [slug],
      });
      continue;
    }
    // epics/<epic>/features/<feature>/spec.md
    if (segs.length === 5 && segs[0] === "epics" && segs[2] === "features") {
      const epic = segs[1];
      const feature = segs[3];
      const key = `${epic}/${feature}`;
      featuresByKey.set(key, {
        slug: feature,
        spec: a,
        companions: [],
        tasks: [],
        path: [epic, feature],
      });
      continue;
    }
    // epics/<epic>/features/<feature>/tasks/<task>/spec.md
    if (
      segs.length === 7 &&
      segs[0] === "epics" &&
      segs[2] === "features" &&
      segs[4] === "tasks"
    ) {
      const epic = segs[1];
      const feature = segs[3];
      const task = segs[5];
      const key = `${epic}/${feature}/${task}`;
      tasksByKey.set(key, {
        slug: task,
        spec: a,
        companions: [],
        path: [epic, feature, task],
      });
      continue;
    }
    // unrecognized spec.md placement — orphan it
    orphans.push(a);
  }

  // Second pass: attach companion files (non-spec, non-adr .md) to their parent node.
  for (const a of artifacts) {
    const segs = segments(a.relPath);
    const last = segs[segs.length - 1];
    if (last === "spec.md") continue;
    if (segs[0] === "adr") continue;
    if (!last.endsWith(".md")) continue;

    const kind = last.replace(/\.md$/, "");

    // epics/<epic>/<companion>.md
    if (segs.length === 3 && segs[0] === "epics") {
      const epic = epicsBySlug.get(segs[1]);
      if (epic) {
        epic.companions.push({ kind, artifact: a });
        continue;
      }
    }
    // epics/<epic>/features/<feature>/<companion>.md
    if (segs.length === 5 && segs[0] === "epics" && segs[2] === "features") {
      const key = `${segs[1]}/${segs[3]}`;
      const feature = featuresByKey.get(key);
      if (feature) {
        feature.companions.push({ kind, artifact: a });
        continue;
      }
    }
    // epics/<epic>/features/<feature>/tasks/<task>/<companion>.md
    if (
      segs.length === 7 &&
      segs[0] === "epics" &&
      segs[2] === "features" &&
      segs[4] === "tasks"
    ) {
      const key = `${segs[1]}/${segs[3]}/${segs[5]}`;
      const task = tasksByKey.get(key);
      if (task) {
        task.companions.push({ kind, artifact: a });
        continue;
      }
    }

    orphans.push(a);
  }

  // Wire features -> epics and tasks -> features. Stable sort.
  for (const feature of featuresByKey.values()) {
    const epic = epicsBySlug.get(feature.path[0]);
    if (epic) {
      epic.features.push(feature);
    } else {
      orphans.push(feature.spec);
    }
  }
  for (const task of tasksByKey.values()) {
    const featureKey = `${task.path[0]}/${task.path[1]}`;
    const feature = featuresByKey.get(featureKey);
    if (feature) {
      feature.tasks.push(task);
    } else {
      orphans.push(task.spec);
    }
  }

  const byKind = (a: { slug: string }, b: { slug: string }) =>
    a.slug.localeCompare(b.slug);

  const epics = [...epicsBySlug.values()].sort(byKind);
  for (const epic of epics) {
    epic.features.sort(byKind);
    epic.companions.sort((a, b) => a.kind.localeCompare(b.kind));
    for (const feature of epic.features) {
      feature.tasks.sort(byKind);
      feature.companions.sort((a, b) => a.kind.localeCompare(b.kind));
      for (const task of feature.tasks) {
        task.companions.sort((a, b) => a.kind.localeCompare(b.kind));
      }
    }
  }
  adrs.sort((a, b) => a.id.localeCompare(b.id));

  return { epics, adrs, orphans };
}
