import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mermaid } from "./mermaid";

/**
 * GFM markdown renderer with:
 *  - Mermaid for ```mermaid``` fenced blocks
 *  - GitHub-grade typography (system font, generous line-height)
 *  - Header anchors via plain ids (slug from the raw text)
 */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose-pulse">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { className, children, ...rest } = props;
            const language = /language-(\w+)/.exec(className ?? "")?.[1];
            const value = String(children).replace(/\n$/, "");

            if (language === "mermaid") {
              return <Mermaid source={value} />;
            }

            // react-markdown 9: `inline` is gone; detect by absence of language and no newline.
            const isInline = !language && !value.includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded bg-[var(--color-canvas-subtle)] px-1 py-0.5 text-[0.875em]"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-4 overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] p-4 text-sm">
                <code className={className} {...rest}>
                  {children}
                </code>
              </pre>
            );
          },
          a(props) {
            const { href, children, ...rest } = props;
            return (
              <a href={href} {...rest}>
                {children}
              </a>
            );
          },
          table(props) {
            return (
              <div className="my-4 overflow-x-auto">
                <table
                  className="w-full border-collapse text-sm"
                  {...props}
                />
              </div>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
