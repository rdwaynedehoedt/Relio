"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  BookOpen,
  Calendar,
  CircleDot,
  Flag,
  Lightbulb,
  Loader2,
  Pin,
  PinOff,
  Scale,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  emptyNoteForm,
  getFaviconUrl,
  getUrlDomain,
  isValidUrl,
  NOTE_TYPE_LABELS,
  NOTE_TYPES,
  type NoteFormValues,
  noteToFormValues,
} from "@/lib/note-utils";
import type { Note, NoteType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_ICON_MAP: Record<NoteType, LucideIcon> = {
  idea: Lightbulb,
  article: BookOpen,
  meeting: Calendar,
  decision: Scale,
  goal: Flag,
  random: CircleDot,
};

interface NoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  note?: Note | null;
  onSave: (values: NoteFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function NoteDrawer({
  open,
  onOpenChange,
  mode,
  note,
  onSave,
  onDelete,
}: NoteDrawerProps) {
  const [values, setValues] = useState<NoteFormValues>(emptyNoteForm());
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRequestRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    setValues(mode === "edit" && note ? noteToFormValues(note) : emptyNoteForm());
    setTagInput("");
    setError(null);
    setPreviewLoading(false);
  }, [open, mode, note]);

  function updateField<K extends keyof NoteFormValues>(
    key: K,
    value: NoteFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function fetchUrlPreview(url: string) {
    if (!isValidUrl(url)) return;

    const requestId = ++previewRequestRef.current;
    setPreviewLoading(true);

    try {
      const response = await fetch("/api/url-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = (await response.json()) as {
        title?: string;
        description?: string;
        image?: string;
      };

      if (requestId !== previewRequestRef.current) return;

      setValues((current) => ({
        ...current,
        urlTitle: data.title ?? "",
        urlDescription: data.description ?? "",
        urlImage: data.image ?? "",
        title: current.title.trim()
          ? current.title
          : data.title?.trim() || current.title,
      }));
    } catch {
      // Preview failures are non-blocking.
    } finally {
      if (requestId === previewRequestRef.current) {
        setPreviewLoading(false);
      }
    }
  }

  function handleUrlChange(nextUrl: string) {
    updateField("url", nextUrl);

    if (!nextUrl.trim()) {
      updateField("urlTitle", "");
      updateField("urlDescription", "");
      updateField("urlImage", "");
      return;
    }

    if (isValidUrl(nextUrl)) {
      void fetchUrlPreview(nextUrl);
    }
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    if (values.tags.includes(tag)) {
      setTagInput("");
      return;
    }

    updateField("tags", [...values.tags, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    updateField(
      "tags",
      values.tags.filter((item) => item !== tag),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!values.title.trim() && !values.body.trim()) {
      setError("Add a title or some notes before saving.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        ...values,
        title: values.title.trim() || "Untitled note",
        body: values.body.trim(),
        url: values.url.trim(),
        urlTitle: values.urlTitle.trim(),
        urlDescription: values.urlDescription.trim(),
        urlImage: values.urlImage.trim(),
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save note.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!note?.id || !onDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await onDelete(note.id);
      onOpenChange(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete note.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const showPreview = values.url && isValidUrl(values.url);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle>{mode === "add" ? "New note" : "Edit note"}</SheetTitle>
          <SheetDescription>
            Capture ideas, articles, meetings, and decisions.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {NOTE_TYPES.map((type) => {
                  const Icon = TYPE_ICON_MAP[type];
                  const isActive = values.type === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField("type", type)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "border-foreground/20 bg-muted text-foreground"
                          : "border-transparent text-muted-foreground hover:bg-muted/60",
                      )}
                      title={NOTE_TYPE_LABELS[type]}
                    >
                      <Icon className="size-3.5" />
                      {NOTE_TYPE_LABELS[type]}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => updateField("isPinned", !values.isPinned)}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-lg border transition-colors",
                  values.isPinned
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-border/60 text-muted-foreground hover:bg-muted/60",
                )}
                aria-label={values.isPinned ? "Unpin note" : "Pin note"}
              >
                {values.isPinned ? (
                  <Pin className="size-4" />
                ) : (
                  <PinOff className="size-4" />
                )}
              </button>
            </div>

            <Input
              value={values.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Title"
              className="h-auto border-0 bg-transparent px-0 text-2xl font-semibold shadow-none ring-0 placeholder:text-muted-foreground/50 focus-visible:ring-0"
            />

            <textarea
              value={values.body}
              onChange={(event) => updateField("body", event.target.value)}
              placeholder="Start writing..."
              rows={10}
              className="min-h-[220px] w-full resize-y rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-border"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="h-9"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {values.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {values.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted/80"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">URL</label>
              <Input
                value={values.url}
                onChange={(event) => handleUrlChange(event.target.value)}
                onPaste={(event) => {
                  const pasted = event.clipboardData.getData("text").trim();
                  if (pasted) {
                    event.preventDefault();
                    handleUrlChange(pasted);
                  }
                }}
                placeholder="https://..."
                className="h-9"
              />
            </div>

            {showPreview ? (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                <div className="flex items-start gap-3 p-3">
                  {previewLoading ? (
                    <Loader2 className="mt-1 size-4 shrink-0 animate-spin text-muted-foreground" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getFaviconUrl(values.url)}
                      alt=""
                      className="mt-1 size-4 shrink-0 rounded-sm"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {values.urlTitle || getUrlDomain(values.url)}
                    </p>
                    {values.urlDescription ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {values.urlDescription}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {getUrlDomain(values.url)}
                    </p>
                  </div>
                </div>
                {values.urlImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={values.urlImage}
                    alt=""
                    className="h-36 w-full border-t border-border/60 object-cover"
                  />
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <SheetFooter className="border-t border-border/60 px-6 py-4">
            <div className="flex w-full flex-col gap-3">
              {mode === "edit" && note ? (
                <p className="text-xs text-muted-foreground">
                  Created{" "}
                  {note.createdAt
                    ? format(parseISO(note.createdAt), "MMM d, yyyy · h:mm a")
                    : "—"}
                  {note.updatedAt && note.updatedAt !== note.createdAt
                    ? ` · Updated ${format(parseISO(note.updatedAt), "MMM d, yyyy · h:mm a")}`
                    : ""}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={saving || deleting}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                {mode === "edit" && note?.id && onDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || deleting}
                    onClick={() => void handleDelete()}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                ) : null}
              </div>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
