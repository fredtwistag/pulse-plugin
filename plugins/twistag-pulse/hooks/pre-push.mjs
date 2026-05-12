#!/usr/bin/env node
/**
 * Pulse — git pre-push hook.
 *
 * Reads .pulse/reviews/<HEAD-sha>.md. If a review exists and its `overall:` is
 * pass / warning / overridden, allow the push. Otherwise, block with a clear
 * message pointing the engineer at /pulse-guard.
 *
 * Install (from your repo root):
 *
 *   ln -sf "$(pnpm -s exec twistag-pulse-hook-path)" .git/hooks/pre-push
 *   chmod +x .git/hooks/pre-push
 *
 * Or copy the file (no symlink):
 *
 *   cp "$PWD/node_modules/twistag-pulse/hooks/pre-push.mjs" .git/hooks/pre-push
 *   chmod +x .git/hooks/pre-push
 *
 * The hook is deterministic — it doesn't invoke an LLM. The LLM analysis runs
 * via `/pulse-guard` ahead of time and writes the review file this hook reads.
 */
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const BOLD = "\x1b[1m";

function bail(message, code = 1) {
  process.stderr.write(`${RED}${BOLD}Pulse pre-push blocked.${RESET}\n${message}\n`);
  process.exit(code);
}

function repoRoot() {
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  } catch {
    bail("Not inside a git repo.");
  }
}

function headSha() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    bail("Failed to resolve HEAD.");
  }
}

/**
 * Crude frontmatter extractor — Pulse review files always start with `---\n`
 * and the frontmatter block ends at the next line containing only `---`. The
 * `overall:` field is what we care about; no full YAML parser required.
 */
function readOverall(reviewPath) {
  const raw = readFileSync(reviewPath, "utf8");
  if (!raw.startsWith("---\n")) return null;
  const end = raw.indexOf("\n---", 4);
  if (end === -1) return null;
  const frontmatter = raw.slice(4, end);
  const m = frontmatter.match(/^overall:\s*([a-z]+)\s*$/m);
  return m ? m[1] : null;
}

function bypassRequested() {
  return process.env.PULSE_SKIP_GUARD === "1";
}

function main() {
  if (bypassRequested()) {
    process.stderr.write(
      `${YELLOW}Pulse pre-push: PULSE_SKIP_GUARD=1 — skipping review check.${RESET}\n`,
    );
    process.exit(0);
  }

  const root = repoRoot();
  const sha = headSha();
  const reviewPath = resolve(root, ".pulse/reviews", `${sha}.md`);
  const cmdHint = `Run ${BOLD}/pulse-guard${RESET}${RED} in Claude Code, then try the push again.${RESET}`;

  if (!existsSync(resolve(root, ".pulse"))) {
    process.stderr.write(
      `${YELLOW}Pulse pre-push: no .pulse/ directory in this repo. Skipping.${RESET}\n`,
    );
    process.exit(0);
  }

  if (!existsSync(reviewPath)) {
    bail(
      `No review found for HEAD (${sha.slice(0, 7)}).\n\n  expected: ${reviewPath}\n\n${RED}${cmdHint}`,
    );
  }

  const overall = readOverall(reviewPath);
  if (!overall) {
    bail(
      `Review at ${reviewPath} is malformed — could not read overall verdict.\n\n${RED}${cmdHint}`,
    );
  }

  switch (overall) {
    case "pass":
    case "warning":
    case "overridden":
      process.stderr.write(
        `${GREEN}Pulse pre-push: review ${sha.slice(0, 7)} overall=${overall}. Proceeding.${RESET}\n`,
      );
      process.exit(0);
      break;
    case "fail":
      bail(
        `Review ${sha.slice(0, 7)} overall=fail.\n\n  ${reviewPath}\n\n${RED}Either fix the issues and re-run /pulse-guard, or override the failing checks with /pulse-guard --override "<reason>".${RESET}`,
      );
      break;
    default:
      bail(`Unknown overall verdict in review: ${overall}.`);
  }
}

main();
