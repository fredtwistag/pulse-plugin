import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export interface OpenApiEndpoint {
  method: string;
  path: string;
  summary?: string;
  tags: string[];
}

export interface OpenApiResult {
  source: string;
  title: string;
  version: string;
  endpoints: OpenApiEndpoint[];
}

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
]);

/**
 * Read an OpenAPI spec from any of the common locations. Supports YAML and
 * JSON. Returns null if not found. Lightweight — never instantiates a real
 * OpenAPI parser, just walks the parsed object.
 */
export function extractOpenApi(repoRoot: string): OpenApiResult | null {
  const candidates = [
    "openapi.yaml",
    "openapi.yml",
    "openapi.json",
    "docs/openapi.yaml",
    "api/openapi.yaml",
    "spec/openapi.yaml",
  ];
  for (const c of candidates) {
    const full = join(repoRoot, c);
    if (!existsSync(full)) continue;
    const raw = readFileSync(full, "utf8");
    try {
      const doc = c.endsWith(".json")
        ? JSON.parse(raw)
        : (parseYaml(raw) as Record<string, unknown>);
      return parseOpenApi(c, doc);
    } catch {
      return null;
    }
  }
  return null;
}

function parseOpenApi(
  source: string,
  doc: Record<string, unknown>,
): OpenApiResult {
  const info = (doc.info ?? {}) as Record<string, unknown>;
  const title = String(info.title ?? "API");
  const version = String(info.version ?? "");
  const paths = (doc.paths ?? {}) as Record<string, unknown>;
  const endpoints: OpenApiEndpoint[] = [];

  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== "object") continue;
    for (const [method, op] of Object.entries(
      methods as Record<string, unknown>,
    )) {
      if (!HTTP_METHODS.has(method)) continue;
      const opObj = (op ?? {}) as Record<string, unknown>;
      endpoints.push({
        method: method.toUpperCase(),
        path,
        summary: opObj.summary
          ? String(opObj.summary)
          : opObj.description
            ? String(opObj.description)
            : undefined,
        tags: Array.isArray(opObj.tags) ? (opObj.tags as string[]) : [],
      });
    }
  }

  endpoints.sort(
    (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
  );

  return { source, title, version, endpoints };
}

export function renderOpenApiMarkdown(result: OpenApiResult): string {
  if (result.endpoints.length === 0) {
    return `*Source: \`${result.source}\` — no endpoints parsed.*\n`;
  }
  let md = `*Source: \`${result.source}\`. Auto-extracted from \`${result.title}\` v${result.version}.*\n\n`;

  // Group by tag if any tags are present.
  const groups = new Map<string, OpenApiEndpoint[]>();
  for (const ep of result.endpoints) {
    const tag = ep.tags[0] ?? "(untagged)";
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag)!.push(ep);
  }

  for (const [tag, eps] of groups) {
    md += `## ${tag}\n\n`;
    md += "| Method | Path | Summary |\n|---|---|---|\n";
    for (const ep of eps) {
      md += `| \`${ep.method}\` | \`${ep.path}\` | ${ep.summary ?? ""} |\n`;
    }
    md += "\n";
  }

  return md;
}
