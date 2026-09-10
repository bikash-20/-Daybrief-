"use client";

import { useEffect, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";

type Props = { content: string };

/**
 * Reads the active theme's color-scheme so code blocks pick the matching
 * Prism theme (dark vs light). Re-runs when the user changes themes.
 */
function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    function read() {
      const el = document.documentElement;
      const scheme = el.getAttribute("data-theme");
      // Pink Rose is the only light theme; everything else is dark.
      setIsDark(scheme !== "pink-rose");
    }
    read();
    window.addEventListener("daybrief:theme-change", read);
    return () => window.removeEventListener("daybrief:theme-change", read);
  }, []);
  return isDark;
}

function extractLanguage(className: string | undefined): string | null {
  if (!className) return null;
  const m = className.match(/language-([\w-]+)/);
  return m ? m[1] : null;
}

export function Markdown({ content }: Props) {
  const isDark = useIsDarkTheme();
  const codeTheme = isDark ? vscDarkPlus : vs;

  const components: Components = {
    code({ className, children, ...props }) {
      const text = String(children ?? "");
      // react-markdown v9 dropped the `inline` prop. Block code fences are
      // multi-line; inline code is single-line. Use that heuristic.
      const isBlock = text.includes("\n");
      if (!isBlock) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
      const lang = extractLanguage(className);
      return (
        <SyntaxHighlighter
          language={lang ?? "text"}
          style={codeTheme}
          customStyle={{
            margin: 0,
            padding: "0.8rem 0.9rem",
            background: "transparent",
            fontSize: "12.5px",
            lineHeight: 1.5,
            borderRadius: 14,
          }}
          wrapLongLines
        >
          {text.replace(/\n$/, "")}
        </SyntaxHighlighter>
      );
    },
    pre({ children }) {
      // SyntaxHighlighter already renders its own <pre>; just pass through.
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
  };

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
