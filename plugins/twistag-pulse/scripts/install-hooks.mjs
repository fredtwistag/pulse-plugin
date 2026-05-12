#!/usr/bin/env node
/**
 * Install Pulse's git hooks into the current repo.
 *
 *   node plugins/twistag-pulse/scripts/install-hooks.mjs
 *
 * Currently installs:
 *   - pre-push : runs the Guard check on .pulse/reviews/<HEAD-sha>.md
 *
 * Backs up an existing hook to .git/hooks/pre-push.pulse-backup-<ts> if it
 * exists and isn't already the Pulse hook.
 */
import {
  existsSync,
  readFileSync,
  renameSync,
  symlinkSync,
  unlinkSync,
  mkdirSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(HERE, "..");
const PRE_PUSH_SOURCE = resolve(PLUGIN_ROOT, "hooks/pre-push.mjs");

function repoRoot() {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

function isPulseHook(path) {
  if (!existsSync(path)) return false;
  try {
    return readFileSync(path, "utf8").includes("Pulse — git pre-push hook");
  } catch {
    return false;
  }
}

function main() {
  if (!existsSync(PRE_PUSH_SOURCE)) {
    console.error(`Source hook missing: ${PRE_PUSH_SOURCE}`);
    process.exit(1);
  }

  const root = repoRoot();
  const hooksDir = resolve(root, ".git/hooks");
  mkdirSync(hooksDir, { recursive: true });
  const target = resolve(hooksDir, "pre-push");

  if (existsSync(target) && !isPulseHook(target)) {
    const backup = `${target}.pulse-backup-${Date.now()}`;
    renameSync(target, backup);
    console.log(`backed up existing pre-push hook → ${backup}`);
  } else if (existsSync(target)) {
    unlinkSync(target);
  }

  symlinkSync(PRE_PUSH_SOURCE, target);
  console.log(`installed pre-push → ${target} → ${PRE_PUSH_SOURCE}`);
  console.log("");
  console.log("  Bypass once with:  PULSE_SKIP_GUARD=1 git push");
  console.log("  Remove with:       rm .git/hooks/pre-push");
}

main();
