import type { Artifact } from "./parser";

/** Extract the first markdown H1 from the body, falling back to id / filename. */
export function titleOf(artifact: Artifact): string | null {
  const m = artifact.body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}
