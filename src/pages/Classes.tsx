import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { EmptyState } from "../components/EmptyState";
import type { Class } from "../types";

const CLASS_COLORS = [
  "#a78bfa",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
  "#f97316",
];

export function ClassesPage() {
  const classes = useStore((s) => s.classes);
  const cycleDays = useStore((s) => s.schedule.cycleDays);
  const removeClass = useStore((s) => s.removeClass);

  const [editing, setEditing] = useState<Class | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Classes</h1>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            Tell us your classes and which cycle days they meet on.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
        >
          <Plus size={16} /> Add
        </button>
      </header>

      {adding || editing ? (
        <ClassForm
          initial={editing ?? undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      ) : null}

      {classes.length === 0 && !adding ? (
        <EmptyState
          mood="default"
          title="No classes yet"
          body="Add your classes so we can prompt you about homework each day they meet."
          action={
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add your first class
            </button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {classes.map((c) => (
            <li key={c.id} className="card flex items-start gap-3">
              <span
                className="mt-1 size-3.5 rounded-full shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{c.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(c)}
                      className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100 p-1"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete class "${c.name}"?`)) removeClass(c.id);
                      }}
                      className="text-ink-500 hover:text-rose-500 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {(c.teacher || c.room) && (
                  <p className="text-sm text-ink-500 dark:text-ink-300">
                    {[c.teacher, c.room].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.meetsOnCycleDayIds.length === 0 && (
                    <span className="chip bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-300">
                      No days set
                    </span>
                  )}
                  {c.meetsOnCycleDayIds.map((id) => {
                    const cd = cycleDays.find((d) => d.id === id);
                    if (!cd) return null;
                    return (
                      <span
                        key={id}
                        className="chip"
                        style={{
                          backgroundColor: cd.color + "33",
                          color: cd.color,
                        }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: cd.color }}
                        />
                        {cd.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClassForm({
  initial,
  onClose,
}: {
  initial?: Class;
  onClose: () => void;
}) {
  const cycleDays = useStore((s) => s.schedule.cycleDays);
  const addClass = useStore((s) => s.addClass);
  const updateClass = useStore((s) => s.updateClass);

  const [name, setName] = useState(initial?.name ?? "");
  const [teacher, setTeacher] = useState(initial?.teacher ?? "");
  const [room, setRoom] = useState(initial?.room ?? "");
  const [color, setColor] = useState(initial?.color ?? CLASS_COLORS[0]);
  const [meetsOn, setMeetsOn] = useState<string[]>(
    initial?.meetsOnCycleDayIds ?? [],
  );

  const toggleDay = (id: string) => {
    setMeetsOn((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (initial) {
      updateClass(initial.id, {
        name: name.trim(),
        teacher: teacher.trim() || undefined,
        room: room.trim() || undefined,
        color,
        meetsOnCycleDayIds: meetsOn,
      });
    } else {
      addClass({
        name: name.trim(),
        teacher: teacher.trim() || undefined,
        room: room.trim() || undefined,
        color,
        meetsOnCycleDayIds: meetsOn,
      });
    }
    onClose();
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h3 className="font-display font-semibold">
        {initial ? "Edit class" : "New class"}
      </h3>
      <div>
        <label className="label">Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., AP Biology"
          autoFocus
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Teacher</label>
          <input
            className="input"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            placeholder="optional"
          />
        </div>
        <div>
          <label className="label">Room</label>
          <input
            className="input"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="optional"
          />
        </div>
      </div>

      <div>
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-1.5">
          {CLASS_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`size-7 rounded-lg ring-1 ring-black/10 ${
                color === c ? "ring-2 ring-offset-2 ring-accent" : ""
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="size-7 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="label">Meets on</label>
        {cycleDays.length === 0 ? (
          <p className="text-xs text-ink-500 dark:text-ink-300">
            Add cycle days in Settings → Schedule first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {cycleDays.map((cd) => {
              const active = meetsOn.includes(cd.id);
              return (
                <button
                  key={cd.id}
                  type="button"
                  onClick={() => toggleDay(cd.id)}
                  className={`chip transition border ${
                    active
                      ? "text-white"
                      : "bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-300 border-transparent"
                  }`}
                  style={
                    active
                      ? { backgroundColor: cd.color, borderColor: cd.color }
                      : undefined
                  }
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: cd.color }}
                  />
                  {cd.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1">
          {initial ? "Save" : "Add class"}
        </button>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
