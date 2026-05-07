import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { kvGet, kvSet } from "../lib/db";
import { uid } from "../lib/id";
import { todayISO } from "../lib/date";
import type {
  Assignment,
  Class,
  CycleDay,
  DailyPromptAnswer,
  ScheduleConfig,
  Settings,
  Todo,
  AttachmentRef,
  LinkRef,
} from "../types";

const DEFAULT_CYCLE_DAYS: CycleDay[] = [
  { id: "green", label: "Green Day", color: "#22c55e" },
  { id: "gold", label: "Gold Day", color: "#eab308" },
];

const DEFAULT_SCHEDULE: ScheduleConfig = {
  cycleDays: DEFAULT_CYCLE_DAYS,
  anchorDate: todayISO(),
  anchorCycleDayId: "green",
  skipWeekends: true,
  holidays: [],
  overrides: {},
};

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  snarkLevel: "medium",
  installPromptDismissed: false,
};

type State = {
  ready: boolean;
  schedule: ScheduleConfig;
  classes: Class[];
  assignments: Assignment[];
  todos: Todo[];
  settings: Settings;
  dailyPromptAnswers: DailyPromptAnswer[];
  // Counters
  todayCompletedCount: number;
  todayCompletedDate: string;
};

type Actions = {
  // schedule
  setSchedule: (s: ScheduleConfig) => void;
  addCycleDay: (label: string, color: string) => void;
  updateCycleDay: (id: string, patch: Partial<CycleDay>) => void;
  removeCycleDay: (id: string) => void;
  setAnchor: (date: string, cycleDayId: string) => void;
  toggleHoliday: (date: string) => void;
  setOverride: (date: string, cycleDayId: string | null) => void;
  removeOverride: (date: string) => void;
  setSkipWeekends: (v: boolean) => void;

  // classes
  addClass: (c: Omit<Class, "id" | "createdAt">) => void;
  updateClass: (id: string, patch: Partial<Class>) => void;
  removeClass: (id: string) => void;

  // assignments
  addAssignment: (
    a: Omit<Assignment, "id" | "createdAt" | "completed" | "links" | "attachments"> & {
      links?: LinkRef[];
      attachments?: AttachmentRef[];
    },
  ) => string;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  toggleAssignment: (id: string) => boolean; // returns true if just completed
  removeAssignment: (id: string) => void;
  addAttachmentToAssignment: (id: string, ref: AttachmentRef) => void;
  removeAttachmentFromAssignment: (id: string, attachmentId: string) => void;

  // todos
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, patch: Partial<Todo>) => void;
  removeTodo: (id: string) => void;
  reorderTodo: (id: string, newOrder: number) => void;

  // settings
  setSettings: (patch: Partial<Settings>) => void;

  // daily prompts
  setDailyPromptAnswer: (
    date: string,
    classId: string,
    answer: "yes" | "no" | "later",
  ) => void;

  // backup
  importBackup: (data: unknown) => void;
  resetAll: () => void;
};

export type Store = State & Actions;

const initialState: State = {
  ready: false,
  schedule: DEFAULT_SCHEDULE,
  classes: [],
  assignments: [],
  todos: [],
  settings: DEFAULT_SETTINGS,
  dailyPromptAnswers: [],
  todayCompletedCount: 0,
  todayCompletedDate: todayISO(),
};

// Custom storage backed by IndexedDB so we don't hit localStorage size limits.
const idbStorage = {
  getItem: async (key: string) => {
    const v = await kvGet<string>(key);
    return v ?? null;
  },
  setItem: async (key: string, value: string) => {
    await kvSet(key, value);
  },
  removeItem: async (key: string) => {
    await kvSet(key, undefined);
  },
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Schedule
      setSchedule: (s) => set({ schedule: s }),
      addCycleDay: (label, color) =>
        set((s) => ({
          schedule: {
            ...s.schedule,
            cycleDays: [...s.schedule.cycleDays, { id: uid(), label, color }],
          },
        })),
      updateCycleDay: (id, patch) =>
        set((s) => ({
          schedule: {
            ...s.schedule,
            cycleDays: s.schedule.cycleDays.map((c) =>
              c.id === id ? { ...c, ...patch } : c,
            ),
          },
        })),
      removeCycleDay: (id) =>
        set((s) => {
          const cycleDays = s.schedule.cycleDays.filter((c) => c.id !== id);
          // If we removed the anchor's day, pick another.
          let anchorCycleDayId = s.schedule.anchorCycleDayId;
          if (!cycleDays.find((c) => c.id === anchorCycleDayId)) {
            anchorCycleDayId = cycleDays[0]?.id ?? "";
          }
          // Remove from class meetsOn lists too
          const classes = s.classes.map((c) => ({
            ...c,
            meetsOnCycleDayIds: c.meetsOnCycleDayIds.filter((x) => x !== id),
          }));
          return {
            schedule: { ...s.schedule, cycleDays, anchorCycleDayId },
            classes,
          };
        }),
      setAnchor: (date, cycleDayId) =>
        set((s) => ({
          schedule: {
            ...s.schedule,
            anchorDate: date,
            anchorCycleDayId: cycleDayId,
          },
        })),
      toggleHoliday: (date) =>
        set((s) => {
          const has = s.schedule.holidays.includes(date);
          return {
            schedule: {
              ...s.schedule,
              holidays: has
                ? s.schedule.holidays.filter((d) => d !== date)
                : [...s.schedule.holidays, date].sort(),
            },
          };
        }),
      setOverride: (date, cycleDayId) =>
        set((s) => ({
          schedule: {
            ...s.schedule,
            overrides: {
              ...s.schedule.overrides,
              [date]: cycleDayId === null ? "" : cycleDayId,
            },
          },
        })),
      removeOverride: (date) =>
        set((s) => {
          const { [date]: _, ...rest } = s.schedule.overrides;
          return { schedule: { ...s.schedule, overrides: rest } };
        }),
      setSkipWeekends: (v) =>
        set((s) => ({ schedule: { ...s.schedule, skipWeekends: v } })),

      // Classes
      addClass: (c) =>
        set((s) => ({
          classes: [
            ...s.classes,
            { ...c, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateClass: (id, patch) =>
        set((s) => ({
          classes: s.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeClass: (id) =>
        set((s) => ({
          classes: s.classes.filter((c) => c.id !== id),
          assignments: s.assignments.map((a) =>
            a.classId === id ? { ...a, classId: undefined } : a,
          ),
        })),

      // Assignments
      addAssignment: (a) => {
        const id = uid();
        set((s) => ({
          assignments: [
            ...s.assignments,
            {
              id,
              title: a.title,
              classId: a.classId,
              dueDate: a.dueDate,
              notes: a.notes,
              links: a.links ?? [],
              attachments: a.attachments ?? [],
              completed: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },
      updateAssignment: (id, patch) =>
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        })),
      toggleAssignment: (id) => {
        const a = get().assignments.find((x) => x.id === id);
        if (!a) return false;
        const willComplete = !a.completed;
        const today = todayISO();
        set((s) => {
          const sameDay = s.todayCompletedDate === today;
          return {
            assignments: s.assignments.map((x) =>
              x.id === id
                ? {
                    ...x,
                    completed: willComplete,
                    completedAt: willComplete ? new Date().toISOString() : undefined,
                  }
                : x,
            ),
            todayCompletedDate: today,
            todayCompletedCount: willComplete
              ? (sameDay ? s.todayCompletedCount : 0) + 1
              : Math.max(0, (sameDay ? s.todayCompletedCount : 0) - 1),
          };
        });
        return willComplete;
      },
      removeAssignment: (id) =>
        set((s) => ({
          assignments: s.assignments.filter((a) => a.id !== id),
        })),
      addAttachmentToAssignment: (id, ref) =>
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id === id ? { ...a, attachments: [...a.attachments, ref] } : a,
          ),
        })),
      removeAttachmentFromAssignment: (id, attachmentId) =>
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  attachments: a.attachments.filter((x) => x.id !== attachmentId),
                }
              : a,
          ),
        })),

      // Todos
      addTodo: (text) =>
        set((s) => ({
          todos: [
            ...s.todos,
            {
              id: uid(),
              text,
              completed: false,
              createdAt: new Date().toISOString(),
              order: s.todos.length,
            },
          ],
        })),
      toggleTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t,
          ),
        })),
      updateTodo: (id, patch) =>
        set((s) => ({
          todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTodo: (id) =>
        set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
      reorderTodo: (id, newOrder) =>
        set((s) => ({
          todos: s.todos
            .map((t) => (t.id === id ? { ...t, order: newOrder } : t))
            .sort((a, b) => a.order - b.order),
        })),

      // Settings
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      // Daily prompts
      setDailyPromptAnswer: (date, classId, answer) =>
        set((s) => {
          const key = `${date}__${classId}`;
          const existing = s.dailyPromptAnswers.find((a) => a.key === key);
          const updated: DailyPromptAnswer = {
            key,
            date,
            classId,
            answer,
            answeredAt: new Date().toISOString(),
          };
          if (existing) {
            return {
              dailyPromptAnswers: s.dailyPromptAnswers.map((a) =>
                a.key === key ? updated : a,
              ),
            };
          }
          return {
            dailyPromptAnswers: [...s.dailyPromptAnswers, updated],
          };
        }),

      // Backup
      importBackup: (data) => {
        if (
          !data ||
          typeof data !== "object" ||
          (data as { version?: number }).version !== 1
        ) {
          throw new Error("Invalid or unsupported backup file");
        }
        const b = data as {
          schedule?: ScheduleConfig;
          classes?: Class[];
          assignments?: Assignment[];
          todos?: Todo[];
          settings?: Settings;
          dailyPromptAnswers?: DailyPromptAnswer[];
        };
        set((s) => ({
          schedule: b.schedule ?? s.schedule,
          classes: b.classes ?? s.classes,
          assignments: b.assignments ?? s.assignments,
          todos: b.todos ?? s.todos,
          settings: b.settings ?? s.settings,
          dailyPromptAnswers: b.dailyPromptAnswers ?? s.dailyPromptAnswers,
        }));
      },

      resetAll: () => set({ ...initialState, ready: true }),
    }),
    {
      name: "dd-store-v1",
      storage: createJSONStorage(() => idbStorage as unknown as Storage),
      partialize: (state) => ({
        schedule: state.schedule,
        classes: state.classes,
        assignments: state.assignments,
        todos: state.todos,
        settings: state.settings,
        dailyPromptAnswers: state.dailyPromptAnswers,
        todayCompletedCount: state.todayCompletedCount,
        todayCompletedDate: state.todayCompletedDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.ready = true;
          // Reset today counter if it's a new day
          if (state.todayCompletedDate !== todayISO()) {
            state.todayCompletedCount = 0;
            state.todayCompletedDate = todayISO();
          }
        }
      },
    },
  ),
);

// Mark ready even if there's nothing to rehydrate
useStore.persist.onFinishHydration(() => {
  useStore.setState({ ready: true });
});
