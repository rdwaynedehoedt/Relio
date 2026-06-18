"use client";

import { format, parseISO } from "date-fns";
import {
  BOARD_COLUMNS,
  getGoalProgressPercent,
  getMilestoneProgress,
  GOAL_CATEGORY_STYLES,
  resolveGoalCurrentAmount,
  sortGoalsForBoard,
} from "@/lib/lifemap-utils";
import { formatLkr } from "@/lib/finance-utils";
import type { Goal, GoalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BoardViewProps {
  goals: Goal[];
  finance: { netWorthLkr: number; monthlyNetLkr: number };
  onGoalClick: (goal: Goal) => void;
  onStatusChange: (goalId: string, status: GoalStatus) => void;
}

export default function BoardView({
  goals,
  finance,
  onGoalClick,
  onStatusChange,
}: BoardViewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {BOARD_COLUMNS.map((column) => {
        const columnGoals = sortGoalsForBoard(
          goals.filter((goal) => goal.status === column.status),
        );

        return (
          <div
            key={column.status}
            className="flex min-h-[420px] flex-col rounded-2xl border border-border/60 bg-muted/10"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const goalId = event.dataTransfer.getData("goalId");
              if (goalId) onStatusChange(goalId, column.status);
            }}
          >
            <div className="border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                {column.label}
              </h3>
              <p className="text-xs text-muted-foreground">
                {columnGoals.length} goal{columnGoals.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-3">
              {columnGoals.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/50 px-4 py-10 text-center text-sm text-muted-foreground">
                  Drop goals here
                </div>
              ) : (
                columnGoals.map((goal) => (
                  <GoalBoardCard
                    key={goal.id}
                    goal={goal}
                    finance={finance}
                    onClick={() => onGoalClick(goal)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GoalBoardCard({
  goal,
  finance,
  onClick,
}: {
  goal: Goal;
  finance: { netWorthLkr: number; monthlyNetLkr: number };
  onClick: () => void;
}) {
  const styles = GOAL_CATEGORY_STYLES[goal.category];
  const progress = getGoalProgressPercent(goal, finance);
  const milestones = getMilestoneProgress(goal.milestones);
  const currentAmount = resolveGoalCurrentAmount(goal, finance);

  return (
    <article
      draggable
      onDragStart={(event) => {
        if (goal.id) event.dataTransfer.setData("goalId", goal.id);
      }}
      onClick={onClick}
      className={cn(
        "cursor-grab rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        styles.card,
        styles.border,
      )}
    >
      <div className="text-center text-3xl">{goal.coverEmoji ?? "🎯"}</div>

      <h4 className="mt-3 text-center text-sm font-bold text-foreground">
        {goal.title}
      </h4>

      {goal.targetDate ? (
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {format(parseISO(goal.targetDate), "MMM d, yyyy")}
        </p>
      ) : null}

      {goal.targetAmount ? (
        <div className="mt-4 space-y-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/80 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            {formatLkr(currentAmount)} / {formatLkr(goal.targetAmount ?? 0)} ·{" "}
            {progress}%
          </p>
        </div>
      ) : null}

      {milestones.total > 0 ? (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {milestones.label}
        </p>
      ) : null}
    </article>
  );
}
