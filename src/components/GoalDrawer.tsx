"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CATEGORY_EMOJIS,
  createMilestone,
  emptyGoalForm,
  formatProjectionMessage,
  getFinancialProjection,
  GOAL_CATEGORIES,
  GOAL_CATEGORY_ICONS,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_STYLES,
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  goalToFormValues,
  isFinanceLinked,
  resolveGoalCurrentAmount,
  type GoalFormValues,
} from "@/lib/lifemap-utils";
import { formatLkr } from "@/lib/finance-utils";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GoalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  goal?: Goal | null;
  finance: {
    netWorthLkr: number;
    monthlyNetLkr: number;
  };
  onSave: (values: GoalFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function GoalDrawer({
  open,
  onOpenChange,
  mode,
  goal,
  finance,
  onSave,
  onDelete,
}: GoalDrawerProps) {
  const [values, setValues] = useState<GoalFormValues>(emptyGoalForm());
  const [milestoneInput, setMilestoneInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setValues(
      mode === "edit" && goal ? goalToFormValues(goal) : emptyGoalForm(),
    );
    setMilestoneInput("");
    setError(null);
  }, [open, mode, goal]);

  function updateField<K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function addMilestone() {
    const title = milestoneInput.trim();
    if (!title) return;

    updateField("milestones", [
      ...values.milestones,
      createMilestone(title),
    ]);
    setMilestoneInput("");
  }

  function toggleMilestone(id: string) {
    updateField(
      "milestones",
      values.milestones.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed
                ? new Date().toISOString()
                : undefined,
            }
          : item,
      ),
    );
  }

  function removeMilestone(id: string) {
    updateField(
      "milestones",
      values.milestones.filter((item) => item.id !== id),
    );
  }

  const draftGoal = useMemo(
    (): Goal => ({
      userId: goal?.userId ?? "",
      title: values.title,
      category: values.category,
      status: values.status,
      targetAmount: values.targetAmount
        ? Number(values.targetAmount)
        : undefined,
      currentAmount: values.useFinanceLink
        ? undefined
        : values.currentAmount
          ? Number(values.currentAmount)
          : undefined,
      currency: values.currency,
      financeLink: values.useFinanceLink,
    }),
    [goal?.userId, values],
  );

  const linkedCurrentAmount = useMemo(() => {
    if (!values.useFinanceLink) {
      return values.currentAmount ? Number(values.currentAmount) : 0;
    }

    return resolveGoalCurrentAmount(draftGoal, finance);
  }, [draftGoal, finance, values.currentAmount, values.useFinanceLink]);

  const projection = useMemo(() => {
    const target = values.targetAmount ? Number(values.targetAmount) : 0;
    if (!target) return null;

    return getFinancialProjection(
      target,
      linkedCurrentAmount,
      finance.monthlyNetLkr,
    );
  }, [finance.monthlyNetLkr, linkedCurrentAmount, values.targetAmount]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!values.title.trim()) {
      setError("Add a title for your goal.");
      return;
    }

    setSaving(true);

    try {
      await onSave(values);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save goal.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!goal?.id || !onDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await onDelete(goal.id);
      onOpenChange(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete goal.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const categoryStyles = GOAL_CATEGORY_STYLES[values.category];
  const emojiOptions = CATEGORY_EMOJIS[values.category];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle>{mode === "add" ? "New goal" : "Edit goal"}</SheetTitle>
          <SheetDescription>
            Plot dreams, milestones, and financial targets on your life map.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_CATEGORIES.map((category) => {
                  const Icon = GOAL_CATEGORY_ICONS[category];
                  const isActive = values.category === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        updateField("category", category);
                        if (!CATEGORY_EMOJIS[category].includes(values.coverEmoji)) {
                          updateField("coverEmoji", CATEGORY_EMOJIS[category][0]);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? GOAL_CATEGORY_STYLES[category].badge
                          : "border-transparent text-muted-foreground hover:bg-muted/60",
                      )}
                    >
                      <Icon className="size-3.5" />
                      {GOAL_CATEGORY_LABELS[category]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Cover emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => updateField("coverEmoji", emoji)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl border text-xl transition-colors",
                      values.coverEmoji === emoji
                        ? "border-foreground/20 bg-muted shadow-sm"
                        : "border-border/50 hover:bg-muted/50",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Title
              </label>
              <Input
                value={values.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="What do you want to achieve?"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateField("status", status)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      values.status === status
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {GOAL_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Description
              </label>
              <textarea
                value={values.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Why does this matter to you?"
                rows={4}
                className="w-full resize-y rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60 focus:border-border"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Target date
                </label>
                <Input
                  type="date"
                  value={values.targetDate}
                  onChange={(event) =>
                    updateField("targetDate", event.target.value)
                  }
                  className="h-10"
                />
              </div>

              {values.status === "achieved" ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Achieved date
                  </label>
                  <Input
                    type="date"
                    value={values.achievedDate}
                    onChange={(event) =>
                      updateField("achievedDate", event.target.value)
                    }
                    className="h-10"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Financial target
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  min="0"
                  value={values.targetAmount}
                  onChange={(event) =>
                    updateField("targetAmount", event.target.value)
                  }
                  placeholder="Target amount"
                  className="h-10"
                />
                <Input
                  value={values.currency}
                  onChange={(event) =>
                    updateField("currency", event.target.value.toUpperCase())
                  }
                  placeholder="Currency"
                  className="h-10"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={values.useFinanceLink}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    updateField("useFinanceLink", checked);
                    if (checked) {
                      updateField("currentAmount", "");
                    }
                  }}
                  className="size-4 rounded border-border accent-foreground"
                />
                Auto-pull progress from Finance
              </label>

              {!values.useFinanceLink ? (
                <Input
                  type="number"
                  min="0"
                  value={values.currentAmount}
                  onChange={(event) =>
                    updateField("currentAmount", event.target.value)
                  }
                  placeholder="Current amount"
                  className="h-10"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Current progress: {formatLkr(linkedCurrentAmount)}
                  {isFinanceLinked(draftGoal) ? " (linked to Finance)" : ""}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Milestones
              </label>
              <div className="flex gap-2">
                <Input
                  value={milestoneInput}
                  onChange={(event) => setMilestoneInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addMilestone();
                    }
                  }}
                  placeholder="Add a milestone"
                  className="h-9"
                />
                <Button type="button" variant="outline" onClick={addMilestone}>
                  <Plus className="size-4" />
                </Button>
              </div>

              {values.milestones.length > 0 ? (
                <div className="space-y-2">
                  {values.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/60 px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggleMilestone(milestone.id)}
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                          milestone.completed
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600"
                            : "border-border text-transparent",
                        )}
                      >
                        <Check className="size-3" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm",
                            milestone.completed &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {milestone.title}
                        </p>
                        {milestone.completed && milestone.completedAt ? (
                          <p className="text-[11px] text-muted-foreground">
                            {format(
                              parseISO(milestone.completedAt),
                              "MMM d, yyyy",
                            )}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMilestone(milestone.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={values.isPinned}
                onChange={(event) =>
                  updateField("isPinned", event.target.checked)
                }
                className="size-4 rounded border-border accent-foreground"
              />
              Pin as important (larger on timeline)
            </label>

            {values.targetAmount ? (
              <div
                className={cn(
                  "rounded-xl border p-4 text-sm leading-relaxed",
                  categoryStyles.border,
                  categoryStyles.card,
                )}
              >
                <p className="font-medium text-foreground">
                  Financial projection
                </p>
                <p className="mt-2 text-muted-foreground">
                  {formatProjectionMessage(projection, values.currency)}
                </p>
              </div>
            ) : null}

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <SheetFooter className="border-t border-border/60 px-6 py-4">
            <div className="flex w-full flex-wrap items-center gap-2">
              {mode === "edit" && goal?.id && onDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || deleting}
                  onClick={() => void handleDelete()}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={saving || deleting}
                className="ml-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save goal"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
