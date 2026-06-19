"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type GoogleApiService,
  googleApiServiceLabel,
} from "@/lib/google-cloud-constants";
import { cn } from "@/lib/utils";

type EnableApiModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: GoogleApiService;
  enableUrl: string;
  onTestAgain: () => Promise<boolean>;
};

export default function EnableApiModal({
  open,
  onOpenChange,
  service,
  enableUrl,
  onTestAgain,
}: EnableApiModalProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [testing, setTesting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const serviceLabel = googleApiServiceLabel(service);

  useEffect(() => {
    if (!open) {
      setShowExplanation(false);
      setTesting(false);
      setSucceeded(false);
    }
  }, [open]);

  useEffect(() => {
    if (!succeeded) return;

    const timer = window.setTimeout(() => {
      onOpenChange(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [succeeded, onOpenChange]);

  async function handleTestAgain() {
    setTesting(true);

    try {
      const ok = await onTestAgain();
      if (ok) {
        setSucceeded(true);
      }
    } finally {
      setTesting(false);
    }
  }

  function handleOpenConsole() {
    window.open(enableUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {succeeded ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="size-6" />
            </div>
            <p className="text-base font-medium text-foreground">
              Connected — try importing/syncing now
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <DialogTitle>
                    Google {serviceLabel} isn&apos;t turned on yet
                  </DialogTitle>
                  <DialogDescription>
                    Enable one Google Cloud service to finish setup. This only
                    needs to be done once.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Click the button below to open Google Cloud Console</li>
              <li>Click the blue &quot;Enable&quot; button on that page</li>
              <li>Wait about 1 minute</li>
              <li>Come back here and click &quot;Test again&quot;</li>
            </ol>

            <div>
              <button
                type="button"
                onClick={() => setShowExplanation((current) => !current)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Why do I need to do this?
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    showExplanation && "rotate-180",
                  )}
                />
              </button>
              {showExplanation ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Relio needs permission to use Google&apos;s {serviceLabel}{" "}
                  service for this specific project. This is a one-time setup.
                </p>
              ) : null}
            </div>

            <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:flex-col sm:items-stretch">
              <Button onClick={handleOpenConsole} className="h-10 w-full">
                Open Google Cloud Console
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleTestAgain()}
                disabled={testing}
                className="h-10 w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test again"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
