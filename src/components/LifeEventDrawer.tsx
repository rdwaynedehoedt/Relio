"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
  emptyLifeEventForm,
  LIFE_EVENT_CATEGORIES,
  LIFE_EVENT_CATEGORY_LABELS,
  LIFE_EVENT_CATEGORY_STYLES,
  LIFE_EVENT_EMOJIS,
  LIFE_EVENT_MOODS,
  lifeEventToFormValues,
  type LifeEventFormValues,
} from "@/lib/lifemap-utils";
import type { LifeEvent, LifeEventMood } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LifeEventDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  event?: LifeEvent | null;
  onSave: (values: LifeEventFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function LifeEventDrawer({
  open,
  onOpenChange,
  mode,
  event,
  onSave,
  onDelete,
}: LifeEventDrawerProps) {
  const [values, setValues] = useState<LifeEventFormValues>(emptyLifeEventForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setValues(
      mode === "edit" && event
        ? lifeEventToFormValues(event)
        : emptyLifeEventForm(),
    );
    setError(null);
  }, [open, mode, event]);

  function updateField<K extends keyof LifeEventFormValues>(
    key: K,
    value: LifeEventFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleMood(mood: LifeEventMood) {
    updateField("mood", values.mood === mood ? undefined : mood);
  }

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setError(null);

    if (!values.title.trim()) {
      setError("Add a title for this moment.");
      return;
    }

    if (!values.date) {
      setError("Pick a date for this event.");
      return;
    }

    setSaving(true);

    try {
      await onSave(values);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save life event.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event?.id || !onDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await onDelete(event.id);
      onOpenChange(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete life event.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const emojiOptions = LIFE_EVENT_EMOJIS[values.category];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle>
            {mode === "add" ? "New life event" : "Edit life event"}
          </SheetTitle>
          <SheetDescription>
            Log meaningful moments on your timeline.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LIFE_EVENT_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      updateField("category", category);
                      if (!LIFE_EVENT_EMOJIS[category].includes(values.emoji)) {
                        updateField("emoji", LIFE_EVENT_EMOJIS[category][0]);
                      }
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      values.category === category
                        ? LIFE_EVENT_CATEGORY_STYLES[category].badge
                        : "bg-muted/50 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {LIFE_EVENT_CATEGORY_LABELS[category]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => updateField("emoji", emoji)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl border text-xl transition-colors",
                      values.emoji === emoji
                        ? "border-foreground/20 bg-muted shadow-sm"
                        : "border-border/50 hover:bg-muted/50",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Title
              </label>
              <Input
                value={values.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="What happened?"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Date
              </label>
              <Input
                type="date"
                value={values.date}
                onChange={(e) => updateField("date", e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Description
              </label>
              <textarea
                value={values.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Capture the details..."
                rows={4}
                className="w-full resize-y rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60 focus:border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Mood
              </label>
              <div className="flex flex-wrap gap-2">
                {LIFE_EVENT_MOODS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleMood(option.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      values.mood === option.value
                        ? cn(option.className, "border-foreground/10 shadow-sm")
                        : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    <span>{option.emoji}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <SheetFooter className="border-t border-border/60 px-6 py-4">
            <div className="flex w-full flex-wrap items-center gap-2">
              {mode === "edit" && event?.id && onDelete ? (
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
              <Button
                type="submit"
                disabled={saving || deleting}
                className="ml-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save event"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
