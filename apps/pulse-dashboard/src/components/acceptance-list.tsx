/**
 * Renders the `acceptance:` frontmatter list. Each item is presented as an
 * unchecked checkbox in v1 — pulse-code will toggle them to `[x]` in
 * Markdown when criteria pass (Slice 3).
 *
 * If an item starts with `[x] ` or `[ ] ` we honor the marker.
 */
export function AcceptanceList({ items }: { items: unknown }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <ul className="space-y-2">
      {items.map((raw, i) => {
        const s = String(raw);
        const checked = s.startsWith("[x] ") || s.startsWith("[X] ");
        const label = s
          .replace(/^\[[ xX]\]\s+/, "")
          .replace(/^\[\s*\]\s+/, "");
        return (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span
              aria-hidden
              className={
                "mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border " +
                (checked
                  ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-bg)]")
              }
            >
              {checked ? (
                <svg
                  viewBox="0 0 16 16"
                  width="10"
                  height="10"
                  fill="currentColor"
                >
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
              ) : null}
            </span>
            <span className={checked ? "text-[var(--color-muted)]" : ""}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
