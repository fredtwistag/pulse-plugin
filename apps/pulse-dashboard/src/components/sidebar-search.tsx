"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SidebarSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = q.trim();
        router.push(
          trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search",
        );
      }}
      className="px-6"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-sm focus:border-[var(--color-accent)] focus:outline-none"
      />
    </form>
  );
}
