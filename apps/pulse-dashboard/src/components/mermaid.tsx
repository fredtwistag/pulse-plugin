"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Client-side Mermaid renderer. Lazily imports the mermaid bundle so it stays
 * out of the server / initial JS payload. Re-renders when `source` changes.
 *
 * Renders a unique id per instance to avoid mermaid's global svg cache colliding
 * when multiple diagrams appear on the same page.
 */
let idCounter = 0;

export function Mermaid({ source }: { source: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id] = useState(() => `mermaid-${++idCounter}-${Date.now().toString(36)}`);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        // Match dashboard theme. mermaid's "default" works well in both modes
        // because we feed CSS variables via themeVariables.
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "strict",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
        });
        const { svg } = await mermaid.render(id, source);
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, id]);

  if (error) {
    return (
      <div className="my-4 rounded border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-3 text-sm">
        <div className="font-medium text-[var(--color-danger)]">
          Mermaid render failed
        </div>
        <div className="mt-1 font-mono text-xs">{error}</div>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-[var(--color-muted)]">
            Source
          </summary>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs">
            {source}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
    />
  );
}
