"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CALENDAR_HOUR_HEIGHT_PX,
  EVENT_VISUAL_CLASSES,
  getCurrentTimeTopPx,
  getEventBlockMetrics,
  getEventBlockPosition,
  getEventContentLayout,
  getEventVisualStyle,
  getRecurringTitleKeys,
  getVisibleHourRange,
  isAllDayEvent,
  layoutDayEvents,
  type PositionedCalendarEvent,
} from "@/lib/calendar-layout-utils";
import { filterEventsForDay } from "@/lib/calendar-utils";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type WeekDayGridProps = {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
};

export default function WeekDayGrid({
  days,
  events,
  onSelectEvent,
}: WeekDayGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFullDay, setShowFullDay] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const recurringTitles = useMemo(
    () => getRecurringTitleKeys(events),
    [events],
  );

  const { startHour, endHour } = useMemo(
    () => getVisibleHourRange(events, showFullDay),
    [events, showFullDay],
  );

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, index) => startHour + index),
    [startHour, endHour],
  );

  const gridHeight = hours.length * CALENDAR_HOUR_HEIGHT_PX;

  const columnTemplate = useMemo(() => {
    return days
      .map((day) => {
        const dayEvents = filterEventsForDay(events, day);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        if (isWeekend && dayEvents.length === 0) {
          return "minmax(52px, 0.55fr)";
        }
        return "minmax(88px, 1fr)";
      })
      .join(" ");
  }, [days, events]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = 0;
  }, [startHour, endHour, showFullDay, days]);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => setShowFullDay((current) => !current)}
        >
          {showFullDay ? "Collapse early hours" : "Show full day"}
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-sm max-h-[calc(100vh-280px)]"
      >
        <div
          className="grid min-w-[720px]"
          style={{ gridTemplateColumns: `56px ${columnTemplate}` }}
        >
          <div className="border-b border-border/40 p-2" />
          {days.map((day) => {
            const isToday = isSameDay(day, now);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-b border-l border-border/40 p-2 text-center",
                  isToday && "bg-primary/5",
                )}
              >
                <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                <p
                  className={cn(
                    "text-sm text-foreground",
                    isToday && "font-bold text-primary",
                  )}
                >
                  {format(day, "d")}
                </p>
              </div>
            );
          })}

          <div className="relative border-border/20">
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex h-12 items-start border-b border-border/20 px-2 pt-1 text-[10px] text-muted-foreground"
              >
                {format(new Date(2000, 0, 1, hour), "ha")}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const isToday = isSameDay(day, now);
            const dayEvents = filterEventsForDay(events, day);
            const timedEvents = dayEvents.filter((event) => !isAllDayEvent(event));
            const allDayEvents = dayEvents.filter(isAllDayEvent);
            const positionedEvents = layoutDayEvents(timedEvents);
            const isEmptyWeekend =
              (day.getDay() === 0 || day.getDay() === 6) && dayEvents.length === 0;
            const nowLineTop = isToday
              ? getCurrentTimeTopPx(startHour, endHour, now)
              : null;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-l border-border/20",
                  isToday && "bg-primary/[0.04]",
                  isEmptyWeekend && "bg-muted/20",
                )}
                style={{ height: gridHeight }}
              >
                {hours.map((hour) => (
                  <div key={hour} className="h-12 border-b border-border/20" />
                ))}

                {isEmptyWeekend ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2">
                    <p className="text-center text-[11px] text-muted-foreground">
                      No events
                    </p>
                  </div>
                ) : null}

                {nowLineTop !== null ? (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-20 border-t-2 border-primary"
                    style={{ top: nowLineTop }}
                  >
                    <div className="absolute -left-1 -top-1 size-2 rounded-full bg-primary" />
                  </div>
                ) : null}

                {allDayEvents.length > 0 ? (
                  <div className="absolute left-1 right-1 top-1 z-30 space-y-1">
                    {allDayEvents.map((event) => (
                      <AllDayEventChip
                        key={event.id}
                        event={event}
                        recurringTitles={recurringTitles}
                        onSelect={() => onSelectEvent(event)}
                      />
                    ))}
                  </div>
                ) : null}

                {positionedEvents.map((event) => (
                  <TimedEventBlock
                    key={event.id}
                    event={event}
                    startHour={startHour}
                    endHour={endHour}
                    recurringTitles={recurringTitles}
                    isHovered={hoveredEventId === event.id}
                    onHover={() => setHoveredEventId(event.id)}
                    onLeave={() => setHoveredEventId(null)}
                    onSelect={() => onSelectEvent(event)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimedEventBlock({
  event,
  startHour,
  endHour,
  recurringTitles,
  isHovered,
  onHover,
  onLeave,
  onSelect,
}: {
  event: PositionedCalendarEvent;
  startHour: number;
  endHour: number;
  recurringTitles: Set<string>;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}) {
  const { topPx, heightPx } = getEventBlockMetrics(event, startHour, endHour);
  const { leftPercent, widthPercent } = getEventBlockPosition(event);
  const visualStyle = getEventVisualStyle(event, recurringTitles);
  const contentLayout = getEventContentLayout(heightPx);
  const isRecurring = recurringTitles.has(event.title.trim().toLowerCase());

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "absolute box-border overflow-hidden rounded-md p-0.5 text-left transition-shadow duration-150",
        EVENT_VISUAL_CLASSES[visualStyle],
        isHovered ? "z-50 shadow-md" : "z-10",
      )}
      style={{
        top: topPx,
        height: heightPx,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      }}
    >
      <div className="flex h-full min-w-0 overflow-hidden">
        {isRecurring && contentLayout !== "title-only" ? (
          <Repeat2 className="mt-0.5 size-3 shrink-0 opacity-70" />
        ) : null}
        <div className="min-w-0 flex-1 overflow-hidden">
          {contentLayout === "title-only" ? (
            <span
              className="block truncate whitespace-nowrap text-[10px] font-medium leading-tight"
              title={event.title}
            >
              {event.title}
            </span>
          ) : (
            <>
              <span
                className={cn(
                  "block truncate whitespace-nowrap font-medium leading-tight",
                  contentLayout === "expanded" ? "text-[11px]" : "text-[11px]",
                )}
                title={event.title}
              >
                {event.title}
              </span>
              <span
                className="block truncate whitespace-nowrap text-[10px] leading-tight opacity-80"
                title={formatEventTimeShort(event)}
              >
                {formatEventTimeShort(event)}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function formatEventTimeShort(event: CalendarEvent): string {
  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);
  return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
}

function AllDayEventChip({
  event,
  recurringTitles,
  onSelect,
}: {
  event: CalendarEvent;
  recurringTitles: Set<string>;
  onSelect: () => void;
}) {
  const visualStyle = getEventVisualStyle(event, recurringTitles);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-[10px] font-medium",
        EVENT_VISUAL_CLASSES[visualStyle],
      )}
    >
      {recurringTitles.has(event.title.trim().toLowerCase()) ? (
        <Repeat2 className="size-3 shrink-0 opacity-70" />
      ) : null}
      <span className="truncate">{event.title}</span>
    </button>
  );
}
