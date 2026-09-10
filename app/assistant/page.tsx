"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AssistantHeader } from "@/components/assistant/AssistantHeader";
import { ChatInput } from "@/components/assistant/ChatInput";
import { ChatMessage, type ChatBubble } from "@/components/assistant/ChatMessage";
import { StarterChips } from "@/components/assistant/StarterChips";
import { loadAssistantContext, type DaybriefContext } from "@/lib/assistant/context";
import { useVisualViewport } from "@/lib/useVisualViewport";

const HISTORY_KEY = "daybrief:assistant-history";
const MAX_HISTORY_MESSAGES = 30;

type PersistedMsg = { id: string; role: ChatBubble["role"]; content: string; modelUsed?: string; tier?: number };

function loadHistory(): ChatBubble[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedMsg[];
    return parsed.slice(-MAX_HISTORY_MESSAGES);
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatBubble[]) {
  if (typeof window === "undefined") return;
  try {
    const slim: PersistedMsg[] = messages
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ id: m.id, role: m.role, content: m.content, modelUsed: m.modelUsed, tier: m.tier }));
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(slim));
  } catch {
    /* quota — drop silently */
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [context, setContext] = useState<DaybriefContext | null>(null);
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const [inputBarHeight, setInputBarHeight] = useState(76); // gradient + input
  const { keyboardHeight } = useVisualViewport();

  useEffect(() => {
    setMessages(loadHistory());
    setHydrated(true);
    loadAssistantContext()
      .then(setContext)
      .catch(() => setContext(null));
  }, []);

  useEffect(() => {
    if (hydrated) saveHistory(messages);
  }, [messages, hydrated]);

  // Track the input bar's measured height so the scroll region can pad to it.
  // ResizeObserver keeps us honest when the textarea grows multi-line.
  useEffect(() => {
    const el = inputBarRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setInputBarHeight(el.offsetHeight);
    });
    ro.observe(el);
    setInputBarHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  const send = useCallback(
    async (text: string) => {
      if (sending) return;
      const userMsg: ChatBubble = { id: newId(), role: "user", content: text };
      const next: ChatBubble[] = [...messages, userMsg];
      setMessages(next);
      setSending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => ({ role: m.role, content: m.content })),
            context,
          }),
        });
        const data: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errText =
            (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string")
              ? (data as { error: string }).error
              : `Request failed (${res.status})`;
          setMessages((prev) => [
            ...prev,
            { id: newId(), role: "error", content: errText },
          ]);
        } else if (
          data &&
          typeof data === "object" &&
          "content" in data &&
          typeof (data as { content: unknown }).content === "string"
        ) {
          const ok = data as { content: string; modelUsed?: string; tier?: number };
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: "assistant",
              content: ok.content,
              modelUsed: ok.modelUsed,
              tier: ok.tier,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { id: newId(), role: "error", content: "Unexpected response shape" },
          ]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setMessages((prev) => [...prev, { id: newId(), role: "error", content: msg }]);
      } finally {
        setSending(false);
      }
    },
    [sending, messages, context],
  );

  const empty = messages.length === 0;

  return (
    <main
      className="mx-auto w-full max-w-2xl lg:max-w-3xl flex flex-col px-4 sm:px-6 lg:px-8 pt-[env(safe-area-inset-top)]"
      style={{ height: "100dvh" }}
    >
      <AssistantHeader />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mt-2 space-y-3 overscroll-contain"
        style={{ paddingBottom: inputBarHeight }}
        aria-live="polite"
      >
        {empty ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="pt-6"
          >
            <p className="text-[15px] text-ink-soft mb-4 leading-relaxed">
              Hi, I&apos;m Bikash — your Daybrief assistant. I can read your weather,
              calendar, alarms, and headlines when they&apos;re available. Ask me anything.
            </p>
            <StarterChips onPick={(p) => void send(p)} />
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <ChatMessage key={m.id} msg={m} />
            ))}
            {sending && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="neu-pill-sunken px-4 py-3 flex gap-1">
                  <Dot delay={0} />
                  <Dot delay={0.15} />
                  <Dot delay={0.3} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/*
        The input bar is fixed at the bottom of the viewport and rides
        above the on-screen keyboard by `keyboardHeight` px. When the
        keyboard is closed, the safe-area-inset-bottom takes over.

        We use a transform (not bottom:) so the bar's gradient + children
        animate together without a layout shift on the page. The gradient
        is fixed-height (~80px) so multi-line textarea growth doesn't
        shove it off-screen.
      */}
      <div
        ref={inputBarRef}
        className="fixed inset-x-0 z-40 px-4 sm:px-6 lg:px-8 pt-3 pb-4 bg-gradient-to-t from-bg via-bg/95 to-transparent"
        style={{
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
          transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : undefined,
          transition: "transform 120ms ease-out",
        }}
      >
        <div className="mx-auto w-full max-w-2xl lg:max-w-3xl">
          <ChatInput onSend={send} disabled={sending} placeholder="Ask Bikash…" />
        </div>
      </div>
    </main>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay }}
      className="inline-block w-1.5 h-1.5 rounded-full bg-ink-soft"
    />
  );
}
