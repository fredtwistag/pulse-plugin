import { resolve } from "node:path";

/**
 * Pulse Dashboard reads artifacts from a configured root. In dev mode (Slice 0
 * and beyond) it points at the bundled fixtures repo so we can develop the
 * dashboard against a deterministic example. Override with the
 * `PULSE_ARTIFACTS_ROOT` env var to point it at a real client repo.
 */
export const ARTIFACTS_ROOT = resolve(
  process.cwd(),
  process.env.PULSE_ARTIFACTS_ROOT ?? "../../fixtures/sample-repo/docs/pulse",
);
