"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const Markdown = dynamic(() => import("@/components/Markdown").then((m) => m.Markdown), {
  ssr: false,
  loading: () => <div className="text-ink-faint text-[13px]">…</div>,
});

export type ChatBubble = {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  modelUsed?: string;
  tier?: number;
};

function shortModelName(id: string): string {
  // "deepseek/deepseek-chat-v3.1:free" -> "DeepSeek v3.1"
  const cleaned = id.replace(/:free$/, "");
  const slash = cleaned.indexOf("/");
  const bare = slash >= 0 ? cleaned.slice(slash + 1) : cleaned;
  // Take first 3 dash-joined tokens and Title-Case-ish them.
  return bare
    .split("-")
    .slice(0, 3)
    .map((p) => (p.length <= 2 ? p.toUpperCase() : p[0]!.toUpperCase() + p.slice(1)))
    .join(" ");
}

export function ChatMessage({ msg }: { msg: ChatBubble }) {
  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-end"
      >
        <div
          className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-card text-[14px] text-white"
          style={{
            background: "linear-gradient(135deg, var(--accent-1) 0%, var(--accent-3) 100%)",
            boxShadow: "0 6px 16px var(--accent-shadow)",
          }}
        >
          {msg.content}
        </div>
      </motion.div>
    );
  }

  if (msg.role === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-start"
      >
        <div className="max-w-[85%] sm:max-w-[75%] neu-card-soft p-3 text-[13px] text-ink-soft">
          {msg.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-start"
    >
      <div className="max-w-[88%] sm:max-w-[80%]">
        <div className="neu-pill-sunken px-4 py-3 text-[14px] text-ink">
          <Markdown content={msg.content} />
        </div>
        {msg.modelUsed && (
          <div className="mt-1 ml-3 text-[10px] text-ink-faint uppercase tracking-[0.16em] font-semibold">
            {shortModelName(msg.modelUsed)} · tier {msg.tier ?? "?"}
          </div>
        )}
      </div>
    </motion.div>
  );
}
