"use client";

import { format, parseISO } from "date-fns";
import {
  LIFE_EVENT_CATEGORY_LABELS,
  LIFE_EVENT_CATEGORY_STYLES,
  LIFE_EVENT_MOOD_EMOJI,
} from "@/lib/lifemap-utils";
import type { LifeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LifeEventNodeProps {
  event: LifeEvent;
  isHovered: boolean;
  isSelected: boolean;
  compact?: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

export default function LifeEventNode({
  event,
  isHovered,
  isSelected,
  compact = false,
  onClick,
  onHover,
}: LifeEventNodeProps) {
  const styles = LIFE_EVENT_CATEGORY_STYLES[event.category];
  const dateLabel = format(parseISO(event.date), "MMM d");

  if (compact) {
    return (
      <button
        type="button"
        className="group flex flex-col items-center outline-none"
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <div
          className={cn(
            "relative flex size-10 items-center justify-center rounded-full border-2 bg-card/95 text-lg shadow-md backdrop-blur-sm transition-all duration-200",
            styles.border,
            isHovered && "scale-110 shadow-lg",
            isSelected && "ring-2 ring-foreground/25",
          )}
        >
          {event.emoji ?? "✨"}
          {event.mood ? (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-card text-[10px] shadow-sm ring-1 ring-border/50">
              {LIFE_EVENT_MOOD_EMOJI[event.mood]}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "mt-1.5 h-4 w-px bg-gradient-to-b from-border/80 to-transparent",
          )}
        />
        {isHovered ? (
          <p className="mt-1 max-w-[72px] truncate text-center text-[10px] font-medium text-foreground">
            {event.title}
          </p>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="group flex cursor-pointer flex-col items-center outline-none"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div
        className={cn(
          "relative min-w-[108px] max-w-[132px] rounded-2xl border bg-card/95 px-3 py-2.5 shadow-md backdrop-blur-sm transition-all duration-200",
          styles.border,
          styles.card,
          isHovered && "-translate-y-0.5 scale-[1.02] shadow-lg",
          isSelected && "ring-2 ring-foreground/20",
        )}
      >
        {event.mood ? (
          <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-border/50 bg-card text-sm shadow-sm">
            {LIFE_EVENT_MOOD_EMOJI[event.mood]}
          </span>
        ) : null}

        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl text-lg shadow-inner",
              styles.card,
              "border",
              styles.border,
            )}
          >
            {event.emoji ?? "✨"}
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-xs font-semibold leading-tight text-foreground">
              {event.title}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{dateLabel}</p>
          </div>
        </div>

        <span
          className={cn(
            "mt-2 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium",
            styles.badge,
          )}
        >
          {LIFE_EVENT_CATEGORY_LABELS[event.category]}
        </span>
      </div>

      <div className="relative mt-1 flex flex-col items-center">
        <div className="h-5 w-px bg-gradient-to-b from-border to-border/20" />
        <div
          className={cn(
            "size-2 rounded-full ring-2 ring-background",
            styles.node,
          )}
        />
      </div>
    </button>
  );
}
