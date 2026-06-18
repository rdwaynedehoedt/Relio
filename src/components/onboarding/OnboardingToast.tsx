"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface OnboardingToastProps {
  message: string | null;
  onDismiss: () => void;
}

export default function OnboardingToast({
  message,
  onDismiss,
}: OnboardingToastProps) {
  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-[100] -translate-x-1/2",
        "rounded-full border border-border/60 bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-lg",
        "animate-in fade-in-0 slide-in-from-bottom-4 duration-300",
      )}
      role="status"
    >
      {message}
    </div>
  );
}
