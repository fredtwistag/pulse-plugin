import { existsSync, readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import type { CheckId } from "./reviews";

export interface OverrideEntry {
  sha: string;
  shortSha: string;
  base: string;
  engineer: string;
  check: CheckId | string;
  reason: string;
  secondEngineer?: string;
  created: string;
}

/**
 * `.pulse/overrides.log.md` is a markdown file. Each override entry is a
 * single fenced ```yaml``` block. Headers and prose between blocks are
 * decorative; only the yaml blocks are parsed.
 *
 * Example block:
 *
 *   ```yaml
 *   sha: abc123def456
 *   base: main
 *   engineer: fred
 *   check: security-regression
 *   reason: "approved by joao for hotfix window"
 *   second_engineer: joao
 *   created: 2026-05-12T10:00:00Z
 *   ```
 */
const YAML_BLOCK_RE = /```yaml\n([\s\S]*?)\n```/g;

export function loadOverrides(logPath: string): OverrideEntry[] {
  if (!existsSync(logPath)) return [];
  const raw = readFileSync(logPath, "utf8");
  const entries: OverrideEntry[] = [];

  let match: RegExpExecArray | null;
  while ((match = YAML_BLOCK_RE.exec(raw)) !== null) {
    try {
      const obj = parseYaml(match[1]) as Record<string, unknown> | null;
      if (!obj || typeof obj !== "object") continue;
      const sha = String(obj.sha ?? "");
      if (!sha) continue;
      entries.push({
        sha,
        shortSha: sha.slice(0, 7),
        base: String(obj.base ?? "main"),
        engineer: String(obj.engineer ?? "unknown"),
        check: String(obj.check ?? "unknown"),
        reason: String(obj.reason ?? ""),
        secondEngineer: obj.second_engineer
          ? String(obj.second_engineer)
          : undefined,
        created: String(obj.created ?? ""),
      });
    } catch {
      // Skip malformed blocks. Slice 4's tuning pass will surface these.
    }
  }

  entries.sort((a, b) => b.created.localeCompare(a.created));
  return entries;
}
