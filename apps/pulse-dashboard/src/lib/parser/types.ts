export type ArtifactType =
  | "epic"
  | "feature"
  | "task"
  | "adr"
  | "review"
  | "override"
  | "unknown";

export type ArtifactStatus =
  | "draft"
  | "active"
  | "shipped"
  | "archived"
  | "proposed"
  | "accepted"
  | "superseded";

export interface Frontmatter {
  id?: string;
  type?: ArtifactType;
  status?: ArtifactStatus;
  owners?: string[];
  created?: string;
  updated?: string;
  acceptance?: string[];
  links?: {
    parent?: string | null;
    adr?: string[];
    related?: string[];
    supersedes?: string | null;
    "superseded-by"?: string | null;
  };
  artifacts?: Record<string, string>;
  // Additional free-form fields are allowed.
  [k: string]: unknown;
}

export interface Artifact {
  /** Absolute filesystem path. */
  path: string;
  /** Path relative to the artifacts root (e.g. `epics/foo/spec.md`). */
  relPath: string;
  frontmatter: Frontmatter;
  body: string;
}

export interface ArtifactTree {
  /** Flat list of every artifact found. */
  artifacts: Artifact[];
  /** Errors encountered (missing frontmatter, unparseable YAML, etc). */
  errors: { path: string; message: string }[];
}
