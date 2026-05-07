export type CycleDay = {
  id: string;
  label: string;
  color: string; // hex
};

export type Class = {
  id: string;
  name: string;
  teacher?: string;
  room?: string;
  color: string;
  meetsOnCycleDayIds: string[];
  createdAt: string;
};

export type AttachmentRef = {
  id: string; // also the IDB blob key
  name: string;
  mime: string;
  size: number;
  kind: "image" | "file";
};

export type LinkRef = {
  url: string;
  label?: string;
};

export type Assignment = {
  id: string;
  title: string;
  classId?: string;
  dueDate: string; // ISO date (YYYY-MM-DD)
  notes?: string;
  links: LinkRef[];
  attachments: AttachmentRef[];
  completed: boolean;
  completedAt?: string;
  createdAt: string;
};

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  order: number;
};

export type ScheduleConfig = {
  cycleDays: CycleDay[];
  anchorDate: string; // ISO date
  anchorCycleDayId: string;
  skipWeekends: boolean;
  holidays: string[]; // ISO dates
  // Manual overrides: a specific date -> cycleDayId (or "" to mark as a no-school day)
  overrides: Record<string, string>;
};

export type SnarkLevel = "mild" | "medium" | "savage";
export type ThemeMode = "system" | "light" | "dark";

export type Settings = {
  theme: ThemeMode;
  snarkLevel: SnarkLevel;
  installPromptDismissed: boolean;
};

export type DailyPromptAnswer = {
  // composite key: `${date}__${classId}`
  key: string;
  date: string;
  classId: string;
  answer: "yes" | "no" | "later" | null;
  answeredAt?: string;
};

export type BackupV1 = {
  version: 1;
  exportedAt: string;
  schedule: ScheduleConfig;
  classes: Class[];
  assignments: Assignment[];
  todos: Todo[];
  settings: Settings;
  dailyPromptAnswers: DailyPromptAnswer[];
  // attachments are NOT included in backup JSON (binary blobs).
  // We mark referenced attachment IDs that won't survive transfer.
};
