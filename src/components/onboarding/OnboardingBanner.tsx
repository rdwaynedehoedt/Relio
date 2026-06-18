"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { PAGE_ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding-utils";
import {
  getPopoverPosition,
  getSpotlightRect,
  getTourTarget,
  POPOVER_WIDTH,
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

function SpotlightOverlay({
  maskId,
  spotlight,
}: {
  maskId: string;
  spotlight: SpotlightRect | null;
}) {
  if (!spotlight) {
    return (
      <div className="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-[2px] tour-fade-in" />
    );
  }

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-[100vh] w-[100vw] tour-fade-in"
        aria-hidden
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spotlight.x}
              y={spotlight.y}
              width={spotlight.width}
              height={spotlight.height}
              rx="8"
              fill="black"
              className="tour-spotlight-cutout"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask={`url(#${maskId})`}
        />
      </svg>

      <div
        className="pointer-events-none absolute inset-0 backdrop-blur-[2px] tour-fade-in"
        style={{
          mask: `url(#${maskId})`,
          WebkitMask: `url(#${maskId})`,
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute rounded-lg border-2 border-white/90 tour-spotlight-ring"
        style={{
          left: spotlight.x,
          top: spotlight.y,
          width: spotlight.width,
          height: spotlight.height,
        }}
        aria-hidden
      />
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
        className={cn(base, "-right-3.5 border-l-[var(--card)]")}
        style={{ top: offset - 7 }}
        aria-hidden
      />
    );
  }

  if (placement === "right") {
    return (
      <span
        className={cn(base, "-left-3.5 border-r-[var(--card)]")}
        style={{ top: offset - 7 }}
        aria-hidden
      />
    );
  }

  if (placement === "above") {
    return (
      <span
        className={cn(base, "-bottom-3.5 border-t-[var(--card)]")}
        style={{ left: offset - 7 }}
        aria-hidden
      />
    );
  }

  if (placement === "below") {
    return (
      <span
        className={cn(base, "-top-3.5 border-b-[var(--card)]")}
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
  const maskId = useId().replace(/:/g, "");
  const popoverRef = useRef<HTMLDivElement>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
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

  const updateLayout = useCallback(() => {
    if (!step) return;

    const target = getTourTarget(step.target);
    const nextSpotlight = getSpotlightRect(target);
    setSpotlight(nextSpotlight);

    const measuredHeight = popoverRef.current?.offsetHeight ?? popoverHeight;
    setPopoverPos(getPopoverPosition(nextSpotlight, measuredHeight));
  }, [step, popoverHeight]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
    }
  }, [visible, page]);

  useLayoutEffect(() => {
    if (!visible || !step) return;

    const target = getTourTarget(step.target);
    if (target) {
      target.classList.add("tour-target-active");
    }

    updateLayout();

    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);

    return () => {
      if (target) {
        target.classList.remove("tour-target-active");
      }
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
    };
  }, [visible, step, stepIndex, updateLayout]);

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
      if (step.isAction) {
        return;
      }
      if (!isLastStep) {
        setStepIndex((current) => current + 1);
      }
    };

    target.addEventListener("click", handleTargetClick, { capture: true });

    return () => {
      target.removeEventListener("click", handleTargetClick, { capture: true });
    };
  }, [visible, step, stepIndex, isLastStep]);

  if (!visible || !step || steps.length === 0 || !mounted) return null;

  const content = (
    <div className="pointer-events-none fixed inset-0 z-[85] animate-in fade-in duration-300">
      <SpotlightOverlay maskId={maskId} spotlight={hasTarget ? spotlight : null} />

      <button
        type="button"
        onClick={onSkip}
        className="pointer-events-auto fixed top-5 right-5 z-[87] rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60"
      >
        Skip tour
      </button>

      <div
        ref={popoverRef}
        role="dialog"
        aria-labelledby="onboarding-tour-title"
        className={cn(
          "pointer-events-auto fixed z-[87] rounded-xl border border-border/60 bg-card p-4 shadow-xl tour-step-enter",
        )}
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
            {step.isAction || isLastStep ? "Click the highlighted area" : "Click it, or press Next"}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          {showNext ? (
            <Button
              size="sm"
              className="h-8"
              onClick={() => setStepIndex((current) => current + 1)}
            >
              Next
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-muted-foreground"
            onClick={onSkip}
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
