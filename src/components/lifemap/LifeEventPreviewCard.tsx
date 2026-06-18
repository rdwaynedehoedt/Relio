"use client";

import { format, parseISO } from "date-fns";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LIFE_EVENT_CATEGORY_LABELS,
  LIFE_EVENT_CATEGORY_STYLES,
  LIFE_EVENT_MOOD_EMOJI,
} from "@/lib/lifemap-utils";
import type { LifeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LifeEventPreviewCardProps {
  event: LifeEvent;
  onOpen: () => void;
  onEdit: () => void;
  onDismiss: () => void;
  className?: string;
}

export default function LifeEventPreviewCard({
  event,
  onOpen,
  onEdit,
  onDismiss,
  className,
}: LifeEventPreviewCardProps) {
  const styles = LIFE_EVENT_CATEGORY_STYLES[event.category];

  return (
    <div
      className={cn(
        "z-50 w-72 rounded-2xl border bg-card p-4 shadow-xl ring-1 ring-foreground/5",
        styles.border,
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl leading-none">{event.emoji ?? "✨"}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>

      <h4 className="mt-3 text-base font-bold text-foreground">{event.title}</h4>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            styles.badge,
          )}
        >
          {LIFE_EVENT_CATEGORY_LABELS[event.category]}
        </span>
        {event.mood ? (
          <span className="text-sm">{LIFE_EVENT_MOOD_EMOJI[event.mood]}</span>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {format(parseISO(event.date), "MMM d, yyyy")}
      </p>

      {event.description ? (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
          {event.description}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button type="button" size="sm" className="flex-1" onClick={onOpen}>
          Open
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </div>
    </div>
  );
}
