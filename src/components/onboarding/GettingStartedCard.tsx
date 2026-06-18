"use client";

import Link from "next/link";
import { Check, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/OnboardingContext";
import { isChecklistComplete } from "@/lib/onboarding-utils";
import { cn } from "@/lib/utils";

interface GettingStartedCardProps {
  contactCount: number;
  walletCount: number;
  noteCount: number;
  goalCount: number;
  hasIntegration: boolean;
}

const CHECKLIST_ITEMS = [
  {
    id: "account",
    label: "Created your account",
    href: null,
    isAccount: true,
  },
  {
    id: "contact",
    label: "Added your first contact",
    href: "/contacts",
    metric: "contactCount" as const,
  },
  {
    id: "wallet",
    label: "Created a wallet",
    href: "/finance",
    metric: "walletCount" as const,
  },
  {
    id: "note",
    label: "Saved a note",
    href: "/brain",
    metric: "noteCount" as const,
  },
  {
    id: "goal",
    label: "Added a life goal",
    href: "/lifemap",
    metric: "goalCount" as const,
  },
  {
    id: "integration",
    label: "Connected an integration",
    href: "/settings?section=integrations",
    metric: "hasIntegration" as const,
  },
] as const;

export default function GettingStartedCard({
  contactCount,
  walletCount,
  noteCount,
  goalCount,
  hasIntegration,
}: GettingStartedCardProps) {
  const { state, dismissChecklist } = useOnboarding();

  if (!state || state.checklistDismissed) return null;

  const metrics = {
    contactCount,
    walletCount,
    noteCount,
    goalCount,
    hasIntegration,
  };

  if (isChecklistComplete(metrics)) return null;

  const completedCount = CHECKLIST_ITEMS.filter((item) => {
    if (item.id === "account") return true;
    if (item.id === "integration") return hasIntegration;
    if (item.id === "contact") return metrics.contactCount > 0;
    if (item.id === "wallet") return metrics.walletCount > 0;
    if (item.id === "note") return metrics.noteCount > 0;
    if (item.id === "goal") return metrics.goalCount > 0;
    return false;
  }).length;

  const progress = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Getting started
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedCount} of {CHECKLIST_ITEMS.length} complete
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={() => void dismissChecklist()}
        >
          <X className="size-4" />
          Dismiss
        </Button>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="mt-5 space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const done =
            item.id === "account"
              ? true
              : item.id === "integration"
                ? hasIntegration
                : item.id === "contact"
                  ? metrics.contactCount > 0
                  : item.id === "wallet"
                    ? metrics.walletCount > 0
                    : item.id === "note"
                      ? metrics.noteCount > 0
                      : metrics.goalCount > 0;

          const content = (
            <>
              {done ? (
                <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/50" />
              )}
              <span
                className={cn(
                  "text-sm",
                  done ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {item.label}
              </span>
            </>
          );

          return (
            <li key={item.id}>
              {item.href && !done ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-muted/40"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-2.5 px-1 py-1">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
