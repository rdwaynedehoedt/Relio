"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  BookOpen,
  Calendar,
  CircleDot,
  ExternalLink,
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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import NoteEditor from "@/components/NoteEditor";
import {
  emptyNoteForm,
  getFaviconUrl,
  getUrlDomain,
  isValidUrl,
  NOTE_MOODS,
  NOTE_TYPE_LABELS,
  NOTE_TYPE_STYLES,
  NOTE_TYPES,
  stripHtml,
  type NoteFormValues,
  noteToFormValues,
} from "@/lib/note-utils";
import type { Note, NoteMood, NoteType } from "@/lib/types";
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
  const [showUrlField, setShowUrlField] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRequestRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    const nextValues =
      mode === "edit" && note ? noteToFormValues(note) : emptyNoteForm();

    setValues(nextValues);
    setTagInput("");
    setShowUrlField(Boolean(nextValues.url));
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
    setShowUrlField(true);

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

  function toggleMood(mood: NoteMood) {
    updateField("mood", values.mood === mood ? undefined : mood);
  }

  function handleEditorChange(html: string, plainText: string) {
    setValues((current) => ({
      ...current,
      bodyHtml: html,
      body: plainText || stripHtml(html),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const plainBody = values.body.trim() || stripHtml(values.bodyHtml);

    if (!values.title.trim() && !plainBody) {
      setError("Add a title or some notes before saving.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        ...values,
        title: values.title.trim() || "Untitled note",
        body: plainBody,
        bodyHtml: values.bodyHtml,
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
  const typeStyles = NOTE_TYPE_STYLES[values.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex h-[calc(100dvh-1rem)] w-[calc(100vw-0.75rem)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border border-border/70 bg-card p-0 shadow-2xl ring-0",
          "sm:h-[min(92dvh,920px)] sm:w-[calc(100vw-2rem)] sm:max-w-3xl",
          "md:max-w-4xl",
          "lg:max-w-5xl",
          "data-open:zoom-in-95",
        )}
      >
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5 sm:px-6 sm:py-3">
            <div className="flex flex-wrap gap-1">
              {NOTE_TYPES.map((type) => {
                const Icon = TYPE_ICON_MAP[type];
                const isActive = values.type === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField("type", type)}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-lg transition-colors sm:size-9",
                      isActive
                        ? NOTE_TYPE_STYLES[type].badge
                        : "text-muted-foreground hover:bg-muted/60",
                    )}
                    title={NOTE_TYPE_LABELS[type]}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 pr-8 sm:pr-10">
              <button
                type="button"
                onClick={() => updateField("isPinned", !values.isPinned)}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-lg transition-colors sm:size-9",
                  values.isPinned
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground hover:bg-muted/60",
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
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-8 sm:py-6">
              <div className="shrink-0 space-y-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                    typeStyles.badge,
                  )}
                >
                  {NOTE_TYPE_LABELS[values.type]}
                </span>
                <Input
                  value={values.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Title"
                  className="h-auto border-0 bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none ring-0 placeholder:text-muted-foreground/40 focus-visible:ring-0 sm:text-3xl"
                />
              </div>

              <div
                className={cn(
                  "mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-border/50 bg-muted/[0.03] p-3 shadow-inner sm:mt-5 sm:rounded-2xl sm:p-5",
                  typeStyles.card,
                )}
              >
                <NoteEditor
                  content={values.bodyHtml}
                  onChange={handleEditorChange}
                  placeholder="Start writing..."
                  className="min-h-0 flex-1"
                />
              </div>
            </div>

            <div className="shrink-0 space-y-4 overflow-y-auto border-t border-border/50 bg-muted/10 px-4 py-4 sm:max-h-[32vh] sm:px-8 sm:py-5">
              <div className="space-y-2">
                <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Mood
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {NOTE_MOODS.map((option) => {
                    const isActive = values.mood === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleMood(option.value)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs",
                          isActive
                            ? "border-foreground/15 bg-muted text-foreground shadow-sm"
                            : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        )}
                      >
                        <span className="text-sm leading-none">{option.emoji}</span>
                        <span className="hidden sm:inline">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showPreview ? (
                <a
                  href={values.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-xl border border-blue-500/20 bg-blue-500/5 transition-colors hover:bg-blue-500/10"
                  onClick={(event) => event.stopPropagation()}
                >
                  {values.urlImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={values.urlImage}
                      alt=""
                      className="h-32 w-full object-cover sm:h-40"
                    />
                  ) : null}
                  <div className="flex items-start gap-3 p-3 sm:p-4">
                    {previewLoading ? (
                      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getFaviconUrl(values.url)}
                        alt=""
                        className="mt-0.5 size-5 shrink-0 rounded-sm"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        {values.urlTitle || getUrlDomain(values.url)}
                      </p>
                      {values.urlDescription ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {values.urlDescription}
                        </p>
                      ) : null}
                      <p className="mt-2 flex items-center gap-1 text-xs text-blue-600/80 dark:text-blue-400/80">
                        {getUrlDomain(values.url)}
                        <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </p>
                    </div>
                  </div>
                </a>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {showUrlField || !showPreview ? (
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      Link
                    </label>
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
                      placeholder="Paste a URL..."
                      className="h-9 border-border/60 bg-background/60"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Tags
                  </label>
                  <Input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tag, press Enter"
                    className="h-9 border-border/60 bg-background/60"
                  />
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
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/50 bg-muted/20 px-4 py-3 sm:px-8 sm:py-4">
            <div className="min-w-0 text-[11px] text-muted-foreground sm:text-xs">
              {mode === "edit" && note?.createdAt ? (
                <>
                  {format(parseISO(note.createdAt), "MMM d, yyyy")}
                  {note.updatedAt && note.updatedAt !== note.createdAt
                    ? ` · edited ${format(parseISO(note.updatedAt), "MMM d")}`
                    : ""}
                </>
              ) : (
                <span>New note</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {mode === "edit" && note?.id && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving || deleting}
                  onClick={() => void handleDelete()}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">
                    {deleting ? "Deleting..." : "Delete"}
                  </span>
                </Button>
              ) : null}
              <Button type="submit" size="sm" disabled={saving || deleting}>
                {saving ? "Saving..." : "Done"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
