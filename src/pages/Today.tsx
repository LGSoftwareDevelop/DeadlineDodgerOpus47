import { useMemo, useState } from "react";
import { Flame, Calendar, Sparkles } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { todayISO, prettyDate, isOverdue, daysUntil } from "../lib/date";
import { cycleDayForDate, getCycleDay } from "../lib/cycle";
import { quoteOfTheDay, completionQuote } from "../lib/quotes";
import { AssignmentCard } from "../components/AssignmentCard";
import { AssignmentForm } from "../components/AssignmentForm";
import { CelebrationOverlay } from "../components/CelebrationOverlay";
import { Mascot } from "../components/Mascot";
import { EmptyState } from "../components/EmptyState";
import { QuickAddModal } from "../components/QuickAddModal";
import type { Class } from "../types";

export function TodayPage() {
  const schedule = useStore((s) => s.schedule);
  const classes = useStore((s) => s.classes);
  const assignments = useStore((s) => s.assignments);
  const todayCount = useStore((s) =>
    s.todayCompletedDate === todayISO() ? s.todayCompletedCount : 0,
  );
  const dailyAnswers = useStore((s) => s.dailyPromptAnswers);
  const setDailyPromptAnswer = useStore((s) => s.setDailyPromptAnswer);
  const snarkLevel = useStore((s) => s.settings.snarkLevel);

  const today = todayISO();
  const todayCycleId = cycleDayForDate(today, schedule);
  const todayCycleDay = getCycleDay(todayCycleId, schedule.cycleDays);

  const classesToday: Class[] = useMemo(() => {
    if (!todayCycleId) return [];
    return classes.filter((c) => c.meetsOnCycleDayIds.includes(todayCycleId));
  }, [classes, todayCycleId]);

  const dueSoon = useMemo(() => {
    return [...assignments]
      .filter((a) => !a.completed)
      .filter((a) => daysUntil(a.dueDate) <= 7)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [assignments]);

  const overdue = dueSoon.filter((a) => isOverdue(a.dueDate, a.completed));
  const upcoming = dueSoon.filter((a) => !isOverdue(a.dueDate, a.completed));

  const [promptForClass, setPromptForClass] = useState<Class | null>(null);
  const [celebrate, setCelebrate] = useState<{ open: boolean; quote: string }>({
    open: false,
    quote: "",
  });
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const quote = quoteOfTheDay(snarkLevel, today);

  const isAnswered = (cid: string) =>
    dailyAnswers.find((a) => a.date === today && a.classId === cid && a.answer !== null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header
        className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden"
        style={{
          background: todayCycleDay
            ? `linear-gradient(135deg, ${todayCycleDay.color}, #0f172a)`
            : "linear-gradient(135deg, #475569, #0f172a)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">
              {prettyDate(today)}
            </p>
            <h1 className="font-display text-3xl font-bold mt-1">
              {todayCycleDay
                ? `Today is ${todayCycleDay.label}`
                : "No school today"}
            </h1>
            <p className="text-sm mt-2 opacity-90 max-w-xs">{quote}</p>
          </div>
          <Mascot size={88} mood={todayCount > 0 ? "happy" : "default"} />
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {todayCount > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1 text-sm">
              <Flame size={16} className="text-amber-300" />
              <span className="font-semibold">{todayCount}</span> done today
            </div>
          )}
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full px-3 py-1 text-sm transition"
          >
            <Sparkles size={16} />
            Paste it
          </button>
        </div>
      </header>

      {/* Daily class prompts */}
      {classesToday.length > 0 && (
        <section>
          <h2 className="font-display font-semibold mb-2 flex items-center gap-1.5">
            <Calendar size={18} /> Got homework today?
          </h2>
          <ul className="space-y-2">
            {classesToday.map((c) => {
              const answered = isAnswered(c.id);
              return (
                <li
                  key={c.id}
                  className="card flex items-center gap-3"
                  style={{ borderLeft: `4px solid ${c.color}` }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{c.name}</h3>
                    {answered ? (
                      <p className="text-xs text-ink-500 dark:text-ink-300">
                        {answered.answer === "yes"
                          ? "Got homework — added"
                          : answered.answer === "no"
                          ? "No homework today 🎉"
                          : "You said you'd check later"}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-500 dark:text-ink-300">
                        Did you get homework in this class?
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        setPromptForClass(c);
                      }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setDailyPromptAnswer(today, c.id, "no")}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setDailyPromptAnswer(today, c.id, "later")}
                    >
                      Later
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {promptForClass && (
        <div className="card">
          <h3 className="font-display font-semibold mb-3">
            Add homework for {promptForClass.name}
          </h3>
          <AssignmentForm
            defaultClassId={promptForClass.id}
            onSave={() => {
              setDailyPromptAnswer(today, promptForClass.id, "yes");
              setPromptForClass(null);
            }}
            onCancel={() => setPromptForClass(null)}
          />
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <section>
          <h2 className="font-display font-semibold mb-2 text-rose-600 dark:text-rose-400">
            Overdue
          </h2>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {overdue.map((a) => (
                <li key={a.id}>
                  <AssignmentCard
                    assignment={a}
                    onComplete={() =>
                      setCelebrate({ open: true, quote: completionQuote(snarkLevel) })
                    }
                  />
                </li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {/* Due soon */}
      <section>
        <h2 className="font-display font-semibold mb-2">Due in the next week</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            mood="happy"
            title="Nothing due soon"
            body={
              classes.length === 0
                ? "Add your classes and any homework to get started."
                : "Enjoy the calm before the next assignment shows up."
            }
          />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {upcoming.map((a) => (
                <li key={a.id}>
                  <AssignmentCard
                    assignment={a}
                    onComplete={() =>
                      setCelebrate({ open: true, quote: completionQuote(snarkLevel) })
                    }
                  />
                </li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <CelebrationOverlay
        open={celebrate.open}
        quote={celebrate.quote}
        onClose={() => setCelebrate({ open: false, quote: "" })}
      />

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
