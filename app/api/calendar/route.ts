// Requires: ICS_FEED_URL in .env.local — a public .ics link (Google Calendar
// > Settings > "Secret address in iCal format", or any public calendar export).
import { NextResponse } from "next/server";
import ical, { type VEvent } from "node-ical";

export const revalidate = 600;

function paramValueToString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "val" in v && typeof (v as { val: unknown }).val === "string") {
    return (v as { val: string }).val;
  }
  return "";
}

export async function GET() {
  const feedUrl = process.env.ICS_FEED_URL;
  if (!feedUrl) {
    return NextResponse.json({ configured: false, events: [] });
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
      .filter((e): e is { title: string; start: Date; end: Date } => e !== null && e.start >= now && e.start <= in48h)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 5)
      .map((e) => ({
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
      }));

    return NextResponse.json({ configured: true, events });
  } catch {
    return NextResponse.json(
      { configured: true, events: [], error: "Failed to parse calendar feed" },
      { status: 502 },
    );
  }
}
