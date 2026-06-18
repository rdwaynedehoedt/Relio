import {
  addMonths,
  addYears,
  differenceInDays,
  endOfMonth,
  endOfYear,
  format,
  formatDistanceToNow,
  getDaysInMonth,
  parseISO,
  startOfMonth,
  startOfYear,
} from "date-fns";
import {
  Briefcase,
  Heart,
  Home,
  Landmark,
  Plane,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { formatLkr } from "@/lib/finance-utils";
import type {
  Goal,
  GoalCategory,
  GoalStatus,
  LifeEvent,
  LifeEventCategory,
  LifeEventMood,
  Milestone,
} from "@/lib/types";

export const GOAL_CATEGORIES: GoalCategory[] = [
  "home",
  "travel",
  "finance",
  "business",
  "health",
  "life",
];

export const GOAL_STATUSES: GoalStatus[] = [
  "dream",
  "active",
  "achieved",
  "paused",
];

export const BOARD_COLUMNS: { status: GoalStatus; label: string }[] = [
  { status: "dream", label: "Dreams" },
  { status: "active", label: "Active" },
  { status: "achieved", label: "Achieved" },
];

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  home: "Home",
  travel: "Travel",
  finance: "Finance",
  business: "Business",
  health: "Health",
  life: "Life",
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  dream: "Dream",
  active: "Active",
  achieved: "Achieved",
  paused: "Paused",
};

export const GOAL_CATEGORY_ICONS: Record<GoalCategory, LucideIcon> = {
  home: Home,
  travel: Plane,
  finance: Landmark,
  business: Briefcase,
  health: Heart,
  life: Sparkles,
};

export const GOAL_CATEGORY_STYLES: Record<
  GoalCategory,
  {
    node: string;
    nodeRing: string;
    card: string;
    border: string;
    badge: string;
    line: string;
    progress: string;
  }
> = {
  home: {
    node: "bg-amber-500 text-white",
    nodeRing: "ring-amber-500/40",
    card: "bg-amber-500/[0.08] dark:bg-amber-500/[0.14]",
    border: "border-amber-500/30",
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    line: "stroke-amber-500/30",
    progress: "text-amber-500",
  },
  travel: {
    node: "bg-sky-500 text-white",
    nodeRing: "ring-sky-500/40",
    card: "bg-sky-500/[0.08] dark:bg-sky-500/[0.14]",
    border: "border-sky-500/30",
    badge: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
    line: "stroke-sky-500/30",
    progress: "text-sky-500",
  },
  finance: {
    node: "bg-emerald-500 text-white",
    nodeRing: "ring-emerald-500/40",
    card: "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.14]",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    line: "stroke-emerald-500/30",
    progress: "text-emerald-500",
  },
  business: {
    node: "bg-violet-500 text-white",
    nodeRing: "ring-violet-500/40",
    card: "bg-violet-500/[0.08] dark:bg-violet-500/[0.14]",
    border: "border-violet-500/30",
    badge: "bg-violet-500/15 text-violet-800 dark:text-violet-300",
    line: "stroke-violet-500/30",
    progress: "text-violet-500",
  },
  health: {
    node: "bg-rose-500 text-white",
    nodeRing: "ring-rose-500/40",
    card: "bg-rose-500/[0.08] dark:bg-rose-500/[0.14]",
    border: "border-rose-500/30",
    badge: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
    line: "stroke-rose-500/30",
    progress: "text-rose-500",
  },
  life: {
    node: "bg-slate-500 text-white",
    nodeRing: "ring-slate-500/40",
    card: "bg-slate-500/[0.08] dark:bg-slate-500/[0.14]",
    border: "border-slate-500/30",
    badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    line: "stroke-slate-500/30",
    progress: "text-slate-500",
  },
};

export const CATEGORY_EMOJIS: Record<GoalCategory, string[]> = {
  home: ["🏠", "🏡", "🔑", "🛋️", "🪴", "🏗️"],
  travel: ["✈️", "🌍", "🗺️", "🏖️", "🎒", "🚢"],
  finance: ["💰", "📈", "🏦", "💎", "🪙", "💳"],
  business: ["🚀", "💼", "📊", "🤝", "🏢", "⚡"],
  health: ["💪", "🧘", "🏃", "🥗", "❤️", "🩺"],
  life: ["✨", "🌟", "🎯", "🌈", "🎉", "🧭"],
};

export type GoalFormValues = {
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  targetDate: string;
  achievedDate: string;
  targetAmount: string;
  currentAmount: string;
  currency: string;
  coverEmoji: string;
  isPinned: boolean;
  milestones: Milestone[];
  useFinanceLink: boolean;
};

export const emptyGoalForm = (): GoalFormValues => ({
  title: "",
  description: "",
  category: "life",
  status: "dream",
  targetDate: "",
  achievedDate: "",
  targetAmount: "",
  currentAmount: "",
  currency: "LKR",
  coverEmoji: "🎯",
  isPinned: false,
  milestones: [],
  useFinanceLink: false,
});

export function goalToFormValues(goal: Goal): GoalFormValues {
  return {
    title: goal.title,
    description: goal.description ?? "",
    category: goal.category,
    status: goal.status,
    targetDate: goal.targetDate ?? "",
    achievedDate: goal.achievedDate ?? "",
    targetAmount:
      goal.targetAmount !== undefined ? String(goal.targetAmount) : "",
    currentAmount:
      goal.financeLink
        ? ""
        : goal.currentAmount !== undefined
          ? String(goal.currentAmount)
          : "",
    currency: goal.currency ?? "LKR",
    coverEmoji: goal.coverEmoji ?? CATEGORY_EMOJIS[goal.category][0],
    isPinned: goal.isPinned ?? false,
    milestones: goal.milestones ?? [],
    useFinanceLink: goal.financeLink ?? shouldLinkToFinance(goal),
  };
}

export function getTimelineBounds(birthYear?: number) {
  const currentYear = new Date().getFullYear();
  const startYear = birthYear ?? currentYear - 30;
  const endYear = currentYear + 20;
  const viewStartYear = currentYear - 10;
  const viewEndYear = currentYear + 10;

  return { startYear, endYear, viewStartYear, viewEndYear, currentYear };
}

export function getTimelineStartDate(startYear: number): Date {
  return new Date(startYear, 0, 1);
}

export function getTimelineEndDate(endYear: number): Date {
  return new Date(endYear, 11, 31, 23, 59, 59);
}

export function getDatePositionPercent(
  dateIso: string,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const date = parseISO(dateIso).getTime();
  const start = rangeStart.getTime();
  const end = rangeEnd.getTime();

  if (end <= start) return 0;

  const percent = ((date - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, percent));
}

const FINANCE_LINK_KEYWORDS = [
  "house",
  "home",
  "car",
  "net worth",
  "savings",
  "mortgage",
  "deposit",
  "investment",
  "retire",
];

export function shouldLinkToFinance(goal: Goal): boolean {
  if (goal.category !== "finance" && !goal.targetAmount) return false;

  const title = goal.title.toLowerCase();
  return FINANCE_LINK_KEYWORDS.some((keyword) => title.includes(keyword));
}

export function isNetWorthGoal(goal: Goal): boolean {
  const title = goal.title.toLowerCase();
  return title.includes("net worth") || title.includes("networth");
}

export function isSavingsGoal(goal: Goal): boolean {
  const title = goal.title.toLowerCase();
  return title.includes("savings") || title.includes("save");
}

export function isFinanceLinked(goal: Goal): boolean {
  return Boolean(goal.financeLink) || shouldLinkToFinance(goal);
}

export function resolveGoalCurrentAmount(
  goal: Goal,
  finance: { netWorthLkr: number; monthlyNetLkr: number },
): number {
  if (!isFinanceLinked(goal)) {
    return goal.currentAmount ?? 0;
  }

  if (isSavingsGoal(goal)) {
    return Math.max(0, finance.monthlyNetLkr);
  }

  if (isNetWorthGoal(goal) || goal.category === "finance" || goal.category === "home") {
    return finance.netWorthLkr;
  }

  if (goal.targetAmount) {
    return finance.netWorthLkr;
  }

  return finance.netWorthLkr;
}

export function getGoalProgressPercent(
  goal: Goal,
  finance: { netWorthLkr: number; monthlyNetLkr: number },
): number {
  if (!goal.targetAmount || goal.targetAmount <= 0) return 0;

  const current = resolveGoalCurrentAmount(goal, finance);
  return Math.min(100, Math.round((current / goal.targetAmount) * 100));
}

export function getMilestoneProgress(milestones?: Milestone[]) {
  if (!milestones?.length) {
    return { completed: 0, total: 0, label: "No milestones" };
  }

  const completed = milestones.filter((item) => item.completed).length;
  return {
    completed,
    total: milestones.length,
    label: `${completed}/${milestones.length} milestones done`,
  };
}

export interface FinancialProjection {
  monthsNeeded: number;
  estimatedDate: Date;
  monthlyNet: number;
  remaining: number;
}

export function getFinancialProjection(
  targetAmount: number,
  currentAmount: number,
  monthlyNet: number,
): FinancialProjection | null {
  if (monthlyNet <= 0) return null;

  const remaining = Math.max(0, targetAmount - currentAmount);
  if (remaining <= 0) {
    return {
      monthsNeeded: 0,
      estimatedDate: new Date(),
      monthlyNet,
      remaining: 0,
    };
  }

  const monthsNeeded = Math.ceil(remaining / monthlyNet);
  return {
    monthsNeeded,
    estimatedDate: addMonths(new Date(), monthsNeeded),
    monthlyNet,
    remaining,
  };
}

export function formatProjectionMessage(
  projection: FinancialProjection | null,
  currency = "LKR",
): string {
  if (!projection) {
    return "Add income transactions to Finance to see your projected timeline.";
  }

  if (projection.remaining <= 0) {
    return "You've already reached this target based on your current progress.";
  }

  const monthlyLabel =
    currency === "LKR"
      ? formatLkr(projection.monthlyNet)
      : `${currency} ${projection.monthlyNet.toLocaleString()}`;

  return `At your current monthly savings rate of ${monthlyLabel}, you will reach this goal in approximately ${projection.monthsNeeded} month${projection.monthsNeeded === 1 ? "" : "s"} (by ${format(projection.estimatedDate, "MMMM yyyy")}).`;
}

export function getSavingsRatePercent(
  incomeLkr: number,
  expenseLkr: number,
): number | null {
  if (incomeLkr <= 0) return null;
  return Math.round(((incomeLkr - expenseLkr) / incomeLkr) * 100);
}

export function sortGoalsForBoard(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
    if (pinDiff !== 0) return pinDiff;

    return (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999");
  });
}

export function getNodeSize(isPinned: boolean): number {
  return isPinned ? 56 : 44;
}

export function createMilestone(title: string): Milestone {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `ms-${Date.now()}`,
    title,
    completed: false,
  };
}

export type TimelineZoom = "month" | "year" | "fiveYear";

export const TIMELINE_ZOOM_OPTIONS: { value: TimelineZoom; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "fiveYear", label: "5 Year" },
];

export function getZoomRange(zoom: TimelineZoom, anchor: Date) {
  if (zoom === "month") {
    return {
      start: startOfMonth(anchor),
      end: endOfMonth(anchor),
      title: format(anchor, "MMMM yyyy"),
    };
  }

  if (zoom === "year") {
    return {
      start: startOfYear(anchor),
      end: endOfYear(anchor),
      title: format(anchor, "yyyy"),
    };
  }

  const year = anchor.getFullYear();
  return {
    start: new Date(year - 2, 0, 1),
    end: new Date(year + 2, 11, 31, 23, 59, 59),
    title: `${year - 2} – ${year + 2}`,
  };
}

export function navigateZoomAnchor(
  zoom: TimelineZoom,
  anchor: Date,
  direction: -1 | 1,
): Date {
  if (zoom === "month") return addMonths(anchor, direction);
  if (zoom === "year") return addYears(anchor, direction);
  return addYears(anchor, direction * 5);
}

export function getTimelineWidth(zoom: TimelineZoom, anchor: Date): number {
  if (zoom === "month") {
    return getDaysInMonth(anchor) * 44;
  }
  if (zoom === "year") {
    return 12 * 88;
  }
  return 5 * 140;
}

export function filterGoalsForZoom(
  goals: Goal[],
  zoom: TimelineZoom,
  anchor: Date,
): Goal[] {
  if (zoom === "fiveYear") {
    return goals.filter((goal) => goal.status === "active");
  }

  const { start, end } = getZoomRange(zoom, anchor);
  return goals.filter((goal) => {
    if (!goal.targetDate) return false;
    const date = parseISO(goal.targetDate);
    return date >= start && date <= end;
  });
}

export function filterEventsForZoom(
  events: LifeEvent[],
  zoom: TimelineZoom,
  anchor: Date,
): LifeEvent[] {
  const { start, end } = getZoomRange(zoom, anchor);
  return events.filter((event) => {
    const date = parseISO(event.date);
    return date >= start && date <= end;
  });
}

export function formatShortProjection(
  goal: Goal,
  finance: { netWorthLkr: number; monthlyNetLkr: number },
): string | null {
  if (!goal.targetAmount) return null;

  const current = resolveGoalCurrentAmount(goal, finance);
  const projection = getFinancialProjection(
    goal.targetAmount,
    current,
    finance.monthlyNetLkr,
  );

  if (!projection || projection.remaining <= 0) return null;
  return `~${projection.monthsNeeded} month${projection.monthsNeeded === 1 ? "" : "s"} away at current savings rate`;
}

export function formatRelativeEventDate(dateIso: string): string {
  const date = parseISO(dateIso);
  const days = differenceInDays(new Date(), date);

  if (days < 0) {
    return format(date, "MMM d, yyyy");
  }

  if (days < 60) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  const years = Math.floor(days / 365);
  if (years >= 1) {
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

export const LIFE_EVENT_CATEGORIES: LifeEventCategory[] = [
  "personal",
  "travel",
  "finance",
  "career",
  "health",
  "milestone",
];

export const LIFE_EVENT_CATEGORY_LABELS: Record<LifeEventCategory, string> = {
  personal: "Personal",
  travel: "Travel",
  finance: "Finance",
  career: "Career",
  health: "Health",
  milestone: "Milestone",
};

export const LIFE_EVENT_MOODS: {
  value: LifeEventMood;
  emoji: string;
  label: string;
  className: string;
}[] = [
  {
    value: "amazing",
    emoji: "🤩",
    label: "Amazing",
    className: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  {
    value: "good",
    emoji: "😊",
    label: "Good",
    className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  },
  {
    value: "neutral",
    emoji: "😐",
    label: "Neutral",
    className: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  },
  {
    value: "hard",
    emoji: "😔",
    label: "Hard",
    className: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
  },
];

export const LIFE_EVENT_MOOD_EMOJI: Record<LifeEventMood, string> = {
  amazing: "🤩",
  good: "😊",
  neutral: "😐",
  hard: "😔",
};

export const LIFE_EVENT_CATEGORY_STYLES: Record<
  LifeEventCategory,
  { node: string; card: string; border: string; badge: string }
> = {
  personal: {
    node: "bg-pink-500",
    card: "bg-pink-500/[0.08] dark:bg-pink-500/[0.14]",
    border: "border-pink-500/30",
    badge: "bg-pink-500/15 text-pink-800 dark:text-pink-300",
  },
  travel: {
    node: "bg-sky-500",
    card: "bg-sky-500/[0.08] dark:bg-sky-500/[0.14]",
    border: "border-sky-500/30",
    badge: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  },
  finance: {
    node: "bg-emerald-500",
    card: "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.14]",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  },
  career: {
    node: "bg-violet-500",
    card: "bg-violet-500/[0.08] dark:bg-violet-500/[0.14]",
    border: "border-violet-500/30",
    badge: "bg-violet-500/15 text-violet-800 dark:text-violet-300",
  },
  health: {
    node: "bg-rose-500",
    card: "bg-rose-500/[0.08] dark:bg-rose-500/[0.14]",
    border: "border-rose-500/30",
    badge: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
  },
  milestone: {
    node: "bg-amber-400",
    card: "bg-amber-500/[0.08] dark:bg-amber-500/[0.14]",
    border: "border-amber-500/30",
    badge: "bg-amber-500/15 text-amber-900 dark:text-amber-300",
  },
};

export const LIFE_EVENT_EMOJIS: Record<LifeEventCategory, string[]> = {
  personal: ["✨", "❤️", "🎂", "👨‍👩‍👧", "💍", "🏠"],
  travel: ["✈️", "🌍", "🏖️", "🗺️", "🎒", "🌅"],
  finance: ["💰", "📈", "🏦", "💳", "🪙", "💎"],
  career: ["🚀", "💼", "🎓", "🏆", "📣", "⭐"],
  health: ["💪", "🧘", "🏃", "🥗", "❤️‍🩹", "🩺"],
  milestone: ["🎯", "🏅", "🎉", "🌟", "📌", "🔔"],
};

export type LifeEventFormValues = {
  title: string;
  description: string;
  date: string;
  category: LifeEventCategory;
  emoji: string;
  mood?: LifeEventMood;
};

export const emptyLifeEventForm = (): LifeEventFormValues => ({
  title: "",
  description: "",
  date: format(new Date(), "yyyy-MM-dd"),
  category: "personal",
  emoji: "✨",
  mood: undefined,
});

export function lifeEventToFormValues(event: LifeEvent): LifeEventFormValues {
  return {
    title: event.title,
    description: event.description ?? "",
    date: event.date,
    category: event.category,
    emoji: event.emoji ?? LIFE_EVENT_EMOJIS[event.category][0],
    mood: event.mood,
  };
}

export function formatProjectionSavingsLine(
  projection: FinancialProjection | null,
): string {
  if (!projection) {
    return "Add income to Finance for projection";
  }
  if (projection.remaining <= 0) return "Target reached";
  return `At ${formatLkr(projection.monthlyNet)}/month savings → reach in ${projection.monthsNeeded} month${projection.monthsNeeded === 1 ? "" : "s"}`;
}
