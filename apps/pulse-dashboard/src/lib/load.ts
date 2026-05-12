import { cache } from "react";
import { ARTIFACTS_ROOT } from "./config";
import { buildView, walkArtifacts } from "./parser";

/**
 * Load the artifact view once per request. Wrapped in React `cache()` so
 * multiple Server Components rendering the same request reuse the parse.
 */
export const loadView = cache(() => {
  const tree = walkArtifacts(ARTIFACTS_ROOT);
  return { tree, view: buildView(tree.artifacts), root: ARTIFACTS_ROOT };
});
