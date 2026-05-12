import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import matter from "gray-matter";
import type { Artifact, ArtifactTree, Frontmatter } from "./types";

/**
 * Walk an artifacts root (typically `docs/pulse`) and parse every `*.md`
 * file's frontmatter + body. Skips `_generated/` for now — slice 6 builds
 * the auto-extractors that populate that directory.
 */
export function walkArtifacts(root: string): ArtifactTree {
  const artifacts: Artifact[] = [];
  const errors: ArtifactTree["errors"] = [];

  if (!existsSync(root)) {
    errors.push({ path: root, message: "artifacts root not found" });
    return { artifacts, errors };
  }

  const stack: string[] = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch (err) {
      errors.push({ path: dir, message: `readdir failed: ${(err as Error).message}` });
      continue;
    }
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "_generated") continue;
      const full = join(dir, entry);
      let s;
      try {
        s = statSync(full);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.endsWith(".md")) continue;
      try {
        const raw = readFileSync(full, "utf8");
        const { data, content } = matter(raw);
        artifacts.push({
          path: full,
          relPath: relative(root, full),
          frontmatter: data as Frontmatter,
          body: content,
        });
      } catch (err) {
        errors.push({
          path: full,
          message: `parse failed: ${(err as Error).message}`,
        });
      }
    }
  }

  artifacts.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return { artifacts, errors };
}
