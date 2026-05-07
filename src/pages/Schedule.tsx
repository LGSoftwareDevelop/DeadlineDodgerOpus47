import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useStore } from "../store/useStore";
import { todayISO, prettyDate } from "../lib/date";
import { cycleDayForDate } from "../lib/cycle";
import type { CycleDay } from "../types";

const PRESET_COLORS = [
  "#22c55e", // green
  "#eab308", // gold
  "#3b82f6", // blue
  "#ef4444", // red
  "#a855f7", // purple
  "#f97316", // orange
  "#14b8a6", // teal
  "#ec4899", // pink
];

export function SchedulePage() {
  const schedule = useStore((s) => s.schedule);
  const addCycleDay = useStore((s) => s.addCycleDay);
  const updateCycleDay = useStore((s) => s.updateCycleDay);
  const removeCycleDay = useStore((s) => s.removeCycleDay);
  const setAnchor = useStore((s) => s.setAnchor);
  const toggleHoliday = useStore((s) => s.toggleHoliday);
  const setOverride = useStore((s) => s.setOverride);
  const removeOverride = useStore((s) => s.removeOverride);
  const setSkipWeekends = useStore((s) => s.setSkipWeekends);

  const [newDayLabel, setNewDayLabel] = useState("");
  const [newDayColor, setNewDayColor] = useState(PRESET_COLORS[2]);
  const [newHoliday, setNewHoliday] = useState("");
  const [overrideDate, setOverrideDate] = useState(todayISO());
  const [overrideCycleDay, setOverrideCycleDay] = useState<string>("");

  const today = todayISO();
  const todaysCycleDay = cycleDayForDate(today, schedule);
  const todaysCycleDayLabel = todaysCycleDay
    ? schedule.cycleDays.find((c) => c.id === todaysCycleDay)?.label
    : "No school today";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Schedule</h1>
        <p className="text-sm text-ink-500 dark:text-ink-300">
          Set up your rotating cycle days and tell the app today's day.
        </p>
      </header>

      <section className="card">
        <h2 className="font-display font-semibold mb-2">Today is…</h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
          Right now we think today is <strong>{todaysCycleDayLabel}</strong>.
          If that's wrong, fix the anchor below.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Anchor date</label>
            <input
              type="date"
              className="input"
              value={schedule.anchorDate}
              onChange={(e) => setAnchor(e.target.value, schedule.anchorCycleDayId)}
            />
          </div>
          <div>
            <label className="label">…was a</label>
            <select
              className="input"
              value={schedule.anchorCycleDayId}
              onChange={(e) => setAnchor(schedule.anchorDate, e.target.value)}
            >
              {schedule.cycleDays.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-500 dark:text-ink-300">
          Tip: set the anchor to today and pick whatever day school says it is.
          From there the app rotates one cycle-day per school day.
        </p>
      </section>

      <section className="card">
        <h2 className="font-display font-semibold mb-2">Cycle days</h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
          Add as many as your school uses. Common: Green/Gold, A/B, or
          Red/White/Blue.
        </p>
        <ul className="space-y-2">
          {schedule.cycleDays.map((c) => (
            <CycleDayRow
              key={c.id}
              day={c}
              onUpdate={(patch) => updateCycleDay(c.id, patch)}
              onRemove={() => {
                if (schedule.cycleDays.length === 1) {
                  alert("You need at least one cycle day.");
                  return;
                }
                if (confirm(`Remove ${c.label}? Classes that meet on this day will lose this slot.`)) {
                  removeCycleDay(c.id);
                }
              }}
            />
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            className="input flex-1 min-w-[140px]"
            placeholder="New day name (e.g., Blue Day)"
            value={newDayLabel}
            onChange={(e) => setNewDayLabel(e.target.value)}
          />
          <ColorSwatchPicker value={newDayColor} onChange={setNewDayColor} />
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              const name = newDayLabel.trim();
              if (!name) return;
              addCycleDay(name, newDayColor);
              setNewDayLabel("");
            }}
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="font-display font-semibold mb-2">Days off</h2>
        <label className="flex items-center gap-2 text-sm mb-3">
          <input
            type="checkbox"
            checked={schedule.skipWeekends}
            onChange={(e) => setSkipWeekends(e.target.checked)}
            className="size-4"
          />
          Skip weekends (Sat/Sun)
        </label>

        <div className="flex gap-2 mb-2">
          <input
            type="date"
            className="input flex-1"
            value={newHoliday}
            onChange={(e) => setNewHoliday(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (!newHoliday) return;
              toggleHoliday(newHoliday);
              setNewHoliday("");
            }}
          >
            <Plus size={16} /> Holiday
          </button>
        </div>
        {schedule.holidays.length > 0 && (
          <ul className="space-y-1">
            {schedule.holidays.map((d) => (
              <li
                key={d}
                className="flex items-center justify-between bg-ink-100 dark:bg-ink-700 rounded-lg px-3 py-1.5 text-sm"
              >
                <span>{prettyDate(d)}</span>
                <button
                  type="button"
                  onClick={() => toggleHoliday(d)}
                  className="text-ink-500 hover:text-rose-500"
                  aria-label="Remove holiday"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="font-display font-semibold mb-2">Manual overrides</h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
          Snow day pushed Green to Gold? Force a specific date here.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="date"
            className="input"
            value={overrideDate}
            onChange={(e) => setOverrideDate(e.target.value)}
          />
          <select
            className="input"
            value={overrideCycleDay}
            onChange={(e) => setOverrideCycleDay(e.target.value)}
          >
            <option value="">Pick a day…</option>
            {schedule.cycleDays.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
            <option value="__no_school__">— No school —</option>
          </select>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            if (!overrideDate || !overrideCycleDay) return;
            if (overrideCycleDay === "__no_school__") {
              setOverride(overrideDate, null);
            } else {
              setOverride(overrideDate, overrideCycleDay);
            }
            setOverrideCycleDay("");
          }}
        >
          Set override
        </button>
        {Object.keys(schedule.overrides).length > 0 && (
          <ul className="mt-3 space-y-1">
            {Object.entries(schedule.overrides)
              .sort()
              .map(([date, dayId]) => {
                const cd = schedule.cycleDays.find((c) => c.id === dayId);
                return (
                  <li
                    key={date}
                    className="flex items-center justify-between bg-ink-100 dark:bg-ink-700 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <span>
                      {prettyDate(date)} →{" "}
                      <strong>{cd ? cd.label : "No school"}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeOverride(date)}
                      className="text-ink-500 hover:text-rose-500"
                    >
                      <X size={16} />
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </div>
  );
}

function CycleDayRow({
  day,
  onUpdate,
  onRemove,
}: {
  day: CycleDay;
  onUpdate: (patch: Partial<CycleDay>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-2">
      <ColorSwatchPicker
        value={day.color}
        onChange={(color) => onUpdate({ color })}
      />
      <input
        className="input flex-1"
        value={day.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-ink-500 hover:text-rose-500"
        aria-label={`Remove ${day.label}`}
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}

function ColorSwatchPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="size-10 rounded-xl border border-ink-200 dark:border-ink-700"
        style={{ backgroundColor: value }}
        aria-label="Pick color"
      />
      {open && (
        <div className="absolute z-20 top-12 left-0 bg-white dark:bg-ink-800 rounded-xl p-2 shadow-lg border border-ink-200 dark:border-ink-700 grid grid-cols-4 gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              className="size-7 rounded-lg ring-1 ring-black/10"
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="col-span-4 w-full mt-1 h-7 rounded"
          />
        </div>
      )}
    </div>
  );
}
