import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const revalidate = 900;

export type NewsItem = {
  source: string;
  title: string;
  link: string;
  snippet: string;
  publishedAt: string; // ISO
};

export type NewsResponse =
  | { ok: true; items: NewsItem[] }
  | { ok: false; error: string };

// Default feed list. Override with NEWS_FEEDS env var (JSON array of {name,url}).
const DEFAULT_FEEDS: Array<{ name: string; url: string }> = [
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "NPR Top", url: "https://feeds.npr.org/1001/rss.xml" },
  { name: "Reuters", url: "https://feeds.reuters.com/Reuters/worldNews" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
];

const MAX_ITEMS = 8;
const MAX_PER_FEED = 4;

function feedsFromEnv(): Array<{ name: string; url: string }> {
  const raw = process.env.NEWS_FEEDS;
  if (!raw) return DEFAULT_FEEDS;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_FEEDS;
    return parsed.filter(
      (f): f is { name: string; url: string } =>
        f && typeof f.name === "string" && typeof f.url === "string",
    );
  } catch {
    return DEFAULT_FEEDS;
  }
}

function snippet(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}\u2026`;
}

async function fetchFeed(
  parser: Parser,
  feed: { name: string; url: string },
): Promise<NewsItem[]> {
  const data = await parser.parseURL(feed.url);
  return data.items.slice(0, MAX_PER_FEED).map((it): NewsItem => {
    const dateStr = it.isoDate ?? it.pubDate ?? new Date().toISOString();
    return {
      source: feed.name,
      title: (it.title ?? "").trim() || "(untitled)",
      link: it.link ?? "",
      snippet: snippet(it.contentSnippet ?? it.content ?? ""),
      publishedAt: new Date(dateStr).toISOString(),
    };
  });
}

export async function GET() {
  const feeds = feedsFromEnv();
  const parser = new Parser({
    timeout: 8000,
    headers: { "User-Agent": "Daybrief/1.0" },
  });

  const results = await Promise.allSettled(feeds.map((f) => fetchFeed(parser, f)));
  const items: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") items.push(...r.value);
  }

  // Dedup by link, sort newest first.
  const seen = new Set<string>();
  const deduped = items
    .filter((it) => {
      const key = it.link || it.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, MAX_ITEMS);

  if (deduped.length === 0) {
    return NextResponse.json<NewsResponse>(
      { ok: false, error: "All feeds failed to load." },
      { status: 200 },
    );
  }
  return NextResponse.json<NewsResponse>(
    { ok: true, items: deduped },
    { headers: { "Cache-Control": "public, max-age=900" } },
  );
}
