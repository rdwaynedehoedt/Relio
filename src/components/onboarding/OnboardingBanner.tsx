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
  getOverlayPanels,
  getPopoverPosition,
  getSavedTourStep,
  getSpotlightRect,
  getTourTarget,
  OVERLAY_COLOR,
  POPOVER_WIDTH,
  saveTourStep,
  scrollTourTargetIntoView,
  type OverlayPanel,
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

function OverlayPanels({
  panels,
  fullScreen,
}: {
  panels: OverlayPanel[];
  fullScreen: boolean;
}) {
  if (fullScreen) {
    return (
      <div
        className="pointer-events-auto fixed inset-0 backdrop-blur-[2px] tour-fade-in"
        style={{ backgroundColor: OVERLAY_COLOR }}
        aria-hidden
      />
    );
  }

  return (
    <>
      {panels.map((panel, index) => (
        <div
          key={index}
          className="pointer-events-auto fixed backdrop-blur-[2px] tour-fade-in"
          style={{
            top: panel.top,
            left: panel.left,
            width: panel.width,
            height: panel.height,
            backgroundColor: OVERLAY_COLOR,
          }}
          aria-hidden
        />
      ))}
    </>
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
  const scrollTimerRef = useRef<number | null>(null);

  const [stepIndex, setStepIndex] = useState(() => getSavedTourStep(page));
  const [mounted, setMounted] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [overlayPanels, setOverlayPanels] = useState<OverlayPanel[]>([]);
  const [popoverPos, setPopoverPos] = useState({
    top: 0,
    left: 0,
    placement: "center" as PopoverPlacement,
    arrowOffset: POPOVER_WIDTH / 2,
  });
  const [popoverHeight, setPopoverHeight] = useState(180);

  const step = steps[stepIndex] as OnboardingStep | undefined;
  const isLastStep = stepIndex >= steps.length - 1;
  const hasTarget = Boolean(step?.target);
  const showNext = !hasTarget || (!step?.isAction && !isLastStep);

  const handleSkip = useCallback(() => {
    clearTourStep(page);
    onSkip();
  }, [onSkip, page]);

  const updateLayout = useCallback(() => {
    if (!step) return;

    const target = getTourTarget(step.target);
    const nextSpotlight = getSpotlightRect(target);
    setSpotlight(nextSpotlight);
    setOverlayPanels(getOverlayPanels(nextSpotlight));

    const measuredHeight = popoverRef.current?.offsetHeight ?? popoverHeight;
    setPopoverPos(getPopoverPosition(nextSpotlight, measuredHeight));
  }, [step, popoverHeight]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const saved = getSavedTourStep(page);
    setStepIndex(Math.min(saved, Math.max(steps.length - 1, 0)));
  }, [page, steps.length]);

  useLayoutEffect(() => {
    if (!visible || !step) return;

    const target = getTourTarget(step.target);
    let resizeObserver: ResizeObserver | null = null;
    let activeTarget: HTMLElement | null = null;

    const measure = () => {
      const currentTarget = getTourTarget(step.target);
      const nextSpotlight = getSpotlightRect(currentTarget);
      setSpotlight(nextSpotlight);
      setOverlayPanels(getOverlayPanels(nextSpotlight));

      const measuredHeight = popoverRef.current?.offsetHeight ?? popoverHeight;
      setPopoverPos(getPopoverPosition(nextSpotlight, measuredHeight));
    };

    if (target) {
      activeTarget = target;
      target.classList.add("tour-target-active");
      scrollTourTargetIntoView(target);

      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(target);

      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = window.setTimeout(measure, 320);
    } else {
      measure();
    }

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      if (activeTarget) {
        activeTarget.classList.remove("tour-target-active");
      }
      resizeObserver?.disconnect();
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [visible, step, stepIndex, popoverHeight]);

  useLayoutEffect(() => {
    if (!popoverRef.current) return;
    const measured = popoverRef.current.offsetHeight;
    if (measured !== popoverHeight) {
      setPopoverHeight(measured);
      setPopoverPos(getPopoverPosition(spotlight, measured));
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
    <div className="pointer-events-none fixed inset-0 z-[85] animate-in fade-in duration-300">
      <OverlayPanels
        panels={overlayPanels}
        fullScreen={!hasTarget || !spotlight}
      />

      {hasTarget && spotlight ? (
        <div
          className="pointer-events-none fixed rounded-lg border-2 border-white/90 tour-spotlight-ring"
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
        className="pointer-events-auto fixed top-5 right-5 z-[87] rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60"
      >
        Skip tour
      </button>

      <div
        ref={popoverRef}
        role="dialog"
        aria-labelledby="onboarding-tour-title"
        className="pointer-events-auto fixed z-[87] rounded-xl border border-border/60 bg-card p-4 shadow-xl tour-step-enter"
        style={{
          top: popoverPos.top,
          left: popoverPos.left,
          width: POPOVER_WIDTH,
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
    </div>
  );

  return createPortal(content, document.body);
}
