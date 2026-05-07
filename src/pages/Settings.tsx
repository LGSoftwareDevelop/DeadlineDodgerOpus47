import { useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Monitor, Download, ClipboardCopy, Upload, Trash2, Calendar } from "lucide-react";
import { useStore } from "../store/useStore";
import { clearAll } from "../lib/db";
import type { SnarkLevel, ThemeMode, BackupV1 } from "../types";

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const importBackup = useStore((s) => s.importBackup);
  const resetAll = useStore((s) => s.resetAll);
  const state = useStore((s) => s);

  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const buildBackup = (): BackupV1 => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    schedule: state.schedule,
    classes: state.classes,
    assignments: state.assignments,
    todos: state.todos,
    settings: state.settings,
    dailyPromptAnswers: state.dailyPromptAnswers,
  });

  const downloadJson = () => {
    const data = buildBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deadline-dodger-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyJson = async () => {
    const data = buildBackup();
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("Couldn't access the clipboard. Use Export to file instead.");
    }
  };

  const importFile = (file: File) => {
    file.text().then((txt) => doImport(txt));
  };

  const doImport = (text: string) => {
    setImportError(null);
    try {
      const parsed = JSON.parse(text);
      importBackup(parsed);
      setImportText("");
      alert("Backup imported. Welcome back.");
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : "Couldn't read that backup.",
      );
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      doImport(txt);
    } catch {
      alert("Clipboard read failed. Paste into the box manually.");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-ink-500 dark:text-ink-300">
          Tune the vibe.
        </p>
      </header>

      <section className="card">
        <h2 className="font-display font-semibold mb-2">Theme</h2>
        <div className="flex gap-1.5">
          <ThemeBtn
            active={settings.theme === "system"}
            onClick={() => setSettings({ theme: "system" })}
            icon={<Monitor size={16} />}
            label="System"
          />
          <ThemeBtn
            active={settings.theme === "light"}
            onClick={() => setSettings({ theme: "light" })}
            icon={<Sun size={16} />}
            label="Light"
          />
          <ThemeBtn
            active={settings.theme === "dark"}
            onClick={() => setSettings({ theme: "dark" })}
            icon={<Moon size={16} />}
            label="Dark"
          />
        </div>
      </section>

      <section className="card">
        <h2 className="font-display font-semibold mb-2">Snark level</h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
          Tunes the celebration quotes.
        </p>
        <div className="flex gap-1.5">
          {(["mild", "medium", "savage"] as SnarkLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSettings({ snarkLevel: lvl })}
              className={`btn flex-1 capitalize ${
                settings.snarkLevel === lvl
                  ? "bg-accent text-white"
                  : "bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-ink-100"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="font-display font-semibold mb-1 flex items-center gap-2">
          <Calendar size={18} /> Schedule
        </h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
          Cycle days, anchor, and holidays.
        </p>
        <Link to="/schedule" className="btn-primary w-full">
          Open schedule setup
        </Link>
      </section>

      <section className="card">
        <h2 className="font-display font-semibold mb-2">Backup</h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
          Save your data anywhere — Google Drive, email, a note. Note:
          attachments (photos/files) live on this device only and aren't
          included in the JSON.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary" onClick={downloadJson}>
            <Download size={16} /> Export file
          </button>
          <button type="button" className="btn-ghost" onClick={copyJson}>
            <ClipboardCopy size={16} /> {copied ? "Copied!" : "Copy JSON"}
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-1">Import</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <label className="btn-ghost cursor-pointer">
              <Upload size={16} /> From file
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              className="btn-ghost"
              onClick={pasteFromClipboard}
            >
              <ClipboardCopy size={16} /> Paste
            </button>
          </div>
          <details>
            <summary className="text-xs text-ink-500 dark:text-ink-300 cursor-pointer">
              Or paste JSON manually
            </summary>
            <textarea
              className="input mt-2 min-h-[80px] font-mono text-xs"
              placeholder='{"version":1, ...}'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary mt-2 w-full"
              onClick={() => doImport(importText)}
              disabled={!importText.trim()}
            >
              Import pasted JSON
            </button>
          </details>
          {importError && (
            <p className="mt-2 text-sm text-rose-500">{importError}</p>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="font-display font-semibold mb-2 text-rose-600 dark:text-rose-400">
          Danger zone
        </h2>
        <button
          type="button"
          className="btn-danger w-full"
          onClick={async () => {
            if (
              confirm(
                "Wipe ALL data? Classes, homework, todos, settings, attachments — everything. This can't be undone.",
              )
            ) {
              await clearAll();
              resetAll();
              location.reload();
            }
          }}
        >
          <Trash2 size={16} /> Reset everything
        </button>
      </section>

      <p className="text-center text-xs text-ink-500 dark:text-ink-300 pt-2">
        Deadline Dodger · We are here to help you with your horrible homework.
      </p>
    </div>
  );
}

function ThemeBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn flex-1 ${
        active
          ? "bg-accent text-white"
          : "bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-ink-100"
      }`}
    >
      {icon} {label}
    </button>
  );
}
