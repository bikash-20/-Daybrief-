"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { NewsResponse } from "@/app/api/news/route";
import { formatRelativeNews } from "@/lib/format";
import { useHasHover } from "@/lib/useHasHover";

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
    return <div className="neu-card-soft h-[200px] animate-pulse" />;
  }

  if (state.status === "ok") {
    return <NewsList items={state.data.items} />;
  }

  if (state.cached) {
    return (
      <section aria-label="Top stories">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
            Top stories
          </h2>
          <span className="text-[12px] text-ink-faint italic">Offline · {state.message}</span>
        </div>
        <NewsList items={state.cached.items} hideTitle />
      </section>
    );
  }

  return (
    <motion.section
      whileTap={{ scale: 0.99 }}
      className="neu-card-soft p-5 text-[15px] text-ink-soft"
    >
      <p>News unavailable.</p>
      <p className="mt-1 text-[13px] text-ink-faint">{state.message}</p>
    </motion.section>
  );
}

function NewsList({
  items,
  hideTitle = false,
}: {
  items: Extract<NewsResponse, { ok: true }>["items"];
  hideTitle?: boolean;
}) {
  const hasHover = useHasHover();
  return (
    <section aria-label="Top stories">
      {!hideTitle && (
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
            Top stories
          </h2>
        </div>
      )}
      <div className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)]">
        {items.map((item, i) => (
          <motion.a
            key={`${item.link}-${i}`}
            href={item.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.98 }}
            whileHover={hasHover ? { y: -2 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="snap-start shrink-0 w-[78%] sm:w-[55%] lg:w-[40%] neu-card-soft card-pressable p-4 cursor-pointer"
          >
            <div className="text-[12px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
              {item.source}
            </div>
            <div className="mt-2 text-[16px] font-semibold leading-snug line-clamp-3 text-ink">
              {item.title}
            </div>
            {item.snippet && (
              <div className="mt-2 text-[14px] text-ink-soft line-clamp-2">{item.snippet}</div>
            )}
            <div className="mt-3 flex items-center justify-between text-[13px] text-ink-faint">
              <span>{formatRelativeNews(item.publishedAt)} ago</span>
              <span className="font-semibold text-ink-soft">Read →</span>
            </div>
          </motion.a>
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
