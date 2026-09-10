"use client";

import { lazy, Suspense, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

// KaTeX CSS is only used inside assistant replies, so we keep it co-located
// with the markdown renderer. It joins the /assistant chunk via the dynamic
// ChatMessage import, and is dropped entirely for users on /.
import "katex/dist/katex.min.css";

/**
 * Senior-grade markdown renderer for assistant replies.
 *
 * Pipeline:
 *   react-markdown → remark-gfm → remark-math
 *                 → rehype-raw → rehype-katex
 *                 → custom renderers
 *
 * Code blocks: highlight-loader is async-imported *only* when a code block
 * actually appears in the message. Until then, the user sees a styled <pre>;
 * the Prism bundle (~200KB) is never loaded for short replies without code.
 *
 * KaTeX CSS is loaded globally (in layout) so math is rendered immediately.
 */
type Props = { content: string };

// Code highlighter is split out so the Prism grammar + style bundles
// stay out of the initial /assistant chunk. Loaded only when needed.
const CodeBlock = lazy(() =>
  import("./CodeBlock").then((m) => ({ default: m.CodeBlock })),
);

export function Markdown({ content }: Props) {
  const components = useMemo<Components>(
    () => ({
      code(props) {
        const { className, children, ...rest } = props;
        const text = String(children ?? "");
        const isBlock = text.includes("\n");
        if (!isBlock) {
          return (
            <code className={className} {...rest}>
              {children}
            </code>
          );
        }
        return (
          <Suspense
            fallback={
              <pre className="md-code md-code--plain">
                <code>{text.replace(/\n$/, "")}</code>
              </pre>
            }
          >
            <CodeBlock className={className} text={text} />
          </Suspense>
        );
      },
      pre({ children }) {
        // CodeBlock renders its own <pre>; pass through.
        return <>{children}</>;
      },
      a({ href, children, ...props }) {
        const external = typeof href === "string" && /^https?:\/\//.test(href);
        return (
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            {...props}
          >
            {children}
          </a>
        );
      },
    }),
    [],
  );

  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
