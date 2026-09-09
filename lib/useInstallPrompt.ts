"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function useInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  return {
    canInstall: !!evt,
    async promptInstall() {
      if (!evt) return false;
      await evt.prompt();
      const choice = await evt.userChoice;
      setEvt(null);
      return choice.outcome === "accepted";
    },
  };
}
