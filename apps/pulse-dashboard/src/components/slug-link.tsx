import Link from "next/link";
import { loadView } from "@/lib/load";
import { resolveLink } from "@/lib/resolve-link";

/**
 * Renders a frontmatter slug. If it maps to a known artifact, becomes a Link;
 * otherwise renders the slug as plain text so dangling references don't break
 * the page.
 */
export function SlugLink({ slug }: { slug: string }) {
  const { view } = loadView();
  const href = resolveLink(view, slug);
  if (!href) {
    return (
      <span title="unresolved link" className="text-[var(--color-muted)]">
        {slug}
      </span>
    );
  }
  return (
    <Link href={href} className="hover:underline">
      {slug}
    </Link>
  );
}

export function SlugLinkList({
  slugs,
  separator = ", ",
}: {
  slugs: string[];
  separator?: string;
}) {
  return (
    <>
      {slugs.map((s, i) => (
        <span key={s}>
          {i > 0 && separator}
          <SlugLink slug={s} />
        </span>
      ))}
    </>
  );
}
