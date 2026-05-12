import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export type CheckId =
  | "spec-conformance"
  | "security-regression"
  | "convention-drift"
  | "anti-pattern-repetition"
  | "performance-pitfalls"
  | "test-integrity"
  | "dependency-hygiene"
  | "data-api-safety";

export type CheckVerdict = "pass" | "warning" | "fail" | "overridden";
export type OverallVerdict = CheckVerdict;

export interface ReviewRecord {
  id: string;
  sha: string;
  shortSha: string;
  base: string;
  engineer: string;
  created: string;
  verdicts: Partial<Record<CheckId, CheckVerdict>>;
  overall: OverallVerdict;
  body: string;
  path: string;
}

const SHORT_SHA_LEN = 7;

/**
 * Read every `.pulse/reviews/*.md` file. Each file is markdown + frontmatter
 * per the `review.md` template. Missing fields default to safe sentinels so
 * the dashboard renders incomplete reviews instead of crashing.
 */
export function loadReviews(reviewsDir: string): ReviewRecord[] {
  if (!existsSync(reviewsDir)) return [];

  const entries = readdirSync(reviewsDir).filter((f) => f.endsWith(".md"));
  const reviews: ReviewRecord[] = [];

  for (const entry of entries) {
    const full = join(reviewsDir, entry);
    try {
      const raw = readFileSync(full, "utf8");
      const { data, content } = matter(raw);
      const fm = data as Record<string, unknown>;
      const sha = String(fm.sha ?? entry.replace(/\.md$/, ""));
      reviews.push({
        id: String(fm.id ?? `review-${sha.slice(0, SHORT_SHA_LEN)}`),
        sha,
        shortSha: sha.slice(0, SHORT_SHA_LEN),
        base: String(fm.base ?? "main"),
        engineer: String(fm.engineer ?? "unknown"),
        created: String(fm.created ?? ""),
        verdicts:
          (fm.verdicts as Partial<Record<CheckId, CheckVerdict>>) ?? {},
        overall: (fm.overall as OverallVerdict) ?? "pass",
        body: content,
        path: full,
      });
    } catch {
      // Skip unparseable review files; loadView's tree.errors covers docs/pulse.
      // Reviews are best-effort.
    }
  }

  // Newest first.
  reviews.sort((a, b) => b.created.localeCompare(a.created));
  return reviews;
}

/**
 * Find the most recent review for a given sha (full or short).
 */
export function findReviewBySha(
  reviews: ReviewRecord[],
  shaPart: string,
): ReviewRecord | undefined {
  return reviews.find((r) => r.sha === shaPart || r.shortSha === shaPart);
}
