"use client";

import { format, parseISO } from "date-fns";
import {
  formatShortProjection,
  getGoalProgressPercent,
  getMilestoneProgress,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_STYLES,
  GOAL_STATUS_LABELS,
  resolveGoalCurrentAmount,
  sortGoalsForBoard,
} from "@/lib/lifemap-utils";
import { formatLkr } from "@/lib/finance-utils";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GoalsGridProps {
  goals: Goal[];
  finance: { netWorthLkr: number; monthlyNetLkr: number };
  onGoalClick: (goal: Goal) => void;
  title?: string;
}

export default function GoalsGrid({
  goals,
  finance,
  onGoalClick,
  title = "Goals",
}: GoalsGridProps) {
  const sorted = sortGoalsForBoard(goals);

  if (sorted.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-4 rounded-2xl border border-dashed border-border/60 px-6 py-10 text-center text-sm text-muted-foreground">
          No goals in this view yet.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((goal) => {
          const styles = GOAL_CATEGORY_STYLES[goal.category];
          const progress = getGoalProgressPercent(goal, finance);
          const current = resolveGoalCurrentAmount(goal, finance);
          const milestones = getMilestoneProgress(goal.milestones);
          const projection = formatShortProjection(goal, finance);

          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => onGoalClick(goal)}
              className={cn(
                "rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                styles.card,
                styles.border,
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">
                  {goal.coverEmoji ?? "🎯"}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground">{goal.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        styles.badge,
                      )}
                    >
                      {GOAL_CATEGORY_LABELS[goal.category]}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {GOAL_STATUS_LABELS[goal.status]}
                    </span>
                  </div>
                </div>
              </div>

              {goal.targetDate ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Target {format(parseISO(goal.targetDate), "MMM d, yyyy")}
                </p>
              ) : null}

              {goal.targetAmount ? (
                <div className="mt-4 space-y-1.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/80"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {formatLkr(current)} / {formatLkr(goal.targetAmount)}
                  </p>
                  {projection ? (
                    <p className="text-[11px] text-muted-foreground">
                      {projection}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {milestones.total > 0 ? (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {milestones.label}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
