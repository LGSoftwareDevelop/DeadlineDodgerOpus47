import { useEffect, useState } from "react";
import { File as FileIcon, X, Download } from "lucide-react";
import { blobGet } from "../lib/db";
import type { AttachmentRef } from "../types";

type Props = {
  attachment: AttachmentRef;
  onRemove?: () => void;
  thumbSize?: number;
};

export function AttachmentPreview({ attachment, onRemove, thumbSize = 72 }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    blobGet(attachment.id).then((blob) => {
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id]);

  const isImage = attachment.kind === "image";

  return (
    <div className="relative group">
      {isImage && url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={attachment.name}
            style={{ width: thumbSize, height: thumbSize }}
            className="rounded-lg object-cover border border-ink-200 dark:border-ink-700"
          />
        </a>
      ) : (
        <a
          href={url ?? "#"}
          download={attachment.name}
          className="flex flex-col items-center justify-center rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200"
          style={{ width: thumbSize, height: thumbSize }}
          title={attachment.name}
        >
          <FileIcon size={20} />
          <span className="text-[10px] mt-1 px-1 truncate max-w-full">
            {attachment.name}
          </span>
          <Download size={12} className="mt-0.5 opacity-60" />
        </a>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Remove attachment"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
