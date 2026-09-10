"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// Light Prism stylesheet — only needed if a code block ever appears.
// Stays inside the lazy chunk so the home route never pays this cost.
import "prismjs/themes/prism.css";

type Props = { className?: string; text: string };

/**
 * Lazy-loaded code block. Loaded only when a reply actually contains
 * fenced code. Imports Prism + ONE theme + ONE language grammar on demand
 * — no barrel-style imports, so the assistant route stays small.
 *
 * Highlighter reads the active theme from `<html data-theme>` to pick
 * dark or light tokens; the actual colors are applied via CSS variables
 * (see globals.css `.md-code`) so they recolor live when the user
 * switches themes — no re-render needed.
 */

const LANG_MAP: Record<string, string> = {
  javascript: "javascript",
  js: "javascript",
  jsx: "jsx",
  typescript: "typescript",
  ts: "typescript",
  tsx: "tsx",
  python: "python",
  py: "python",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  html: "markup",
  css: "css",
  markdown: "markdown",
  md: "markdown",
  sql: "sql",
  go: "go",
  rust: "rust",
  rs: "rust",
  swift: "swift",
  kotlin: "kotlin",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  cs: "csharp",
  ruby: "ruby",
  php: "php",
};

export function CodeBlock({ className, text }: Props) {
  const lang = extractLanguage(className);
  const code = text.replace(/\n$/, "");
  const isLight = useIsLightTheme();

  // Load the grammar once for this language; subsequent renders reuse.
  useEffect(() => {
    if (!lang) return;
    loadLanguage(lang).catch(() => {
      /* unknown language — render plain */
    });
  }, [lang]);

  if (!lang) {
    return (
      <pre className="md-code md-code--plain">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <SyntaxHighlighter
      language={LANG_MAP[lang] ?? lang}
      className={`md-code md-code--hl ${isLight ? "is-light" : "is-dark"}`}
      showLineNumbers={false}
      wrapLongLines
    >
      {code}
    </SyntaxHighlighter>
  );
}

// ----- dynamic language grammar loader -----
//
// prismjs ships ~290 language files; we only import the ones the user
// actually sees. Each chunk is <5KB, loaded once and cached.

const loaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();

async function loadLanguage(lang: string): Promise<void> {
  const target = LANG_MAP[lang];
  if (!target || loaded.has(target)) return;
  if (inflight.has(target)) return inflight.get(target);

  let p: Promise<void>;
  try {
    p = import(/* webpackChunkName: "prism-[request]" */ `prismjs/components/prism-${target}.js`)
      .then(() => {
        loaded.add(target);
      })
      .catch(() => {
        /* grammar unavailable — fall back to plain */
      });
  } catch {
    p = Promise.resolve();
  }
  inflight.set(target, p);
  await p;
  inflight.delete(target);
}

function extractLanguage(className: string | undefined): string | null {
  if (!className) return null;
  const m = className.match(/language-([\w-]+)/);
  return m ? m[1].toLowerCase() : null;
}

function useIsLightTheme(): boolean {
  const [isLight, setIsLight] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.getAttribute("data-theme") === "pink-rose";
  });
  useEffect(() => {
    function read() {
      setIsLight(document.documentElement.getAttribute("data-theme") === "pink-rose");
    }
    read();
    window.addEventListener("daybrief:theme-change", read);
    return () => window.removeEventListener("daybrief:theme-change", read);
  }, []);
  return isLight;
}
