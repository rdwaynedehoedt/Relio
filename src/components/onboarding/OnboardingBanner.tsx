"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PAGE_ONBOARDING_STEPS,
  PAGE_ONBOARDING_THEMES,
  type OnboardingStep,
} from "@/lib/onboarding-utils";
import type { OnboardingPage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OnboardingBannerProps {
  page: OnboardingPage;
  visible: boolean;
  onSkip: () => void;
}

export default function OnboardingBanner({
  page,
  visible,
  onSkip,
}: OnboardingBannerProps) {
  const steps = PAGE_ONBOARDING_STEPS[page];
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
    }
  }, [visible, page]);

  const step = steps[stepIndex] as OnboardingStep | undefined;
  const theme = PAGE_ONBOARDING_THEMES[page];
  const isLastStep = stepIndex >= steps.length - 1;

  useEffect(() => {
    if (!visible || !step?.highlightId) return;

    const element = document.getElementById(step.highlightId);
    if (!element) return;

    element.classList.add("onboarding-highlight");

    return () => {
      element.classList.remove("onboarding-highlight");
    };
  }, [visible, step?.highlightId, stepIndex]);

  if (!visible || !step || steps.length === 0) return null;

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        theme.bg,
        theme.border,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none" aria-hidden>
            {step.emoji}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <span className="text-xs font-medium text-muted-foreground">
          Step {stepIndex + 1} of {steps.length}
        </span>

        {!isLastStep ? (
          <Button size="sm" onClick={() => setStepIndex((current) => current + 1)}>
            Next
          </Button>
        ) : null}

        <Button size="sm" variant="ghost" onClick={onSkip}>
          Skip
        </Button>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="Dismiss onboarding"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
