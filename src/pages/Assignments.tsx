import { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { AssignmentCard } from "../components/AssignmentCard";
import { AssignmentForm } from "../components/AssignmentForm";
import { CelebrationOverlay } from "../components/CelebrationOverlay";
import { EmptyState } from "../components/EmptyState";
import { QuickAddModal } from "../components/QuickAddModal";
import { isOverdue } from "../lib/date";
import { completionQuote } from "../lib/quotes";
import type { Assignment } from "../types";

type Filter = "all" | "active" | "completed" | "overdue";
type Sort = "due" | "class" | "added";

export function AssignmentsPage() {
  const assignments = useStore((s) => s.assignments);
  const classes = useStore((s) => s.classes);
  const snarkLevel = useStore((s) => s.settings.snarkLevel);

  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("due");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [celebrate, setCelebrate] = useState<{ open: boolean; quote: string }>({
    open: false,
    quote: "",
  });
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...assignments];
    if (filter === "active") list = list.filter((a) => !a.completed);
    if (filter === "completed") list = list.filter((a) => a.completed);
    if (filter === "overdue")
      list = list.filter((a) => isOverdue(a.dueDate, a.completed));
    if (sort === "due")
      list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    else if (sort === "class")
      list.sort((a, b) => (a.classId ?? "").localeCompare(b.classId ?? ""));
    else if (sort === "added")
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [assignments, filter, sort]);

  const isFormOpen = adding || editing;

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Homework</h1>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            All your assignments, due-first.
          </p>
        </div>
        {!isFormOpen && (
          <div className="flex gap-1.5">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setQuickAddOpen(true)}
            >
              <Sparkles size={16} /> Paste
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setAdding(true)}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        )}
      </header>

      {isFormOpen && (
        <div className="card">
          <h2 className="font-display font-semibold mb-3">
            {editing ? "Edit homework" : "New homework"}
          </h2>
          <AssignmentForm
            initial={editing ?? undefined}
            onSave={() => {
              setAdding(false);
              setEditing(null);
            }}
            onCancel={() => {
              setAdding(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {!isFormOpen && (
        <div className="flex flex-wrap gap-2">
          <FilterChips value={filter} onChange={setFilter} />
          <select
            className="input w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="due">Sort: Due date</option>
            <option value="class">Sort: Class</option>
            <option value="added">Sort: Recently added</option>
          </select>
        </div>
      )}

      {!isFormOpen && filtered.length === 0 ? (
        <EmptyState
          mood={assignments.length === 0 ? "happy" : "default"}
          title={
            assignments.length === 0
              ? "Nothing on the docket"
              : "Nothing matches that filter"
          }
          body={
            assignments.length === 0
              ? "No homework. Suspicious. Or glorious."
              : "Try a different filter or add something new."
          }
          action={
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add homework
            </button>
          }
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((a) => (
              <li key={a.id}>
                <AssignmentCard
                  assignment={a}
                  onEdit={(x) => {
                    setEditing(x);
                    setAdding(false);
                  }}
                  onComplete={() =>
                    setCelebrate({
                      open: true,
                      quote: completionQuote(snarkLevel),
                    })
                  }
                />
              </li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {classes.length === 0 && assignments.length === 0 && !isFormOpen && (
        <p className="text-xs text-center text-ink-500 dark:text-ink-300">
          Tip: Add your classes first so we can prompt you about them daily.
        </p>
      )}

      <CelebrationOverlay
        open={celebrate.open}
        quote={celebrate.quote}
        onClose={() => setCelebrate({ open: false, quote: "" })}
      />

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}

function FilterChips({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (f: Filter) => void;
}) {
  const opts: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "overdue", label: "Overdue" },
    { id: "completed", label: "Done" },
  ];
  return (
    <div className="flex gap-1.5">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`chip border transition ${
            value === o.id
              ? "bg-accent text-white border-accent"
              : "bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200 border-transparent"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
