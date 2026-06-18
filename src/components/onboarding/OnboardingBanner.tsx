"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { PAGE_ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding-utils";
import {
  clearTourStep,
  getHoleClipPath,
  getPopoverPosition,
  getSavedTourStep,
  getSpotlightRect,
  getTourTarget,
  OVERLAY_COLOR,
  POPOVER_WIDTH,
  saveTourStep,
  scheduleTourMeasure,
  scrollAndMeasure,
  type PopoverPlacement,
  type SpotlightRect,
} from "@/lib/onboarding-tour";
import type { OnboardingPage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OnboardingBannerProps {
  page: OnboardingPage;
  visible: boolean;
  onSkip: () => void;
}

function TourBackdrop({
  spotlight,
  fullScreen,
}: {
  spotlight: SpotlightRect | null;
  fullScreen: boolean;
}) {
  const clipPath =
    spotlight && !fullScreen ? getHoleClipPath(spotlight) : undefined;

  return (
    <div
      className="pointer-events-auto fixed inset-0 backdrop-blur-[2px] tour-fade-in"
      style={{
        backgroundColor: OVERLAY_COLOR,
        clipPath,
        WebkitClipPath: clipPath,
      }}
      aria-hidden
    />
  );
}

function PopoverArrow({
  placement,
  offset,
}: {
  placement: PopoverPlacement;
  offset: number;
}) {
  const base =
    "absolute size-0 border-[7px] border-transparent";

  if (placement === "left") {
    return (
      <span
        className={cn(base, "-right-3.5 border-l-card")}
        style={{ top: offset - 7 }}
        aria-hidden
      />
    );
  }

  if (placement === "right") {
    return (
      <span
        className={cn(base, "-left-3.5 border-r-card")}
        style={{ top: offset - 7 }}
        aria-hidden
      />
    );
  }

  if (placement === "above") {
    return (
      <span
        className={cn(base, "-bottom-3.5 border-t-card")}
        style={{ left: offset - 7 }}
        aria-hidden
      />
    );
  }

  if (placement === "below") {
    return (
      <span
        className={cn(base, "-top-3.5 border-b-card")}
        style={{ left: offset - 7 }}
        aria-hidden
      />
    );
  }

  return null;
}

export default function OnboardingBanner({
  page,
  visible,
  onSkip,
}: OnboardingBannerProps) {
  const steps = PAGE_ONBOARDING_STEPS[page];
  const popoverRef = useRef<HTMLDivElement>(null);

  const [stepIndex, setStepIndex] = useState(() => getSavedTourStep(page));
  const [mounted, setMounted] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [popoverPos, setPopoverPos] = useState({
    top: 0,
    left: 0,
    placement: "center" as PopoverPlacement,
    arrowOffset: POPOVER_WIDTH / 2,
  });
  const [popoverHeight, setPopoverHeight] = useState(180);
  const [popoverMeasured, setPopoverMeasured] = useState(false);

  const step = steps[stepIndex] as OnboardingStep | undefined;
  const isLastStep = stepIndex >= steps.length - 1;
  const hasTarget = Boolean(step?.target);
  const showNext = !hasTarget || (!step?.isAction && !isLastStep);

  const handleSkip = useCallback(() => {
    clearTourStep(page);
    onSkip();
  }, [onSkip, page]);

  const measureLayout = useCallback(() => {
    if (!step) return;

    const target = getTourTarget(step.target);
    const nextSpotlight = getSpotlightRect(target);
    setSpotlight(nextSpotlight);

    const measuredHeight = popoverRef.current?.offsetHeight ?? popoverHeight;
    if (measuredHeight !== popoverHeight) {
      setPopoverHeight(measuredHeight);
    }
    setPopoverPos(getPopoverPosition(nextSpotlight, measuredHeight));
    setPopoverMeasured(true);
  }, [step, popoverHeight]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const saved = getSavedTourStep(page);
    setStepIndex(Math.min(saved, Math.max(steps.length - 1, 0)));
  }, [page, steps.length]);

  useEffect(() => {
    setPopoverMeasured(false);
  }, [stepIndex, step]);

  useLayoutEffect(() => {
    if (!visible || !step) return;

    const target = getTourTarget(step.target);
    let resizeObserver: ResizeObserver | null = null;
    let activeTarget: HTMLElement | null = null;
    let cancelled = false;

    const measure = () => {
      scheduleTourMeasure(measureLayout);
    };

    if (target) {
      activeTarget = target;
      target.classList.add("tour-target-active");

      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(target);

      if (target.parentElement) {
        resizeObserver.observe(target.parentElement);
      }

      void scrollAndMeasure(target, () => {
        if (!cancelled) {
          measure();
        }
      });
    } else {
      measureLayout();
    }

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);

    return () => {
      cancelled = true;
      if (activeTarget) {
        activeTarget.classList.remove("tour-target-active");
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [visible, step, stepIndex, measureLayout]);

  useLayoutEffect(() => {
    if (!popoverRef.current) return;
    const measured = popoverRef.current.offsetHeight;
    if (measured !== popoverHeight) {
      setPopoverHeight(measured);
      setPopoverPos(getPopoverPosition(spotlight, measured));
      setPopoverMeasured(true);
    }
  }, [step, stepIndex, spotlight, popoverHeight]);

  useEffect(() => {
    if (!visible || !step?.target) return;

    const target = getTourTarget(step.target);
    if (!target) return;

    const handleTargetClick = () => {
      if (step.isAction || isLastStep) {
        saveTourStep(page, stepIndex);
        return;
      }

      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      saveTourStep(page, nextIndex);
    };

    target.addEventListener("click", handleTargetClick);

    return () => {
      target.removeEventListener("click", handleTargetClick);
    };
  }, [visible, step, stepIndex, isLastStep, page]);

  if (!visible || !step || steps.length === 0 || !mounted) return null;

  const content = (
    <>
      <div className="tour-overlay-root animate-in fade-in duration-300">
        <TourBackdrop
          spotlight={hasTarget ? spotlight : null}
          fullScreen={!hasTarget || !spotlight}
        />

        {hasTarget && spotlight ? (
          <div
            className="pointer-events-none fixed rounded-lg border-2 border-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.35)] tour-spotlight-ring"
            style={{
              left: spotlight.x,
              top: spotlight.y,
              width: spotlight.width,
              height: spotlight.height,
            }}
            aria-hidden
          />
        ) : null}

        <button
          type="button"
          onClick={handleSkip}
          className="pointer-events-auto fixed top-5 right-5 z-[2] rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          Skip tour
        </button>
      </div>

      <div
        ref={popoverRef}
        role="dialog"
        aria-labelledby="onboarding-tour-title"
        className={cn(
          "pointer-events-auto fixed rounded-xl border border-border/60 bg-card p-4 shadow-xl tour-step-enter",
          step.isAction ? "z-[95]" : "z-[90]",
        )}
        style={{
          top: popoverPos.top,
          left: popoverPos.left,
          width: POPOVER_WIDTH,
          opacity: popoverMeasured ? 1 : 0,
          transition: "opacity 150ms ease",
        }}
      >
        <PopoverArrow
          placement={popoverPos.placement}
          offset={popoverPos.arrowOffset}
        />

        <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
          {stepIndex + 1} of {steps.length}
        </p>

        <h3
          id="onboarding-tour-title"
          className="mt-2 text-sm font-semibold text-foreground"
        >
          {step.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {step.description}
        </p>

        {hasTarget ? (
          <p className="mt-3 text-xs font-medium text-foreground">
            {step.isAction || isLastStep
              ? "Click the highlighted area"
              : "Click it, or press Next"}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          {showNext ? (
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                const nextIndex = stepIndex + 1;
                setStepIndex(nextIndex);
                saveTourStep(page, nextIndex);
              }}
            >
              Next
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-muted-foreground"
            onClick={handleSkip}
          >
            Skip
          </Button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
