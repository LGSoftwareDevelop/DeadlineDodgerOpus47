import { Mascot } from "./Mascot";
import type { ReactNode } from "react";

type Props = {
  title: string;
  body?: string;
  mood?: "default" | "happy" | "tired";
  action?: ReactNode;
};

export function EmptyState({ title, body, mood = "default", action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <Mascot size={120} mood={mood} />
      <h3 className="mt-4 text-lg font-display font-semibold">{title}</h3>
      {body && (
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300 max-w-xs">
          {body}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
