import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface TailwindToken {
  name: string;
  value: string;
}

export interface TailwindResult {
  source: string;
  tokens: TailwindToken[];
}

/**
 * Extract design tokens from a Tailwind v4 project. v4 ships with the
 * CSS-first config: tokens live inside `@theme { … }` blocks in CSS
 * files. We scan for those rather than parsing a JS config — TS configs
 * would require a TS toolchain inside the dashboard.
 *
 * Returns null if no `@theme` block is found. Hand-authored narrative
 * still renders; the auto section just hides.
 */
export function extractTailwind(repoRoot: string): TailwindResult | null {
  const cssCandidates = findCssFiles(repoRoot, 3, 50);
  let source: string | null = null;
  let tokens: TailwindToken[] = [];

  for (const rel of cssCandidates) {
    const raw = readFileSync(join(repoRoot, rel), "utf8");
    const parsed = parseThemeBlocks(raw);
    if (parsed.length > 0) {
      source = rel;
      tokens = parsed;
      break;
    }
  }

  if (!source) return null;
  return { source, tokens };
}

function findCssFiles(
  root: string,
  maxDepth: number,
  maxFiles: number,
): string[] {
  const out: string[] = [];
  const stack: { dir: string; depth: number }[] = [{ dir: root, depth: 0 }];
  while (stack.length && out.length < maxFiles) {
    const { dir, depth } = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.startsWith(".") || e === "node_modules" || e === ".next") continue;
      const full = join(dir, e);
      let s;
      try {
        s = statSync(full);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        if (depth < maxDepth) stack.push({ dir: full, depth: depth + 1 });
        continue;
      }
      if (e.endsWith(".css")) {
        out.push(full.slice(root.length + 1));
      }
    }
  }
  return out;
}

const THEME_BLOCK_RE = /@theme\s*\{([\s\S]*?)\}/g;
const TOKEN_RE = /^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gm;

function parseThemeBlocks(css: string): TailwindToken[] {
  const tokens: TailwindToken[] = [];
  const seen = new Set<string>();
  let block: RegExpExecArray | null;
  while ((block = THEME_BLOCK_RE.exec(css)) !== null) {
    const body = block[1];
    let tok: RegExpExecArray | null;
    while ((tok = TOKEN_RE.exec(body)) !== null) {
      const name = tok[1];
      const value = tok[2].trim();
      if (seen.has(name)) continue;
      seen.add(name);
      tokens.push({ name, value });
    }
  }
  return tokens;
}

export function renderTailwindMarkdown(result: TailwindResult): string {
  if (result.tokens.length === 0) {
    return `*Source: \`${result.source}\` — no tokens parsed.*\n`;
  }

  // Group by prefix (color-*, font-*, spacing-*, etc.) for readability.
  const groups = new Map<string, TailwindToken[]>();
  for (const t of result.tokens) {
    const slug = t.name.replace(/^--/, "");
    const prefix = slug.split("-")[0] || "other";
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push(t);
  }

  let md = `*Source: \`${result.source}\`. Auto-extracted from \`@theme\` blocks.*\n\n`;

  for (const [prefix, ts] of [...groups.entries()].sort()) {
    md += `## ${prefix}\n\n`;
    md += "| Token | Value |\n|---|---|\n";
    for (const t of ts) {
      md += `| \`${t.name}\` | \`${t.value}\` |\n`;
    }
    md += "\n";
  }

  return md;
}
