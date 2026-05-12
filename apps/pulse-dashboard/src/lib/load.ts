import { cache } from "react";
import {
  ARTIFACTS_ROOT,
  OVERRIDES_LOG,
  REPO_ROOT,
  REVIEWS_DIR,
} from "./config";
import { loadOverrides } from "./overrides";
import { buildView, walkArtifacts } from "./parser";
import { loadReviews } from "./reviews";

/**
 * Load the full Pulse state once per request. React `cache()` ensures multiple
 * Server Components rendering the same request reuse the parse.
 */
export const loadView = cache(() => {
  const tree = walkArtifacts(ARTIFACTS_ROOT);
  const reviews = loadReviews(REVIEWS_DIR);
  const overrides = loadOverrides(OVERRIDES_LOG);
  return {
    tree,
    view: buildView(tree.artifacts),
    reviews,
    overrides,
    root: ARTIFACTS_ROOT,
    repoRoot: REPO_ROOT,
  };
});
