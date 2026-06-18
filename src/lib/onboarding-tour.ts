import type { OnboardingPage } from "@/lib/types";

export const SPOTLIGHT_PADDING = 8;
export const POPOVER_WIDTH = 300;
export const POPOVER_GAP = 14;
export const VIEWPORT_PADDING = 16;
export const OVERLAY_COLOR = "rgba(0, 0, 0, 0.65)";

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export type PopoverPlacement = "left" | "right" | "above" | "below" | "center";

export interface PopoverPosition {
  top: number;
  left: number;
  placement: PopoverPlacement;
  arrowOffset: number;
}

export interface OverlayPanel {
  top: number;
  left: number;
  width: number;
  height: number;
}

function tourStepKey(page: OnboardingPage) {
  return `relio-tour-step-${page}`;
}

export function getSavedTourStep(page: OnboardingPage): number {
  if (typeof window === "undefined") return 0;
  const saved = sessionStorage.getItem(tourStepKey(page));
  if (!saved) return 0;
  const parsed = Number.parseInt(saved, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function saveTourStep(page: OnboardingPage, step: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(tourStepKey(page), String(step));
}

export function clearTourStep(page: OnboardingPage) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(tourStepKey(page));
}

export function getTourTarget(target?: string): HTMLElement | null {
  if (!target) return null;
  return document.querySelector(`[data-tour="${target}"]`);
}

export function scrollTourTargetIntoView(target: HTMLElement | null) {
  if (!target) return;
  target.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
}

export function getSpotlightRect(element: HTMLElement | null): SpotlightRect | null {
  if (!element) return null;

  const rect = element.getBoundingClientRect();

  return {
    x: rect.left - SPOTLIGHT_PADDING,
    y: rect.top - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
  };
}

export function getOverlayPanels(spotlight: SpotlightRect | null): OverlayPanel[] {
  if (!spotlight) return [];

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const { x, y, width, height } = spotlight;

  return [
    { top: 0, left: 0, width: viewportW, height: Math.max(0, y) },
    { top: y, left: 0, width: Math.max(0, x), height },
    {
      top: y,
      left: x + width,
      width: Math.max(0, viewportW - x - width),
      height,
    },
    {
      top: y + height,
      left: 0,
      width: viewportW,
      height: Math.max(0, viewportH - y - height),
    },
  ];
}

export function getPopoverPosition(
  spotlight: SpotlightRect | null,
  popoverHeight: number,
): PopoverPosition {
  if (!spotlight) {
    return {
      top: Math.max(
        VIEWPORT_PADDING,
        window.innerHeight / 2 - popoverHeight / 2,
      ),
      left: Math.max(
        VIEWPORT_PADDING,
        (window.innerWidth - POPOVER_WIDTH) / 2,
      ),
      placement: "center",
      arrowOffset: POPOVER_WIDTH / 2,
    };
  }

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const preferLeft = spotlight.centerX > viewportW / 2;

  const spaceBelow =
    viewportH - VIEWPORT_PADDING - (spotlight.y + spotlight.height + POPOVER_GAP);
  const spaceAbove = spotlight.y - POPOVER_GAP - VIEWPORT_PADDING;
  const spaceRight =
    viewportW - VIEWPORT_PADDING - (spotlight.x + spotlight.width + POPOVER_GAP);
  const spaceLeft = spotlight.x - POPOVER_GAP - VIEWPORT_PADDING;

  let placement: PopoverPlacement = preferLeft ? "left" : "right";

  if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
    placement = "above";
  } else if (spaceAbove < popoverHeight && spaceBelow > spaceAbove) {
    placement = "below";
  } else if (placement === "left" && spaceLeft < POPOVER_WIDTH) {
    placement = spaceRight >= POPOVER_WIDTH ? "right" : "below";
  } else if (placement === "right" && spaceRight < POPOVER_WIDTH) {
    placement = spaceLeft >= POPOVER_WIDTH ? "left" : "below";
  }

  let top = 0;
  let left = 0;
  let arrowOffset = POPOVER_WIDTH / 2;

  if (placement === "left") {
    left = spotlight.x - POPOVER_GAP - POPOVER_WIDTH;
    top = spotlight.centerY - popoverHeight / 2;
    arrowOffset = spotlight.centerY - top;
  } else if (placement === "right") {
    left = spotlight.x + spotlight.width + POPOVER_GAP;
    top = spotlight.centerY - popoverHeight / 2;
    arrowOffset = spotlight.centerY - top;
  } else if (placement === "above") {
    top = spotlight.y - POPOVER_GAP - popoverHeight;
    left = spotlight.centerX - POPOVER_WIDTH / 2;
    arrowOffset = spotlight.centerX - left;
  } else {
    top = spotlight.y + spotlight.height + POPOVER_GAP;
    left = spotlight.centerX - POPOVER_WIDTH / 2;
    arrowOffset = spotlight.centerX - left;
  }

  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, viewportW - POPOVER_WIDTH - VIEWPORT_PADDING),
  );
  top = Math.max(
    VIEWPORT_PADDING,
    Math.min(top, viewportH - popoverHeight - VIEWPORT_PADDING),
  );

  if (placement === "left" || placement === "right") {
    arrowOffset = Math.max(
      20,
      Math.min(popoverHeight - 20, spotlight.centerY - top),
    );
  } else {
    arrowOffset = Math.max(
      20,
      Math.min(POPOVER_WIDTH - 20, spotlight.centerX - left),
    );
  }

  return { top, left, placement, arrowOffset };
}
