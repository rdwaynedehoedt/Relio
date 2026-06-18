"use client";

import { format, parseISO } from "date-fns";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatLkr } from "@/lib/finance-utils";
import {
  formatProjectionSavingsLine,
  getFinancialProjection,
  getGoalProgressPercent,
  getMilestoneProgress,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_STYLES,
  GOAL_STATUS_LABELS,
  resolveGoalCurrentAmount,
} from "@/lib/lifemap-utils";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GoalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  finance: { netWorthLkr: number; monthlyNetLkr: number };
  onEdit: () => void;
}

export default function GoalDetailDialog({
  open,
  onOpenChange,
  goal,
  finance,
  onEdit,
}: GoalDetailDialogProps) {
  if (!goal) return null;

  const styles = GOAL_CATEGORY_STYLES[goal.category];
  const progress = getGoalProgressPercent(goal, finance);
  const current = resolveGoalCurrentAmount(goal, finance);
  const projection = goal.targetAmount
    ? getFinancialProjection(goal.targetAmount, current, finance.monthlyNetLkr)
    : null;
  const milestones = getMilestoneProgress(goal.milestones);

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
            <span className="text-5xl leading-none">{goal.coverEmoji ?? "🎯"}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {goal.title}
              </h2>
              {goal.targetDate ? (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Target {format(parseISO(goal.targetDate), "MMMM d, yyyy")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                styles.badge,
              )}
            >
              {GOAL_CATEGORY_LABELS[goal.category]}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              {GOAL_STATUS_LABELS[goal.status]}
            </span>
          </div>

          {goal.description ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {goal.description}
            </p>
          ) : null}

          {goal.targetAmount ? (
            <div className="mt-5 rounded-xl border border-border/50 bg-card/70 p-4">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/80 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {formatLkr(current)} / {formatLkr(goal.targetAmount)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatProjectionSavingsLine(projection)}
              </p>
            </div>
          ) : null}

          {milestones.total > 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{milestones.label}</p>
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
            Edit goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
