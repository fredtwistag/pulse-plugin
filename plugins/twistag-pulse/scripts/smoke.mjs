#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
  } catch (err) {
    checks.push({ name, ok: false, err: err.message });
  }
}

check("plugin.json exists and parses", () => {
  const path = join(PLUGIN_ROOT, ".claude-plugin/plugin.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  if (!manifest.name || !manifest.version) throw new Error("missing name/version");
  if (manifest.name !== "twistag-pulse") throw new Error(`unexpected name: ${manifest.name}`);
});

check("skills/ contains at least one SKILL.md", () => {
  const skillsDir = join(PLUGIN_ROOT, "skills");
  if (!existsSync(skillsDir)) throw new Error("skills/ missing");
  const skills = readdirSync(skillsDir).filter((n) =>
    statSync(join(skillsDir, n)).isDirectory(),
  );
  if (skills.length === 0) throw new Error("no skills found");
  for (const skill of skills) {
    const skillFile = join(skillsDir, skill, "SKILL.md");
    if (!existsSync(skillFile)) throw new Error(`${skill}/SKILL.md missing`);
  }
});

check("commands/ contains at least one slash command", () => {
  const cmdDir = join(PLUGIN_ROOT, "commands");
  if (!existsSync(cmdDir)) throw new Error("commands/ missing");
  const cmds = readdirSync(cmdDir).filter((n) => n.endsWith(".md"));
  if (cmds.length === 0) throw new Error("no commands found");
});

check("templates/ contains state convention scaffolds", () => {
  const tplDir = join(PLUGIN_ROOT, "templates");
  if (!existsSync(tplDir)) throw new Error("templates/ missing");
  const required = ["epic.md", "feature.md", "task.md", "adr.md", "review.md", "config.yaml"];
  for (const f of required) {
    if (!existsSync(join(tplDir, f))) throw new Error(`templates/${f} missing`);
  }
});

check("agents/ contains the slice-2 guard sub-agents", () => {
  const agentsDir = join(PLUGIN_ROOT, "agents");
  if (!existsSync(agentsDir)) throw new Error("agents/ missing");
  const required = [
    "guard-spec-conformance.md",
    "guard-security-regression.md",
    "guard-convention-drift.md",
  ];
  for (const f of required) {
    if (!existsSync(join(agentsDir, f))) throw new Error(`agents/${f} missing`);
  }
});

check("hooks/pre-push.mjs exists and is executable", () => {
  const hookPath = join(PLUGIN_ROOT, "hooks/pre-push.mjs");
  if (!existsSync(hookPath)) throw new Error("hooks/pre-push.mjs missing");
  const stat = statSync(hookPath);
  // Owner-execute bit (0o100) — sufficient for git to invoke it.
  if ((stat.mode & 0o100) === 0) throw new Error("hooks/pre-push.mjs is not executable");
});

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  process.stdout.write(`${c.ok ? "  ok  " : " FAIL "} ${c.name}${c.ok ? "" : ` — ${c.err}`}\n`);
}
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} passed\n`);
process.exit(failed.length === 0 ? 0 : 1);
