export function relativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, Math.round((now - ts) / 1000));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.round(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function greeting(name: string, hour: number = new Date().getHours()): string {
  if (hour < 5) return `Up late, ${name}`;
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  if (hour < 22) return `Good evening, ${name}`;
  return `Up late, ${name}`;
}

const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatDate(d: Date): { day: string; full: string } {
  return {
    day: DAY_ABBR[d.getDay()],
    full: `${MONTH[d.getMonth()]} ${d.getDate()}`,
  };
}

export function formatTimeRange(startIso: string, endIso: string, allDay: boolean): string {
  if (allDay) return "All day";
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (x: Date) =>
    x.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} \u2013 ${fmt(end)}`;
}

export function formatRelativeNews(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
