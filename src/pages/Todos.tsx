import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { EmptyState } from "../components/EmptyState";

export function TodosPage() {
  const todos = useStore((s) => s.todos);
  const addTodo = useStore((s) => s.addTodo);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const removeTodo = useStore((s) => s.removeTodo);
  const updateTodo = useStore((s) => s.updateTodo);
  const [text, setText] = useState("");

  const sorted = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.order - b.order;
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    addTodo(t);
    setText("");
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold">Todos</h1>
        <p className="text-sm text-ink-500 dark:text-ink-300">
          Anything else rattling around in your brain.
        </p>
      </header>

      <form onSubmit={submit} className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Add a todo…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Add
        </button>
      </form>

      {todos.length === 0 ? (
        <EmptyState
          mood="happy"
          title="A clear list"
          body="The brain-dump is empty. Or… you forgot to write something. Either way."
        />
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {sorted.map((t) => (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="card flex items-center gap-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => toggleTodo(t.id)}
                  className={`shrink-0 size-6 rounded-full border-2 flex items-center justify-center ${
                    t.completed
                      ? "bg-accent border-accent text-white"
                      : "border-ink-300 dark:border-ink-500 hover:border-accent"
                  }`}
                  aria-label={t.completed ? "Uncomplete" : "Complete"}
                >
                  {t.completed && <Check size={14} strokeWidth={3} />}
                </button>
                <input
                  className={`flex-1 bg-transparent outline-none text-sm ${
                    t.completed ? "line-through opacity-60" : ""
                  }`}
                  value={t.text}
                  onChange={(e) => updateTodo(t.id, { text: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeTodo(t.id)}
                  className="text-ink-500 hover:text-rose-500 p-1"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
