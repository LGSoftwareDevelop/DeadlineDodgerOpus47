import { motion } from "framer-motion";
import { Check, Pencil, Trash2, Link as LinkIcon, Paperclip } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store/useStore";
import { formatDueDate, isOverdue } from "../lib/date";
import type { Assignment } from "../types";
import { AttachmentPreview } from "./AttachmentPreview";

type Props = {
  assignment: Assignment;
  onEdit?: (a: Assignment) => void;
  onComplete?: () => void;
};

export function AssignmentCard({ assignment, onEdit, onComplete }: Props) {
  const classes = useStore((s) => s.classes);
  const toggleAssignment = useStore((s) => s.toggleAssignment);
  const removeAssignment = useStore((s) => s.removeAssignment);
  const [expanded, setExpanded] = useState(false);
  const cls = classes.find((c) => c.id === assignment.classId);
  const overdue = isOverdue(assignment.dueDate, assignment.completed);

  const onToggle = () => {
    const justCompleted = toggleAssignment(assignment.id);
    if (justCompleted && onComplete) onComplete();
  };

  const hasDetails =
    assignment.notes ||
    assignment.links.length > 0 ||
    assignment.attachments.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className={`card ${assignment.completed ? "opacity-60" : ""} ${
        overdue ? "ring-1 ring-rose-400" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={assignment.completed ? "Mark incomplete" : "Mark complete"}
          className={`mt-0.5 shrink-0 size-6 rounded-full border-2 flex items-center justify-center transition ${
            assignment.completed
              ? "bg-accent border-accent text-white"
              : "border-ink-300 dark:border-ink-500 hover:border-accent"
          }`}
        >
          {assignment.completed && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-medium leading-tight ${
                assignment.completed ? "line-through" : ""
              }`}
            >
              {assignment.title}
            </h3>
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(assignment)}
                  className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100 p-1"
                  aria-label="Edit"
                >
                  <Pencil size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${assignment.title}"?`)) {
                    removeAssignment(assignment.id);
                  }
                }}
                className="text-ink-500 hover:text-rose-500 p-1"
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {cls && (
              <span
                className="chip"
                style={{
                  backgroundColor: cls.color + "33",
                  color: cls.color,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: cls.color }}
                />
                {cls.name}
              </span>
            )}
            <span
              className={`chip ${
                overdue
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                  : "bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200"
              }`}
            >
              {formatDueDate(assignment.dueDate)}
            </span>
            {assignment.links.length > 0 && (
              <span className="chip bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200">
                <LinkIcon size={11} /> {assignment.links.length}
              </span>
            )}
            {assignment.attachments.length > 0 && (
              <span className="chip bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200">
                <Paperclip size={11} /> {assignment.attachments.length}
              </span>
            )}
          </div>

          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs text-accent hover:underline"
            >
              {expanded ? "Hide details" : "Show details"}
            </button>
          )}

          {expanded && hasDetails && (
            <div className="mt-2 space-y-2">
              {assignment.notes && (
                <p className="text-sm whitespace-pre-wrap text-ink-700 dark:text-ink-200">
                  {assignment.notes}
                </p>
              )}
              {assignment.links.length > 0 && (
                <ul className="space-y-1">
                  {assignment.links.map((l, i) => (
                    <li key={i} className="text-sm">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline inline-flex items-center gap-1"
                      >
                        <LinkIcon size={12} />
                        {l.label || l.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {assignment.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignment.attachments.map((a) => (
                    <AttachmentPreview key={a.id} attachment={a} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
