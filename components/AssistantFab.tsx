"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function AssistantFab() {
  const router = useRouter();
  return (
    <motion.button
      onClick={() => router.push("/assistant")}
      aria-label="Open assistant"
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="neu-pill h-12 w-12 grid place-items-center text-white z-50"
      style={{
        background: "linear-gradient(135deg, var(--accent-1) 0%, var(--accent-3) 100%)",
        boxShadow: "0 8px 18px var(--accent-shadow)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </motion.button>
  );
}
