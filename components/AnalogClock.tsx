"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = { size?: number };

/**
 * Decorative analog clock. Hands update every 30s via state + interval.
 * Pure SVG, no images. Sized to fit as a stat-pill accent.
 */
export function AnalogClock({ size = 96 }: Props) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = window.setInterval(() => setTime(new Date()), 30_000);
    return () => window.clearInterval(id);
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

  return (
    <div
      className="neu-pill-sunken grid place-items-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size - 12} height={size - 12} viewBox="0 0 100 100">
        {/* Tick marks */}
        {Array.from({ length: 12 }).map((_, i) => {
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
        <motion.g
          style={{ originX: "50%", originY: "50%" }}
          animate={{ rotate: h * 30 }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        >
          <line x1={cx} y1={cy} x2={cx} y2="26" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
        {/* Minute hand */}
        <motion.g
          style={{ originX: "50%", originY: "50%" }}
          animate={{ rotate: m * 6 }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        >
          <line x1={cx} y1={cy} x2={cx} y2="16" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
        {/* Second hand */}
        <motion.g
          style={{ originX: "50%", originY: "50%" }}
          animate={{ rotate: s * 6 }}
          transition={{ type: "tween", ease: "linear", duration: 0 }}
        >
          <line x1={cx} y1={cy + 6} x2={cx} y2="20" stroke="var(--accent-3)" strokeWidth="1" strokeLinecap="round" />
        </motion.g>
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="2.5" fill="var(--accent-3)" />
      </svg>
    </div>
  );
}
