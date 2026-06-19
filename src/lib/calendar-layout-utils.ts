import { parseISO } from "date-fns";
import type { CalendarEvent } from "@/lib/types";

export const CALENDAR_HOUR_HEIGHT_PX = 48;
export const CALENDAR_EVENT_GAP_PERCENT = 1;
export const CALENDAR_EVENT_MIN_HEIGHT_PX = 20;
export const CALENDAR_DEFAULT_START_HOUR = 7;
export const CALENDAR_DEFAULT_END_HOUR = 24;

export const CALENDAR_PIXELS_PER_MINUTE =
  CALENDAR_HOUR_HEIGHT_PX / 60;

export type PositionedCalendarEvent = CalendarEvent & {
  column: number;
  totalColumns: number;
};

export function isAllDayEvent(event: CalendarEvent): boolean {
  return event.startTime.length <= 10;
}

export function layoutDayEvents(events: CalendarEvent[]): PositionedCalendarEvent[] {
  const sorted = [...events].sort((a, b) => {
    const startDiff =
      parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime();
    if (startDiff !== 0) return startDiff;

    const durationA =
      parseISO(a.endTime).getTime() - parseISO(a.startTime).getTime();
    const durationB =
      parseISO(b.endTime).getTime() - parseISO(b.startTime).getTime();
    return durationB - durationA;
  });

  const positioned: PositionedCalendarEvent[] = [];
  const columns: CalendarEvent[][] = [];

  for (const event of sorted) {
    const eventStart = parseISO(event.startTime).getTime();
    const eventEnd = parseISO(event.endTime).getTime();

    let placedColumn = -1;

    for (let i = 0; i < columns.length; i++) {
      const lastInColumn = columns[i][columns[i].length - 1];
      const lastEnd = parseISO(lastInColumn.endTime).getTime();
      if (eventStart >= lastEnd) {
        placedColumn = i;
        break;
      }
    }

    if (placedColumn === -1) {
      columns.push([event]);
      placedColumn = columns.length - 1;
    } else {
      columns[placedColumn].push(event);
    }

    positioned.push({
      ...event,
      column: placedColumn,
      totalColumns: 1,
    });
  }

  for (const event of positioned) {
    const eventStart = parseISO(event.startTime).getTime();
    const eventEnd = parseISO(event.endTime).getTime();

    let maxCol = event.column;

    for (const other of positioned) {
      const otherStart = parseISO(other.startTime).getTime();
      const otherEnd = parseISO(other.endTime).getTime();
      const overlaps = eventStart < otherEnd && eventEnd > otherStart;

      if (overlaps) {
        maxCol = Math.max(maxCol, other.column);
      }
    }

    event.totalColumns = maxCol + 1;
  }

  return positioned;
}

export function getRecurringTitleKeys(events: CalendarEvent[]): Set<string> {
  const counts = new Map<string, number>();

  for (const event of events) {
    const key = event.title.trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count >= 3)
      .map(([title]) => title),
  );
}

export function getVisibleHourRange(
  events: CalendarEvent[],
  showFullDay: boolean,
): { startHour: number; endHour: number } {
  if (showFullDay) {
    return { startHour: 0, endHour: CALENDAR_DEFAULT_END_HOUR };
  }

  const timed = events.filter((event) => !isAllDayEvent(event));

  if (timed.length === 0) {
    return {
      startHour: CALENDAR_DEFAULT_START_HOUR,
      endHour: CALENDAR_DEFAULT_END_HOUR,
    };
  }

  let earliestMinutes = Infinity;
  let latestMinutes = 0;

  for (const event of timed) {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    earliestMinutes = Math.min(earliestMinutes, startMinutes);
    latestMinutes = Math.max(latestMinutes, endMinutes);
  }

  const startHour = Math.floor(earliestMinutes / 60);
  const endHour = Math.min(
    CALENDAR_DEFAULT_END_HOUR,
    Math.ceil(latestMinutes / 60) + 1,
  );

  return {
    startHour,
    endHour: Math.max(endHour, startHour + 1),
  };
}

export function calculateTopFromTime(
  startTime: string,
  visibleStartHour: number,
): number {
  const start = parseISO(startTime);
  const visibleStartMinutes = visibleStartHour * 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const clampedStart = Math.max(startMinutes, visibleStartMinutes);

  return (
    (clampedStart - visibleStartMinutes) * CALENDAR_PIXELS_PER_MINUTE
  );
}

export function calculateHeightFromDuration(
  event: CalendarEvent,
  visibleStartHour: number,
  visibleEndHour: number,
): number {
  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);

  const visibleStartMinutes = visibleStartHour * 60;
  const visibleEndMinutes = visibleEndHour * 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const clampedStart = Math.max(startMinutes, visibleStartMinutes);
  const clampedEnd = Math.min(endMinutes, visibleEndMinutes);
  const durationMinutes = Math.max(clampedEnd - clampedStart, 0);

  return Math.max(
    durationMinutes * CALENDAR_PIXELS_PER_MINUTE,
    CALENDAR_EVENT_MIN_HEIGHT_PX,
  );
}

export function getEventBlockMetrics(
  event: CalendarEvent,
  visibleStartHour: number,
  visibleEndHour: number,
): { topPx: number; heightPx: number } {
  return {
    topPx: calculateTopFromTime(event.startTime, visibleStartHour),
    heightPx: calculateHeightFromDuration(
      event,
      visibleStartHour,
      visibleEndHour,
    ),
  };
}

export function getEventBlockPosition(
  event: PositionedCalendarEvent,
): { leftPercent: number; widthPercent: number } {
  const widthPerColumn = 100 / event.totalColumns;
  const leftOffset = event.column * widthPerColumn;

  return {
    leftPercent: leftOffset,
    widthPercent: widthPerColumn - CALENDAR_EVENT_GAP_PERCENT,
  };
}

export function getCurrentTimeTopPx(
  visibleStartHour: number,
  visibleEndHour: number,
  now: Date,
): number | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const visibleStartMinutes = visibleStartHour * 60;
  const visibleEndMinutes = visibleEndHour * 60;

  if (nowMinutes < visibleStartMinutes || nowMinutes > visibleEndMinutes) {
    return null;
  }

  return (
    (nowMinutes - visibleStartMinutes) * CALENDAR_PIXELS_PER_MINUTE
  );
}

export type EventVisualStyle = "contact" | "recurring" | "default";

export function getEventVisualStyle(
  event: CalendarEvent,
  recurringTitles: Set<string>,
): EventVisualStyle {
  if (event.linkedContactIds && event.linkedContactIds.length > 0) {
    return "contact";
  }

  const titleKey = event.title.trim().toLowerCase();
  if (titleKey && recurringTitles.has(titleKey)) {
    return "recurring";
  }

  return "default";
}

export const EVENT_VISUAL_CLASSES: Record<EventVisualStyle, string> = {
  contact:
    "border border-emerald-500/35 bg-emerald-500/15 text-emerald-950 dark:text-emerald-50",
  recurring:
    "border border-border/70 bg-muted/70 text-muted-foreground",
  default:
    "border border-blue-500/30 bg-blue-500/15 text-blue-950 dark:text-blue-50",
};

export type EventContentLayout = "title-only" | "title-time" | "expanded";

export function getEventContentLayout(heightPx: number): EventContentLayout {
  if (heightPx < 32) return "title-only";
  if (heightPx <= 48) return "title-time";
  return "expanded";
}
