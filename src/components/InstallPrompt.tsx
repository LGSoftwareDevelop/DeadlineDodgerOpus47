import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useStore } from "../store/useStore";
import { Mascot } from "./Mascot";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const dismissed = useStore((s) => s.settings.installPromptDismissed);
  const setSettings = useStore((s) => s.setSettings);
  const [evt, setEvt] = useState<BIPEvent | null>(null);

  useEffect(() => {
    if (dismissed) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () =>
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, [dismissed]);

  if (dismissed || !evt) return null;

  return (
    <div className="fixed left-3 right-3 bottom-24 z-40 max-w-md mx-auto card flex items-center gap-3 shadow-lg">
      <Mascot size={56} />
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold leading-tight">
          Install Deadline Dodger
        </p>
        <p className="text-xs text-ink-500 dark:text-ink-300">
          Faster, full-screen, works offline.
        </p>
      </div>
      <button
        type="button"
        className="btn-primary"
        onClick={async () => {
          await evt.prompt();
          await evt.userChoice;
          setEvt(null);
          setSettings({ installPromptDismissed: true });
        }}
      >
        <Download size={16} /> Install
      </button>
      <button
        type="button"
        className="text-ink-500 p-1"
        aria-label="Dismiss"
        onClick={() => setSettings({ installPromptDismissed: true })}
      >
        <X size={16} />
      </button>
    </div>
  );
}
