import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface PrismaField {
  name: string;
  type: string;
  attributes: string[];
}

export interface PrismaModel {
  name: string;
  fields: PrismaField[];
  attributes: string[];
}

export interface PrismaResult {
  source: string;
  models: PrismaModel[];
}

/**
 * Lightweight Prisma schema parser — no @prisma/sdk dependency. Reads
 * `prisma/schema.prisma` from the configured repo root, extracts model
 * blocks (name + fields + per-field attributes), and emits a structured
 * result the dashboard turns into Markdown.
 *
 * Out of scope (acceptable for v1): generators/datasource blocks, enum
 * blocks, multi-file schemas. If the source uses any of those, the
 * dashboard just shows what it could parse and notes the file's existence.
 */
export function extractPrisma(repoRoot: string): PrismaResult | null {
  const candidates = [
    "prisma/schema.prisma",
    "schema.prisma",
    "db/schema.prisma",
  ];
  let source: string | null = null;
  let path: string | null = null;
  for (const c of candidates) {
    const full = join(repoRoot, c);
    if (existsSync(full)) {
      source = readFileSync(full, "utf8");
      path = c;
      break;
    }
  }
  if (!source || !path) return null;

  const models: PrismaModel[] = [];
  const modelRe = /^model\s+(\w+)\s*\{([^}]*)\}/gm;
  let m: RegExpExecArray | null;
  while ((m = modelRe.exec(source)) !== null) {
    const name = m[1];
    const body = m[2];
    const fields: PrismaField[] = [];
    const modelAttrs: string[] = [];

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//")) continue;
      if (line.startsWith("@@")) {
        modelAttrs.push(line);
        continue;
      }
      // field: `name Type? attr1 attr2 ...`
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      const [fname, ftype, ...attrs] = parts;
      fields.push({ name: fname, type: ftype, attributes: attrs });
    }

    models.push({ name, fields, attributes: modelAttrs });
  }

  return { source: path, models };
}

/**
 * Render the parsed schema to markdown — one section per model with a
 * field table, plus an ER-style Mermaid summary if there are 2+ models
 * with foreign-key relations (heuristic: a field's type matches another
 * model name).
 */
export function renderPrismaMarkdown(result: PrismaResult): string {
  if (result.models.length === 0) {
    return `*Source: \`${result.source}\` — no models parsed.*\n`;
  }

  const modelNames = new Set(result.models.map((m) => m.name));
  const relations: { from: string; to: string; field: string }[] = [];
  for (const model of result.models) {
    for (const field of model.fields) {
      const target = field.type.replace(/[\[\]?]/g, "");
      if (target !== model.name && modelNames.has(target)) {
        relations.push({ from: model.name, to: target, field: field.name });
      }
    }
  }

  let md = `*Source: \`${result.source}\`. Auto-extracted; do not edit. To revise the schema, edit the Prisma file and refresh the dashboard.*\n\n`;

  if (relations.length >= 1) {
    md += "## Relations (auto)\n\n```mermaid\nerDiagram\n";
    for (const model of result.models) {
      md += `  ${model.name} {\n`;
      for (const field of model.fields.slice(0, 8)) {
        const type = field.type.replace(/[\[\]?]/g, "");
        md += `    ${type} ${field.name}\n`;
      }
      md += "  }\n";
    }
    for (const r of relations) {
      md += `  ${r.from} ||--o{ ${r.to} : ${r.field}\n`;
    }
    md += "```\n\n";
  }

  for (const model of result.models) {
    md += `## ${model.name}\n\n`;
    if (model.fields.length > 0) {
      md += "| Field | Type | Attributes |\n|---|---|---|\n";
      for (const field of model.fields) {
        const attrs = field.attributes.length
          ? "`" + field.attributes.join("` `") + "`"
          : "";
        md += `| \`${field.name}\` | \`${field.type}\` | ${attrs} |\n`;
      }
      md += "\n";
    }
    if (model.attributes.length > 0) {
      md += "Model-level: " + model.attributes.map((a) => `\`${a}\``).join(", ") + "\n\n";
    }
  }

  return md;
}
