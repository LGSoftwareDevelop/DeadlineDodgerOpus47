import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Paperclip, Plus, Link as LinkIcon, X } from "lucide-react";
import { uid } from "../lib/id";
import { blobPut, blobDelete } from "../lib/db";
import { todayISO } from "../lib/date";
import { useStore } from "../store/useStore";
import type { Assignment, AttachmentRef, LinkRef } from "../types";
import { AttachmentPreview } from "./AttachmentPreview";

type Props = {
  initial?: Partial<Assignment>;
  defaultClassId?: string;
  onSave: (id: string) => void;
  onCancel?: () => void;
};

export function AssignmentForm({ initial, defaultClassId, onSave, onCancel }: Props) {
  const classes = useStore((s) => s.classes);
  const addAssignment = useStore((s) => s.addAssignment);
  const updateAssignment = useStore((s) => s.updateAssignment);
  const isEditing = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [classId, setClassId] = useState(initial?.classId ?? defaultClassId ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? todayISO());
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [links, setLinks] = useState<LinkRef[]>(initial?.links ?? []);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [attachments, setAttachments] = useState<AttachmentRef[]>(
    initial?.attachments ?? [],
  );
  const [pendingBlobs, setPendingBlobs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Drop any blobs we put into IDB but never saved (cancel path).
  const cancelledRef = useRef(false);
  useEffect(() => {
    return () => {
      if (cancelledRef.current) {
        pendingBlobs.forEach((id) => blobDelete(id).catch(() => {}));
      }
    };
  }, [pendingBlobs]);

  const handleFiles = async (files: FileList | null, kind: "image" | "file") => {
    if (!files) return;
    const newRefs: AttachmentRef[] = [];
    for (const file of Array.from(files)) {
      const id = uid();
      await blobPut(id, file);
      newRefs.push({
        id,
        name: file.name || (kind === "image" ? "photo.jpg" : "file"),
        mime: file.type || "application/octet-stream",
        size: file.size,
        kind: kind === "image" || file.type.startsWith("image/") ? "image" : "file",
      });
    }
    setAttachments((a) => [...a, ...newRefs]);
    setPendingBlobs((p) => [...p, ...newRefs.map((r) => r.id)]);
  };

  const removeAttachment = async (attId: string) => {
    setAttachments((a) => a.filter((x) => x.id !== attId));
    // Delete the blob immediately if it was added in this session
    if (pendingBlobs.includes(attId)) {
      await blobDelete(attId).catch(() => {});
      setPendingBlobs((p) => p.filter((x) => x !== attId));
    }
    // For existing attachments on a saved assignment, blob is removed on save
    // (we don't delete from IDB until the user actually saves).
  };

  const addLink = () => {
    const url = newLinkUrl.trim();
    if (!url) return;
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    setLinks((l) => [...l, { url: normalized, label: newLinkLabel.trim() || undefined }]);
    setNewLinkUrl("");
    setNewLinkLabel("");
  };

  const removeLink = (idx: number) => {
    setLinks((l) => l.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && initial?.id) {
      // Find blobs we need to drop (existed before, removed now).
      const original = initial.attachments ?? [];
      const removedIds = original
        .map((a) => a.id)
        .filter((id) => !attachments.find((x) => x.id === id));
      removedIds.forEach((id) => blobDelete(id).catch(() => {}));

      updateAssignment(initial.id, {
        title: title.trim(),
        classId: classId || undefined,
        dueDate,
        notes: notes.trim() || undefined,
        links,
        attachments,
      });
      // Mark blobs as no longer pending (they're saved now).
      setPendingBlobs([]);
      onSave(initial.id);
    } else {
      const id = addAssignment({
        title: title.trim(),
        classId: classId || undefined,
        dueDate,
        notes: notes.trim() || undefined,
        links,
        attachments,
      });
      setPendingBlobs([]);
      onSave(id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Title</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Read Ch. 4 + answer Qs"
          autoFocus
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Class</label>
          <select
            className="input"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">— None —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Due date</label>
          <input
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          className="input min-h-[64px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything you want to remember…"
        />
      </div>

      {/* Links */}
      <div>
        <label className="label flex items-center gap-1">
          <LinkIcon size={12} /> Links
        </label>
        {links.length > 0 && (
          <ul className="space-y-1.5 mb-2">
            {links.map((l, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm bg-ink-100 dark:bg-ink-700 rounded-lg px-2.5 py-1.5"
              >
                <LinkIcon size={14} className="shrink-0 text-accent" />
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate underline-offset-2 hover:underline flex-1"
                >
                  {l.label || l.url}
                </a>
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="text-ink-500 hover:text-rose-500"
                  aria-label="Remove link"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            type="url"
            inputMode="url"
            className="input flex-1"
            placeholder="https://…"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
          />
          <input
            className="input w-32"
            placeholder="Label"
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
          />
          <button type="button" onClick={addLink} className="btn-ghost">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="label flex items-center gap-1">
          <Paperclip size={12} /> Attachments
        </label>
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((a) => (
              <AttachmentPreview
                key={a.id}
                attachment={a}
                onRemove={() => removeAttachment(a.id)}
              />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={16} /> Camera
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon size={16} /> Photo
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={16} /> File
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files, "image");
              e.target.value = "";
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files, "image");
              e.target.value = "";
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files, "file");
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary flex-1">
          {isEditing ? "Save changes" : "Add homework"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              cancelledRef.current = true;
              onCancel();
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
