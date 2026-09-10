"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { motion } from "framer-motion";

type Props = {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setText("");
    // Reset textarea height after clearing.
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = "auto";
    });
    await onSend(trimmed);
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  function autoResize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }

  function onSubmitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submit();
  }

  return (
    <form
      onSubmit={onSubmitForm}
      className="flex items-end gap-2"
    >
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          autoResize();
        }}
        onKeyDown={onKey}
        rows={1}
        disabled={disabled}
        placeholder={placeholder ?? "Ask Bikash…"}
        className="flex-1 neu-sunken px-4 py-3 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none resize-none leading-snug"
      />
      <motion.button
        type="submit"
        disabled={disabled || text.trim().length === 0}
        whileTap={{ scale: 0.94 }}
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="neu-pill h-11 w-11 grid place-items-center text-white disabled:opacity-40 shrink-0"
        style={{
          background:
            text.trim().length > 0
              ? "linear-gradient(135deg, var(--accent-1) 0%, var(--accent-3) 100%)"
              : "var(--card)",
        }}
        aria-label="Send"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M22 2L11 13" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </motion.button>
    </form>
  );
}
