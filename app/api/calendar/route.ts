// Supports TWO calendar sources, in priority order:
//   1. ?url=<ics-url>  — a per-visitor calendar URL (from Settings, stored client-side)
//   2. process.env.ICS_FEED_URL — the app owner's fixed fallback calendar
//
// This lets the app work out-of-the-box (fixed calendar) while also letting
// each visitor plug in their own calendar without redeploying anything.

import { NextRequest, NextResponse } from "next/server";
import ical, { type VEvent } from "node-ical";

export const revalidate = 600;

function normalizeUrl(raw: string): string {
  // webcal:// isn't fetchable directly — swap it for https://
  return raw.startsWith("webcal://") ? raw.replace("webcal://", "https://") : raw;
}

function paramValueToString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "val" in v && typeof (v as { val: unknown }).val === "string") {
    return (v as { val: string }).val;
  }
  return "";
}

export async function GET(req: NextRequest) {
  const userUrlRaw = req.nextUrl.searchParams.get("url");
  const userUrl = userUrlRaw ? normalizeUrl(userUrlRaw.trim()) : null;
  const feedUrl = userUrl ?? process.env.ICS_FEED_URL;
  const source: "user" | "default" | "none" = userUrl
    ? "user"
    : process.env.ICS_FEED_URL
      ? "default"
      : "none";

  if (!feedUrl) {
    return NextResponse.json({ configured: false, source: "none", events: [] });
  }

  if (!feedUrl.startsWith("http://") && !feedUrl.startsWith("https://")) {
    return NextResponse.json(
      { configured: false, source: "none", error: "Invalid calendar URL" },
      { status: 400 },
    );
  }

  try {
    const data = await ical.async.fromURL(feedUrl);

    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const events = Object.values(data)
      .filter((item): item is VEvent => item?.type === "VEVENT")
      .map((item) => {
        const start = item.start;
        const end = item.end;
        if (!start || !end) return null;
        return { title: paramValueToString(item.summary), start, end };
      })
      .filter(
        (e): e is { title: string; start: Date; end: Date } =>
          e !== null && e.start >= now && e.start <= in48h,
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 5)
      .map((e) => ({
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
      }));

    return NextResponse.json({ configured: true, source, events });
  } catch {
    return NextResponse.json(
      { configured: true, source, events: [], error: "Failed to parse calendar feed" },
      { status: 502 },
    );
  }
}
