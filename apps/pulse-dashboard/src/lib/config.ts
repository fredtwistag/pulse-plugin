import { resolve } from "node:path";

/**
 * Pulse Dashboard reads from a "project root" — the directory that contains
 * both `docs/pulse/` (artifacts) and `.pulse/` (config, reviews, overrides).
 * Override the default fixture location with the `PULSE_REPO_ROOT` env var
 * to point it at a real client repo.
 */
export const REPO_ROOT = resolve(
  process.cwd(),
  process.env.PULSE_REPO_ROOT ?? "../../fixtures/sample-repo",
);

export const ARTIFACTS_ROOT = resolve(REPO_ROOT, "docs/pulse");
export const PULSE_DIR = resolve(REPO_ROOT, ".pulse");
export const REVIEWS_DIR = resolve(PULSE_DIR, "reviews");
export const OVERRIDES_LOG = resolve(PULSE_DIR, "overrides.log.md");
