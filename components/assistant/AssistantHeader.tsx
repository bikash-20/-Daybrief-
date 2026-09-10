"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function AssistantHeader() {
  const router = useRouter();
  return (
    <header className="px-4 sm:px-6 lg:px-8 pt-6 pb-3 flex items-center gap-3">
      <motion.button
        onClick={() => router.push("/")}
        aria-label="Back to Daybrief"
        whileTap={{ scale: 0.92 }}
        className="neu-pill h-11 w-11 grid place-items-center text-ink-soft shrink-0"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </motion.button>
      <div className="min-w-0">
        <div className="text-[12px] tracking-[0.22em] text-ink-faint font-semibold uppercase">
          AI assistant
        </div>
        <h1 className="mt-0.5 text-[22px] sm:text-[24px] font-bold leading-tight text-ink truncate">
          Bikash Talukder
        </h1>
      </div>
    </header>
  );
}
