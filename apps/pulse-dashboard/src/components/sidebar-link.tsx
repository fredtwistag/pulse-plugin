"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@/lib/cn";

export function SidebarLink({
  href,
  children,
  depth = 0,
}: {
  href: Route;
  children: React.ReactNode;
  depth?: 0 | 1 | 2 | 3;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  const indent =
    depth === 0
      ? "pl-3"
      : depth === 1
        ? "pl-6"
        : depth === 2
          ? "pl-9"
          : "pl-12";

  return (
    <Link
      href={href}
      className={cn(
        "block border-l border-transparent py-1 pr-3 text-sm",
        indent,
        active
          ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] font-medium text-[var(--color-accent)]"
          : "text-[var(--color-fg)] hover:bg-[var(--color-canvas-subtle)]",
      )}
    >
      {children}
    </Link>
  );
}
