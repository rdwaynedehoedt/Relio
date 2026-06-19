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
  title: string;
  description: string;
  /** data-tour attribute value on the target element */
  target?: string;
  /** Clicking the target completes the tour UI (drawer open / save still marks done) */
  isAction?: boolean;
}

export const CONTACTS_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Your contacts live here",
    description:
      "Everyone you know is tracked here people, companies, and your history with them.",
  },
  {
    title: "Import existing contacts",
    description:
      "Click here to bring in contacts from HubSpot, Google, LinkedIn, or your phone.",
    target: "import-btn",
  },
  {
    title: "Add your first contact",
    description: "Click here to add someone you work with right now.",
    target: "add-contact-btn",
    isAction: true,
  },
];

export const FINANCE_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Track money across currencies",
    description:
      "Relio supports LKR, USD, GBP, AED, and AUD your net worth in one place.",
  },
  {
    title: "Live exchange rates",
    description:
      "Rates update daily from mid-market data. Every wallet shows its LKR equivalent.",
    target: "exchange-rates",
  },
  {
    title: "Create your first wallet",
    description: "Click here to add your main bank account or cash wallet.",
    target: "add-wallet-btn",
    isAction: true,
  },
];

export const BRAIN_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Capture what matters",
    description:
      "Ideas, articles, meeting notes, and decisions searchable and organised.",
  },
  {
    title: "Save your first note",
    description: "Click here to write down what's on your mind right now.",
    target: "new-note-btn",
    isAction: true,
  },
];

export const LIFEMAP_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Map out your life",
    description:
      "Plot big goals on a timeline and connect them to your real financial data.",
  },
  {
    title: "Add your first goal",
    description: "Click here to add something big you're working towards.",
    target: "new-goal-btn",
    isAction: true,
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
