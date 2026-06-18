"use client";

import { format, parseISO } from "date-fns";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatProjectionSavingsLine,
  getFinancialProjection,
  getGoalProgressPercent,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_STYLES,
  GOAL_STATUS_LABELS,
  resolveGoalCurrentAmount,
} from "@/lib/lifemap-utils";
import { formatLkr } from "@/lib/finance-utils";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GoalPreviewCardProps {
  goal: Goal;
  finance: { netWorthLkr: number; monthlyNetLkr: number };
  onOpen: () => void;
  onEdit: () => void;
  onDismiss: () => void;
  className?: string;
}

export default function GoalPreviewCard({
  goal,
  finance,
  onOpen,
  onEdit,
  onDismiss,
  className,
}: GoalPreviewCardProps) {
  const styles = GOAL_CATEGORY_STYLES[goal.category];
  const progress = getGoalProgressPercent(goal, finance);
  const current = resolveGoalCurrentAmount(goal, finance);
  const projection = goal.targetAmount
    ? getFinancialProjection(goal.targetAmount, current, finance.monthlyNetLkr)
    : null;

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
        <span className="text-3xl leading-none">{goal.coverEmoji ?? "🎯"}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>

      <h4 className="mt-3 text-base font-bold text-foreground">{goal.title}</h4>

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

      {goal.targetDate ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Target {format(parseISO(goal.targetDate), "MMM d, yyyy")}
        </p>
      ) : null}

      {goal.targetAmount ? (
        <div className="mt-4 space-y-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/80"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatLkr(current)} / {formatLkr(goal.targetAmount)}
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {formatProjectionSavingsLine(projection)}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button type="button" size="sm" className="flex-1" onClick={onOpen}>
          Open
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onEdit}
        >
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </div>
    </div>
  );
}
