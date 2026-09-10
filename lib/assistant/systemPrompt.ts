import type { DaybriefContext } from "./context";

/**
 * Builds the system prompt for the Daybrief AI assistant.
 *
 * Two modes share the same builder:
 *   - "aware":  a DaybriefContext is supplied; the assistant references it.
 *   - "pure":   no context; the assistant just chats.
 *
 * The assistant identifies as "Bikash Talukder" (per product naming).
 */
export function buildSystemPrompt(ctx: DaybriefContext | null): string {
  const identity = [
    "You are Bikash Talukder, an AI assistant built into Daybrief — a morning dashboard app.",
    "You are concise, warm, and helpful. Use short paragraphs and bullet lists when useful.",
    "Do not use emojis unless the user does first.",
    "When you cite a time, use the user's locale (Bangladesh / South Asia friendly: prefer 12-hour time with am/pm).",
    "Never invent data. If the Daybrief context block below is empty or missing fields, say so honestly.",
  ].join("\n");

  if (!ctx) {
    return `${identity}\n\nThe user has not loaded a Daybrief context. Answer from general knowledge only.`;
  }

  const lines: string[] = [identity, "", "--- Daybrief context (live, generated " + ctx.generatedAt + ") ---"];

  lines.push(`User: ${ctx.userName}`);

  if (ctx.location) {
    lines.push(`Location: ${ctx.location.label}`);
  } else {
    lines.push("Location: unknown (user has not set a city or granted geolocation)");
  }

  if (ctx.weather) {
    const w = ctx.weather;
    lines.push(
      `Weather: ${w.tempNow}°C now (${w.condition}), high ${w.high}° / low ${w.low}°`,
    );
  } else {
    lines.push("Weather: unavailable");
  }

  if (ctx.calendar) {
    if (ctx.calendar.events.length === 0) {
      lines.push(
        `Calendar (source=${ctx.calendar.source}): no events in the next 48 hours.`,
      );
    } else {
      const evs = ctx.calendar.events
        .map((e, i) => {
          const when = new Date(e.start).toLocaleString(undefined, {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
          });
          return `  ${i + 1}. ${when} — ${e.title}`;
        })
        .join("\n");
      lines.push(`Calendar (source=${ctx.calendar.source}, next 48h):\n${evs}`);
    }
  } else {
    lines.push("Calendar: not configured (user has not provided an ICS URL)");
  }

  if (ctx.alarms.length === 0) {
    lines.push("Alarms: none set");
  } else {
    const enabled = ctx.alarms.filter((a) => a.enabled);
    const list = ctx.alarms
      .map((a) => `  - ${a.time}${a.enabled ? "" : " (disabled)"}${a.label ? ` — ${a.label}` : ""}`)
      .join("\n");
    lines.push(`Alarms (${enabled.length}/${ctx.alarms.length} enabled):\n${list}`);
  }

  if (ctx.news.length === 0) {
    lines.push("News: no headlines available right now");
  } else {
    const headlines = ctx.news
      .slice(0, 5)
      .map((n, i) => `  ${i + 1}. [${n.source}] ${n.title}`)
      .join("\n");
    lines.push(`News (top 5):\n${headlines}`);
  }

  lines.push(
    "---",
    "If the user asks something that maps to one of the fields above, answer from it.",
    "If the user asks about something Daybrief can't know (e.g. real-time flight prices), say so.",
  );

  return lines.join("\n");
}
