export const SPOTLIGHT_PADDING = 8;
export const POPOVER_WIDTH = 300;
export const POPOVER_GAP = 14;
export const VIEWPORT_PADDING = 16;

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

export function getTourTarget(target?: string): HTMLElement | null {
  if (!target) return null;
  return document.querySelector(`[data-tour="${target}"]`);
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
  const nearBottom =
    spotlight.y + spotlight.height + popoverHeight + POPOVER_GAP >
    viewportH - VIEWPORT_PADDING;
  const nearTop =
    spotlight.y - popoverHeight - POPOVER_GAP < VIEWPORT_PADDING;
  const preferLeft = spotlight.centerX > viewportW / 2;

  let placement: PopoverPlacement = preferLeft ? "left" : "right";

  if (nearBottom && !nearTop) {
    placement = "above";
  } else if (placement === "left") {
    const leftPos = spotlight.x - POPOVER_GAP - POPOVER_WIDTH;
    if (leftPos < VIEWPORT_PADDING) {
      placement = "right";
    }
  } else if (placement === "right") {
    const rightPos = spotlight.x + spotlight.width + POPOVER_GAP + POPOVER_WIDTH;
    if (rightPos > viewportW - VIEWPORT_PADDING) {
      placement = "left";
    }
  }

  let top = 0;
  let left = 0;
  let arrowOffset = POPOVER_WIDTH / 2;

  if (placement === "left") {
    left = spotlight.x - POPOVER_GAP - POPOVER_WIDTH;
    top = spotlight.centerY - popoverHeight / 2;
    arrowOffset = popoverHeight / 2;
  } else if (placement === "right") {
    left = spotlight.x + spotlight.width + POPOVER_GAP;
    top = spotlight.centerY - popoverHeight / 2;
    arrowOffset = popoverHeight / 2;
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
