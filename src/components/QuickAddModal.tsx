import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { parseHomeworkText, type ParsedAssignment } from "../lib/quickAdd";
import { formatDueDate } from "../lib/date";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultText?: string;
};

const LOADING_LINES = [
  "Decoding teen shorthand…",
  "Negotiating with deadlines…",
  "Translating panic into plans…",
  "Counting fingers on the calendar…",
  "Begging the model for valid JSON…",
];

export function QuickAddModal({ open, onClose, defaultText }: Props) {
  const classes = useStore((s) => s.classes);
  const schedule = useStore((s) => s.schedule);
  const addAssignment = useStore((s) => s.addAssignment);

  const [text, setText] = useState(defaultText ?? "");
  const [busy, setBusy] = useState(false);
  const [loadingLine] = useState(
    () => LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)],
  );
  const [items, setItems] = useState<ParsedAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setText(defaultText ?? "");
    setItems(null);
    setError(null);
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    const res = await parseHomeworkText(text, classes, schedule);
    setBusy(false);
    if (!res.ok) {
      setError(friendlyError(res.error, res.message));
      return;
    }
    if (res.assignments.length === 0) {
      setError("The model couldn't find any homework in that. Try rewording?");
      return;
    }
    setItems(res.assignments);
  };

  const commit = () => {
    if (!items) return;
    for (const a of items) {
      addAssignment({
        title: a.title,
        classId: a.classId ?? undefined,
        dueDate: a.dueDate,
        notes: a.notes ?? undefined,
      });
    }
    handleClose();
  };

  const updateItem = (idx: number, patch: Partial<ParsedAssignment>) => {
    setItems((prev) => prev?.map((it, i) => (i === idx ? { ...it, ...patch } : it)) ?? null);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev?.filter((_, i) => i !== idx) ?? null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-ink-900/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="card w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <Sparkles size={20} className="text-accent" />
                  Quick add
                </h2>
                <p className="text-xs text-ink-500 dark:text-ink-300 mt-0.5">
                  {items
                    ? "Review what we got. Edit anything, then add them all."
                    : "Type or paste what you got today — any shorthand."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100 p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {!items && (
              <>
                <textarea
                  className="input min-h-[120px] font-mono text-sm"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`e.g. "chem reading ch 4 wed, math wks fri, history outline mon"`}
                  autoFocus
                  disabled={busy}
                />
                {error && (
                  <div className="mt-2 text-sm text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="btn-primary flex-1"
                    onClick={submit}
                    disabled={busy || !text.trim()}
                  >
                    {busy ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {loadingLine}
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Parse it
                      </>
                    )}
                  </button>
                  <button type="button" className="btn-ghost" onClick={handleClose}>
                    Cancel
                  </button>
                </div>
                <p className="mt-3 text-[10px] text-ink-500 dark:text-ink-300">
                  Sent to OpenRouter through our server. Your API key stays
                  server-side. Attachments and other notes aren't included.
                </p>
              </>
            )}

            {items && (
              <>
                <ul className="space-y-3">
                  {items.map((a, i) => (
                    <ReviewItem
                      key={i}
                      item={a}
                      onChange={(patch) => updateItem(i, patch)}
                      onRemove={() => removeItem(i)}
                      classes={classes}
                    />
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="btn-primary flex-1"
                    onClick={commit}
                    disabled={items.length === 0}
                  >
                    Add {items.length === 1 ? "it" : `all ${items.length}`}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setItems(null)}
                  >
                    Re-do
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReviewItem({
  item,
  onChange,
  onRemove,
  classes,
}: {
  item: ParsedAssignment;
  onChange: (patch: Partial<ParsedAssignment>) => void;
  onRemove: () => void;
  classes: ReturnType<typeof useStore.getState>["classes"];
}) {
  const confColor =
    item.confidence >= 0.85
      ? "text-emerald-500"
      : item.confidence >= 0.6
      ? "text-amber-500"
      : "text-rose-500";

  return (
    <li className="rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-900 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <input
          className="input flex-1 font-medium"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <button
          type="button"
          className="text-ink-500 hover:text-rose-500 p-1 shrink-0"
          onClick={onRemove}
          aria-label="Discard"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          className="input text-sm"
          value={item.classId ?? ""}
          onChange={(e) => onChange({ classId: e.target.value || null })}
        >
          <option value="">
            {item.classNameGuess ? `— ${item.classNameGuess}? —` : "— No class —"}
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="input text-sm"
          value={item.dueDate}
          onChange={(e) => onChange({ dueDate: e.target.value })}
        />
      </div>
      {item.notes !== null && item.notes !== undefined && (
        <input
          className="input text-xs"
          value={item.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value || null })}
          placeholder="Notes"
        />
      )}
      <div className="flex items-center justify-between text-[11px] text-ink-500 dark:text-ink-300">
        <span>{formatDueDate(item.dueDate)}</span>
        <span className={confColor}>
          {Math.round(item.confidence * 100)}% confident
        </span>
      </div>
    </li>
  );
}

function friendlyError(code: string, message?: string): string {
  switch (code) {
    case "not_configured":
      return "AI parsing isn't set up yet. The OpenRouter key hasn't been added on the server.";
    case "rate_limited":
      return "Slow down. Try again in a minute.";
    case "forbidden":
      return "This request was blocked.";
    case "too_large":
    case "text_too_long":
      return "That's too long — try splitting it into chunks.";
    case "upstream":
      return message
        ? `OpenRouter says: ${message}`
        : "The model service hiccupped. Try again.";
    case "no_content":
    case "bad_model_output":
      return "The model returned something unparseable. Try rewording.";
    case "network":
      return message ?? "Couldn't reach the parser.";
    default:
      return message ?? `Something went wrong (${code}).`;
  }
}
