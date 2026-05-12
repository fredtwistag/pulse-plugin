import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractPrisma,
  renderPrismaMarkdown,
  type PrismaResult,
} from "./prisma";
import {
  extractOpenApi,
  renderOpenApiMarkdown,
  type OpenApiResult,
} from "./openapi";
import {
  extractTailwind,
  renderTailwindMarkdown,
  type TailwindResult,
} from "./tailwind";

export type { PrismaResult, OpenApiResult, TailwindResult };

/**
 * Per-kind generated content. `auto` is the markdown produced by the
 * extractor (empty string if no source was found). `manual` is the
 * hand-authored narrative from docs/pulse/<kind>.md (empty string if
 * the file doesn't exist). The dashboard route renders manual first
 * — that's the prose context — then auto, which is the canonical
 * machine-extracted facts.
 */
export interface GeneratedSection {
  kind: "db" | "api" | "design";
  manual: string;
  auto: string;
  sourceLabel: string | null; // e.g. "prisma/schema.prisma"
}

export interface Generated {
  db: GeneratedSection;
  api: GeneratedSection;
  design: GeneratedSection;
}

function readManual(repoRoot: string, slug: string): string {
  const path = join(repoRoot, "docs/pulse", `${slug}.md`);
  if (!existsSync(path)) return "";
  const raw = readFileSync(path, "utf8");
  // Strip a leading YAML frontmatter block if present — these top-level
  // narrative files are rendered inline; no frontmatter needed.
  if (raw.startsWith("---\n")) {
    const end = raw.indexOf("\n---", 4);
    if (end !== -1) return raw.slice(end + 4).replace(/^\n+/, "");
  }
  return raw;
}

export function loadGenerated(repoRoot: string): Generated {
  const prisma = extractPrisma(repoRoot);
  const openapi = extractOpenApi(repoRoot);
  const tailwind = extractTailwind(repoRoot);

  return {
    db: {
      kind: "db",
      manual: readManual(repoRoot, "db"),
      auto: prisma ? renderPrismaMarkdown(prisma) : "",
      sourceLabel: prisma?.source ?? null,
    },
    api: {
      kind: "api",
      manual: readManual(repoRoot, "api"),
      auto: openapi ? renderOpenApiMarkdown(openapi) : "",
      sourceLabel: openapi?.source ?? null,
    },
    design: {
      kind: "design",
      manual: readManual(repoRoot, "design"),
      auto: tailwind ? renderTailwindMarkdown(tailwind) : "",
      sourceLabel: tailwind?.source ?? null,
    },
  };
}
