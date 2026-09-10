"use client";

import { useEffect, useState } from "react";

type Props = { size?: number };

/**
 * Decorative analog clock. Pure SVG, no images. Sized to fit as a stat-pill
 * accent.
 *
 * Performance: the second hand sweeps via a single CSS animation (no JS per
 * frame). The minute hand and hour hand re-render only once per minute —
 * the JS re-render is offset to the next minute boundary so the hand lands
 * exactly on the right tick.
 */
export function AnalogClock({ size = 96 }: Props) {
  // We re-render the minute/hour hands once a minute; the second hand is a
  // CSS animation, so we don't need a per-second render at all.
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const offset = 60_000 - (Date.now() % 60_000);
    const initial = window.setTimeout(() => {
      setTime(new Date());
      const interval = window.setInterval(() => setTime(new Date()), 60_000);
      // Cleanup for the interval is handled when the timeout fires; this
      // ref pattern lets the outer cleanup cancel whichever is active.
      (cleanupRef as { current: () => void }).current = () => window.clearInterval(interval);
    }, offset);
    const cleanupRef = { current: () => window.clearTimeout(initial) };
    return () => cleanupRef.current();
  }, []);

  if (!time) {
    return <div style={{ width: size, height: size }} className="neu-pill-sunken" />;
  }

  const ms = time.getMilliseconds();
  const s = time.getSeconds() + ms / 1000;
  const m = time.getMinutes() + s / 60;
  const h = (time.getHours() % 12) + m / 60;

  const cx = 50;
  const cy = 50;
  const tickMarks = Array.from({ length: 12 });

  return (
    <div
      className="neu-pill-sunken grid place-items-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size - 12} height={size - 12} viewBox="0 0 100 100">
        {tickMarks.map((_, i) => {
          const angle = (i / 12) * 360;
          return (
            <line
              key={i}
              x1={cx}
              y1="6"
              x2={cx}
              y2={i % 3 === 0 ? "12" : "9"}
              stroke="var(--text-faint)"
              strokeWidth={i % 3 === 0 ? 1.6 : 0.8}
              strokeLinecap="round"
              transform={`rotate(${angle} ${cx} ${cy})`}
            />
          );
        })}
        {/* Hour hand */}
        <g style={{ transformOrigin: `${cx}% ${cy}%`, transform: `rotate(${h * 30}deg)` }}>
          <line x1={cx} y1={cy} x2={cx} y2="26" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
        </g>
        {/* Minute hand */}
        <g style={{ transformOrigin: `${cx}% ${cy}%`, transform: `rotate(${m * 6}deg)` }}>
          <line x1={cx} y1={cy} x2={cx} y2="16" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Second hand — pure CSS rotation, 60s linear loop. */}
        <g className="clock-second-hand">
          <line x1={cx} y1={cy + 6} x2={cx} y2="20" stroke="var(--accent-3)" strokeWidth="1" strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r="2.5" fill="var(--accent-3)" />
      </svg>
    </div>
  );
}
