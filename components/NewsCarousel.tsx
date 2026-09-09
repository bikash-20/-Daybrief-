"use client";

import { useEffect, useState } from "react";
import type { NewsResponse } from "@/app/api/news/route";
import { formatRelativeNews } from "@/lib/format";

type Props = { refreshKey: number };

const CACHE_KEY = "daybrief.news.v1";

export function NewsCarousel({ refreshKey }: Props) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ok"; data: Extract<NewsResponse, { ok: true }> }
    | { status: "error"; message: string; cached?: Extract<NewsResponse, { ok: true }> }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const cached = readCache();
    fetch("/api/news")
      .then((r) => r.json() as Promise<NewsResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          writeCache(data);
          setState({ status: "ok", data });
        } else {
          setState({ status: "error", message: data.error, cached: cached ?? undefined });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Network error",
          cached: cached ?? undefined,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (state.status === "loading") {
    const cached = readCache();
    if (cached) return <NewsList items={cached.items} />;
    return <div className="rounded-card bg-white/5 border border-white/10 h-[180px] animate-pulse" />;
  }

  if (state.status === "ok") {
    return <NewsList items={state.data.items} />;
  }

  if (state.cached) {
    return (
      <div>
        <div className="text-[11px] text-white/55 px-1 mb-2">Offline · {state.message}</div>
        <NewsList items={state.cached.items} />
      </div>
    );
  }

  return (
    <div className="rounded-card bg-white/5 border border-white/10 px-5 py-5 text-sm text-white/70">
      News unavailable. {state.message}
    </div>
  );
}

function NewsList({ items }: { items: Extract<NewsResponse, { ok: true }>["items"] }) {
  return (
    <section aria-label="Top stories">
      <div className="flex items-baseline justify-between px-1 mb-2">
        <h2 className="text-[13px] uppercase tracking-[0.16em] text-white/60">Top stories</h2>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5">
        {items.map((item, i) => (
          <a
            key={`${item.link}-${i}`}
            href={item.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="snap-start shrink-0 w-[78%] sm:w-[60%] rounded-card bg-white/5 border border-white/10 px-5 py-4 hover:bg-white/8 transition"
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">{item.source}</div>
            <div className="mt-2 text-[15px] font-semibold leading-snug line-clamp-3">
              {item.title}
            </div>
            {item.snippet && (
              <div className="mt-2 text-[12px] text-white/65 line-clamp-2">{item.snippet}</div>
            )}
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/55">
              <span>{formatRelativeNews(item.publishedAt)} ago</span>
              <span className="font-medium text-white/75">Read →</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function readCache(): Extract<NewsResponse, { ok: true }> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data: Extract<NewsResponse, { ok: true }>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}
