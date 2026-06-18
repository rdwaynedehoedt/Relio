"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "right" | "top" | "bottom" | "left";
  className?: string;
  delayMs?: number;
};

const placementClasses = {
  right: {
    base: "left-full top-1/2 ml-2.5",
    hidden: "-translate-x-1.5 -translate-y-1/2",
    visible: "translate-x-0 -translate-y-1/2",
  },
  left: {
    base: "right-full top-1/2 mr-2.5",
    hidden: "translate-x-1.5 -translate-y-1/2",
    visible: "translate-x-0 -translate-y-1/2",
  },
  top: {
    base: "bottom-full left-1/2 mb-2.5",
    hidden: "-translate-y-1.5 -translate-x-1/2",
    visible: "translate-y-0 -translate-x-1/2",
  },
  bottom: {
    base: "top-full left-1/2 mt-2.5",
    hidden: "translate-y-1.5 -translate-x-1/2",
    visible: "translate-y-0 -translate-x-1/2",
  },
};

export function Tooltip({
  content,
  children,
  side = "right",
  className,
  delayMs = 120,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placement = placementClasses[side];

  const show = useCallback(() => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => setVisible(true), delayMs);
  }, [delayMs]);

  const hide = useCallback(() => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    setVisible(false);
  }, []);

  return (
    <div
      className={cn("relative flex w-full", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <div
        role="tooltip"
        aria-hidden={!visible}
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border/80 bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg",
          "transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform]",
          placement.base,
          visible
            ? cn("opacity-100", placement.visible)
            : cn("opacity-0", placement.hidden),
        )}
      >
        {content}
      </div>
    </div>
  );
}
