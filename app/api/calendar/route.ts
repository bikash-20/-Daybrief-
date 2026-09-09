import { NextRequest, NextResponse } from "next/server";
import ICAL from "ical.js";

export const revalidate = 900;

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  location?: string;
};

export type CalendarResponse =
  | { ok: true; source: string; events: CalendarEvent[] }
  | { ok: false; error: string };

const MAX_EVENTS = 5;
const HORIZON_HOURS = 48;

function isTimeLike(value: unknown): value is { toJSDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toJSDate?: unknown }).toJSDate === "function"
  );
}

function readDate(prop: ICAL.Property | null): Date | null {
  if (!prop) return null;
  const value = prop.getFirstValue();
  if (!isTimeLike(value)) return null;
  try {
    return value.toJSDate();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json<CalendarResponse>(
      { ok: false, error: "Missing ics url parameter." },
      { status: 400 },
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json<CalendarResponse>(
      { ok: false, error: "Invalid ICS URL." },
      { status: 400 },
    );
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json<CalendarResponse>(
      { ok: false, error: "ICS URL must be http(s)." },
      { status: 400 },
    );
  }

  try {
    const r = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Daybrief/1.0" },
      next: { revalidate: 900 },
    });
    if (!r.ok) throw new Error(`fetch ${r.status}`);
    const text = await r.text();
    const jcal = ICAL.parse(text);
    const comp = new ICAL.Component(jcal);
    const vevents = comp.getAllSubcomponents("vevent");

    const now = Date.now();
    const horizon = now + HORIZON_HOURS * 3600 * 1000;

    const events: CalendarEvent[] = [];
    for (let i = 0; i < vevents.length; i++) {
      const vev = vevents[i];
      const dtstart = vev.getFirstProperty("dtstart");
      const dtend = vev.getFirstProperty("dtend");
      const start = readDate(dtstart);
      const end = readDate(dtend) ?? start;
      if (!start || !end) continue;
      if (end.getTime() < now || start.getTime() > horizon) continue;

      const allDay = dtstart?.getParameter("value") === "date";

      events.push({
        id: `${i}-${start.toISOString()}`,
        title: vev.getFirstPropertyValue("summary")?.toString() ?? "Untitled event",
        start: start.toISOString(),
        end: end.toISOString(),
        allDay,
        location: vev.getFirstPropertyValue("location")?.toString() || undefined,
      });
    }

    events.sort((a, b) => +new Date(a.start) - +new Date(b.start));
    const body: CalendarResponse = {
      ok: true,
      source: parsed.host,
      events: events.slice(0, MAX_EVENTS),
    };
    return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=900" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "calendar fetch failed";
    return NextResponse.json<CalendarResponse>({ ok: false, error: message }, { status: 200 });
  }
}
