"use client";

import { format, parseISO } from "date-fns";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  formatRelativeEventDate,
  LIFE_EVENT_CATEGORY_LABELS,
  LIFE_EVENT_CATEGORY_STYLES,
  LIFE_EVENT_MOOD_EMOJI,
  LIFE_EVENT_MOODS,
} from "@/lib/lifemap-utils";
import type { LifeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LifeEventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: LifeEvent | null;
  onEdit: () => void;
}

export default function LifeEventDetailDialog({
  open,
  onOpenChange,
  event,
  onEdit,
}: LifeEventDetailDialogProps) {
  if (!event) return null;

  const styles = LIFE_EVENT_CATEGORY_STYLES[event.category];
  const mood = LIFE_EVENT_MOODS.find((item) => item.value === event.mood);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-w-md flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl ring-0",
          styles.border,
        )}
      >
        <div className={cn("px-6 py-6", styles.card)}>
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "flex size-16 shrink-0 items-center justify-center rounded-2xl border text-4xl shadow-sm",
                styles.border,
                "bg-card/80",
              )}
            >
              {event.emoji ?? "✨"}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {event.title}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {format(parseISO(event.date), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/80">
                {formatRelativeEventDate(event.date)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                styles.badge,
              )}
            >
              {LIFE_EVENT_CATEGORY_LABELS[event.category]}
            </span>
            {mood ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                  mood.className,
                )}
              >
                {mood.emoji} {mood.label}
              </span>
            ) : null}
          </div>

          {event.description ? (
            <div className="mt-5 rounded-xl border border-border/50 bg-card/70 px-4 py-4">
              <p className="text-sm leading-relaxed text-foreground">
                {event.description}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/50 bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          >
            <Pencil className="size-4" />
            Edit event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
