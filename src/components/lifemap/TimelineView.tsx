"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, getDaysInMonth, parseISO } from "date-fns";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import LifeEventNode from "@/components/lifemap/LifeEventNode";
import {
  getDatePositionPercent,
  getGoalProgressPercent,
  getNodeSize,
  getTimelineWidth,
  getZoomRange,
  GOAL_CATEGORY_STYLES,
  GOAL_STATUS_LABELS,
  navigateZoomAnchor,
  resolveGoalCurrentAmount,
  TIMELINE_ZOOM_OPTIONS,
  type TimelineZoom,
} from "@/lib/lifemap-utils";
import type { Goal, LifeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const CENTER_Y = 200;
const EVENT_LANE_HEIGHT = 118;
const GOAL_OFFSET = 72;

interface TimelineViewProps {
  goals: Goal[];
  lifeEvents: LifeEvent[];
  zoom: TimelineZoom;
  anchorDate: Date;
  onZoomChange: (zoom: TimelineZoom) => void;
  onAnchorChange: (date: Date) => void;
  finance: { netWorthLkr: number; monthlyNetLkr: number };
  onGoalClick: (goal: Goal) => void;
  onEventClick: (event: LifeEvent) => void;
  selectedGoalId?: string | null;
  selectedEventId?: string | null;
}

export default function TimelineView({
  goals,
  lifeEvents,
  zoom,
  anchorDate,
  onZoomChange,
  onAnchorChange,
  finance,
  onGoalClick,
  onEventClick,
  selectedGoalId,
  selectedEventId,
}: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const range = useMemo(() => getZoomRange(zoom, anchorDate), [zoom, anchorDate]);
  const timelineWidth = useMemo(
    () => getTimelineWidth(zoom, anchorDate),
    [zoom, anchorDate],
  );
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const todayPercent = getDatePositionPercent(
    todayIso,
    range.start,
    range.end,
  );

  const datedGoals = useMemo(
    () => goals.filter((goal) => goal.targetDate),
    [goals],
  );

  const rangedEvents = useMemo(
    () =>
      lifeEvents.filter((event) => {
        const date = parseISO(event.date);
        return date >= range.start && date <= range.end;
      }),
    [lifeEvents, range.end, range.start],
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const todayPosition = (todayPercent / 100) * timelineWidth;
    container.scrollLeft = Math.max(0, todayPosition - container.clientWidth / 2);
  }, [timelineWidth, todayPercent, zoom, anchorDate]);

  const ticks = useMemo(() => {
    if (zoom === "month") {
      const days = getDaysInMonth(anchorDate);
      return Array.from({ length: days }, (_, i) => ({
        key: `day-${i + 1}`,
        label: String(i + 1),
        width: timelineWidth / days,
      }));
    }

    if (zoom === "year") {
      return Array.from({ length: 12 }, (_, i) => ({
        key: `month-${i}`,
        label: format(new Date(anchorDate.getFullYear(), i, 1), "MMM"),
        width: timelineWidth / 12,
      }));
    }

    const startYear = anchorDate.getFullYear() - 2;
    return Array.from({ length: 5 }, (_, i) => ({
      key: `year-${startYear + i}`,
      label: String(startYear + i),
      width: timelineWidth / 5,
    }));
  }, [anchorDate, timelineWidth, zoom]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onAnchorChange(navigateZoomAnchor(zoom, anchorDate, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="min-w-[120px] text-center text-sm font-medium text-foreground">
            {range.title}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onAnchorChange(navigateZoomAnchor(zoom, anchorDate, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="inline-flex rounded-xl border border-border/60 bg-muted/20 p-1">
          {TIMELINE_ZOOM_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onZoomChange(option.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                zoom === option.value
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative overflow-x-auto overflow-y-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-muted/20 via-background to-muted/10"
      >
        <div
          key={`${zoom}-${range.title}`}
          className="relative transition-all duration-300 ease-out"
          style={{ width: timelineWidth, height: 420 }}
        >
          <div
            className="pointer-events-none absolute right-0 left-0 flex items-center justify-between px-4"
            style={{ top: CENTER_Y - EVENT_LANE_HEIGHT - 8 }}
          >
            <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Life moments
            </span>
          </div>
          <div
            className="pointer-events-none absolute right-0 left-0 flex items-center justify-between px-4"
            style={{ top: CENTER_Y + 12 }}
          >
            <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Goals
            </span>
          </div>

          {ticks.map((tick, index) => (
            <div
              key={tick.key}
              className="absolute top-0 border-l border-border/25"
              style={{
                left: index * tick.width,
                width: tick.width,
                height: "100%",
              }}
            >
              <span className="sticky top-3 px-2 text-[11px] font-medium text-muted-foreground">
                {tick.label}
              </span>
            </div>
          ))}

          <div
            className="absolute right-0 left-0 border-t border-dashed border-border/50"
            style={{ top: CENTER_Y }}
          />

          <div
            className="absolute z-20 h-full w-px"
            style={{ left: `${todayPercent}%` }}
          >
            <div className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 animate-pulse rounded-full bg-foreground shadow-[0_0_16px_rgba(0,0,0,0.25)]" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold tracking-wide text-background uppercase shadow-lg">
              You are here
            </div>
            <div className="h-full w-px bg-foreground/60 shadow-[0_0_12px_rgba(0,0,0,0.12)]" />
          </div>

          {rangedEvents.map((event, index) => {
            const percent = getDatePositionPercent(
              event.date,
              range.start,
              range.end,
            );
            const row = index % 3;
            const isCompact = zoom === "fiveYear";
            const nodeWidth = isCompact ? 40 : 132;

            return (
              <div
                key={event.id}
                className="absolute z-30 -translate-x-1/2"
                style={{
                  left: `${percent}%`,
                  top: CENTER_Y - EVENT_LANE_HEIGHT - row * 88,
                  width: nodeWidth,
                }}
              >
                <LifeEventNode
                  event={event}
                  compact={isCompact}
                  isHovered={hovered === `event-${event.id}`}
                  isSelected={selectedEventId === event.id}
                  onHover={(active) =>
                    setHovered(active ? `event-${event.id}` : null)
                  }
                  onClick={() => onEventClick(event)}
                />
              </div>
            );
          })}

          {datedGoals.map((goal, index) => {
            if (!goal.targetDate) return null;

            const percent = getDatePositionPercent(
              goal.targetDate,
              range.start,
              range.end,
            );
            const size = getNodeSize(Boolean(goal.isPinned));
            const styles = GOAL_CATEGORY_STYLES[goal.category];
            const progress = getGoalProgressPercent(goal, finance);
            const currentAmount = resolveGoalCurrentAmount(goal, finance);
            const row = index % 3;

            return (
              <div
                key={goal.id}
                className="absolute z-30"
                style={{
                  left: `calc(${percent}% - ${size / 2}px)`,
                  top: CENTER_Y + GOAL_OFFSET + row * 64,
                }}
              >
                {hovered === `goal-${goal.id}` ? (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-[11px] text-background shadow-md">
                    {goal.coverEmoji} {goal.title}
                  </div>
                ) : null}

                <button
                  type="button"
                  className="flex flex-col items-center gap-1.5 outline-none"
                  onMouseEnter={() => setHovered(`goal-${goal.id}`)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoalClick(goal);
                  }}
                >
                  <div className="relative">
                    {goal.targetAmount ? (
                      <svg
                        width={size + 12}
                        height={size + 12}
                        className={cn(
                          "absolute -top-1.5 -left-1.5 -rotate-90",
                          styles.progress,
                        )}
                      >
                        <circle
                          cx={(size + 12) / 2}
                          cy={(size + 12) / 2}
                          r={size / 2 + 2}
                          fill="none"
                          className="stroke-muted/40"
                          strokeWidth="3"
                        />
                        <circle
                          cx={(size + 12) / 2}
                          cy={(size + 12) / 2}
                          r={size / 2 + 2}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * (size / 2 + 2)}
                          strokeDashoffset={
                            2 *
                            Math.PI *
                            (size / 2 + 2) *
                            (1 - progress / 100)
                          }
                        />
                      </svg>
                    ) : null}

                    <div
                      className={cn(
                        "relative flex items-center justify-center rounded-full ring-2 transition-transform hover:scale-105",
                        styles.nodeRing,
                        selectedGoalId === goal.id && "ring-foreground/30",
                        goal.status === "dream" &&
                          "border-2 border-dashed bg-background/80 opacity-80",
                        goal.status === "active" && "animate-pulse",
                        goal.status === "achieved" && styles.node,
                        goal.status !== "achieved" &&
                          goal.status !== "dream" &&
                          styles.node,
                        goal.status === "dream" && "text-foreground",
                      )}
                      style={{ width: size, height: size }}
                    >
                      <span className="text-lg leading-none">
                        {goal.coverEmoji ?? "🎯"}
                      </span>
                      {goal.status === "achieved" ? (
                        <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="size-2.5" />
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="max-w-[90px] text-center">
                    <p className="line-clamp-1 text-[10px] font-medium text-foreground">
                      {goal.title}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {GOAL_STATUS_LABELS[goal.status]}
                    </p>
                    {goal.targetAmount ? (
                      <p className="text-[9px] text-muted-foreground">
                        {Math.round(currentAmount).toLocaleString()} /{" "}
                        {goal.targetAmount.toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
