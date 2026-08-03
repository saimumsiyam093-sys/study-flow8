import { useCallback, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes, type StoredFile } from "@/lib/ai-store";
import { ACCEPT_ATTR, extractFile } from "@/lib/file-extract";

type Props = {
  files: StoredFile[];
  selected: string[];
  onAdd: (files: StoredFile[]) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
};

export function AiFiles({ files, selected, onAdd, onRemove, onToggle }: Props) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(
    async (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const incoming = Array.from(list).slice(0, 10);
      setBusy((n) => n + incoming.length);
      try {
        const results = await Promise.all(incoming.map((file) => extractFile(file)));
        onAdd(results);
        const failed = results.filter((r) => r.error);
        const ok = results.length - failed.length;
        if (ok > 0) toast.success(`${ok} file${ok > 1 ? "s" : ""} ready`);
        for (const f of failed) toast.error(`${f.name}: ${f.error}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setBusy((n) => Math.max(0, n - incoming.length));
      }
    },
    [onAdd],
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "cursor-pointer rounded-2xl border-2 border-dashed border-border/70 bg-background/50 p-4 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {busy > 0 ? (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Reading {busy} file{busy > 1 ? "s" : ""}…
          </p>
        ) : (
          <>
            <Upload className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Drop files or click to upload</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, PPTX, TXT, JPG, PNG — images are read with OCR</p>
          </>
        )}
      </div>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file) => {
            const active = selected.includes(file.id);
            return (
              <li
                key={file.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-2 transition-colors",
                  active && "border-primary/50 bg-primary/5",
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggle(file.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  title={active ? "Remove from this question" : "Use in this question"}
                >
                  {file.preview ? (
                    <img src={file.preview} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                      {file.kind === "image" ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{file.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {file.error
                        ? file.error
                        : `${file.kind.toUpperCase()} · ${formatBytes(file.size)} · ${file.text.length} chars`}
                    </span>
                  </span>
                </button>
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={() => onRemove(file.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selected.length > 0 ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <X className="size-3" /> Tap a file to include or exclude it — {selected.length} in use
        </p>
      ) : null}
    </div>
  );
}
