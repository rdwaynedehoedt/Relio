"use client";

import { format, parseISO } from "date-fns";
import {
  formatRelativeEventDate,
  LIFE_EVENT_CATEGORY_LABELS,
  LIFE_EVENT_CATEGORY_STYLES,
  LIFE_EVENT_MOOD_EMOJI,
} from "@/lib/lifemap-utils";
import type { LifeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LifeEventsGridProps {
  events: LifeEvent[];
  onEventClick: (event: LifeEvent) => void;
  title?: string;
}

export default function LifeEventsGrid({
  events,
  onEventClick,
  title = "Life Events",
}: LifeEventsGridProps) {
  const sorted = [...events].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );

  if (sorted.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-4 rounded-2xl border border-dashed border-border/60 px-6 py-10 text-center text-sm text-muted-foreground">
          No life events in this view yet.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((event) => {
          const styles = LIFE_EVENT_CATEGORY_STYLES[event.category];

          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onEventClick(event)}
              className={cn(
                "rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                styles.card,
                styles.border,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl leading-none">
                  {event.emoji ?? "✨"}
                </span>
                {event.mood ? (
                  <span className="text-lg">
                    {LIFE_EVENT_MOOD_EMOJI[event.mood]}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 font-bold text-foreground">{event.title}</h3>

              <span
                className={cn(
                  "mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                  styles.badge,
                )}
              >
                {LIFE_EVENT_CATEGORY_LABELS[event.category]}
              </span>

              <p className="mt-3 text-xs text-muted-foreground">
                {format(parseISO(event.date), "MMM d, yyyy")} ·{" "}
                {formatRelativeEventDate(event.date)}
              </p>

              {event.description ? (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
