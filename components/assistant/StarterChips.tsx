"use client";

import { motion } from "framer-motion";

const STARTERS: ReadonlyArray<string> = [
  "What's my day look like?",
  "Summarize the top 3 headlines",
  "Plan a 10-min morning routine before my first meeting",
  "What should I wear based on the weather?",
];

export function StarterChips({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="flex flex-wrap gap-2"
    >
      {STARTERS.map((s) => (
        <motion.button
          key={s}
          onClick={() => onPick(s)}
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="neu-pill px-4 py-2 text-[12px] text-ink-soft hover:text-ink text-left"
        >
          {s}
        </motion.button>
      ))}
    </motion.div>
  );
}
