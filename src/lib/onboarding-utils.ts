import type { OnboardingPage, OnboardingState } from "@/lib/types";

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  welcomeDone: false,
  pagesCompleted: {
    contacts: false,
    companies: false,
    finance: false,
    brain: false,
    lifemap: false,
  },
};

export interface OnboardingStep {
  emoji: string;
  title: string;
  description: string;
  highlightId?: string;
}

export const PAGE_ONBOARDING_THEMES: Record<
  OnboardingPage,
  { bg: string; border: string }
> = {
  contacts: {
    bg: "bg-blue-500/8 dark:bg-blue-400/10",
    border: "border-blue-500/20",
  },
  companies: {
    bg: "bg-violet-500/8 dark:bg-violet-400/10",
    border: "border-violet-500/20",
  },
  finance: {
    bg: "bg-emerald-500/8 dark:bg-emerald-400/10",
    border: "border-emerald-500/20",
  },
  brain: {
    bg: "bg-amber-500/8 dark:bg-amber-400/10",
    border: "border-amber-500/20",
  },
  lifemap: {
    bg: "bg-rose-500/8 dark:bg-rose-400/10",
    border: "border-rose-500/20",
  },
};

export const CONTACTS_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    emoji: "👥",
    title: "Your relationship network starts here",
    description:
      "Relio keeps track of everyone you know — contacts, their companies, and your history with them.",
  },
  {
    emoji: "🔌",
    title: "Import or add manually",
    description:
      "You can import from HubSpot, Google Contacts, LinkedIn or your phone — or add contacts one by one.",
    highlightId: "onboarding-import-btn",
  },
  {
    emoji: "✨",
    title: "Add your first contact",
    description: "Let's add someone you work with right now.",
    highlightId: "onboarding-add-contact-btn",
  },
];

export const FINANCE_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    emoji: "💰",
    title: "Track your money across currencies",
    description:
      "Relio supports LKR, USD, GBP, AED, AUD — see your real net worth in one place.",
  },
  {
    emoji: "📊",
    title: "Live exchange rates built in",
    description:
      "Rates update daily from mid-market data. Every wallet shows its LKR equivalent automatically.",
  },
  {
    emoji: "🏦",
    title: "Create your first wallet",
    description: "Start with your main bank account or cash wallet.",
    highlightId: "onboarding-add-wallet-btn",
  },
];

export const BRAIN_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    emoji: "🧠",
    title: "Capture everything that matters",
    description:
      "Ideas, articles, meeting notes, decisions — all in one searchable place, tagged and organised.",
  },
  {
    emoji: "✨",
    title: "Save your first thought",
    description: "What's on your mind right now?",
    highlightId: "onboarding-new-note-btn",
  },
];

export const LIFEMAP_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    emoji: "🗺️",
    title: "Your life, mapped out",
    description:
      "Plot your big goals on a timeline — buy a house, travel the world, build something great. Relio connects them to your real financial data.",
  },
  {
    emoji: "🎯",
    title: "Add your first life goal",
    description: "Start with something big you're working towards.",
    highlightId: "onboarding-new-goal-btn",
  },
];

export const PAGE_ONBOARDING_STEPS: Record<OnboardingPage, OnboardingStep[]> = {
  contacts: CONTACTS_ONBOARDING_STEPS,
  companies: [],
  finance: FINANCE_ONBOARDING_STEPS,
  brain: BRAIN_ONBOARDING_STEPS,
  lifemap: LIFEMAP_ONBOARDING_STEPS,
};

export function isChecklistComplete(metrics: {
  contactCount: number;
  walletCount: number;
  noteCount: number;
  goalCount: number;
  hasIntegration: boolean;
}): boolean {
  return (
    metrics.contactCount > 0 &&
    metrics.walletCount > 0 &&
    metrics.noteCount > 0 &&
    metrics.goalCount > 0 &&
    metrics.hasIntegration
  );
}
