"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { clearTourStep } from "@/lib/onboarding-tour";
import type { OnboardingPage } from "@/lib/types";

const CONFIRM_PHRASE = "DELETE";

const DELETED_DATA_ITEMS = [
  "Contacts, companies, and CRM history",
  "Wallets, transactions, and fixed deposits",
  "Second Brain notes and Life Map goals",
  "Integration tokens (HubSpot, Google, etc.)",
  "Preferences, onboarding state, and activity log",
  "Your Relio account and sign-in credentials",
] as const;

const TOUR_PAGES: OnboardingPage[] = [
  "contacts",
  "companies",
  "finance",
  "brain",
  "lifemap",
];

export default function DeleteAccountSection() {
  const { deleteAccount } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmInput("");
      setError(null);
    }
  }, [open]);

  const confirmed = confirmInput === CONFIRM_PHRASE;

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      await deleteAccount();
      TOUR_PAGES.forEach((page) => clearTourStep(page));
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete your account. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="mt-6 rounded-2xl border border-destructive/25 bg-destructive/5 shadow-sm">
        <div className="border-b border-destructive/20 px-6 py-5">
          <h2 className="text-base font-semibold text-foreground">
            Delete account &amp; data
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Request permanent erasure of your personal data under the PDPA.
          </p>
        </div>

        <div className="space-y-4 px-6 py-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Under Singapore&apos;s Personal Data Protection Act (PDPA), you have
            the right to withdraw consent and request deletion of your personal
            data. When you delete your account, Relio permanently removes all
            data linked to you. This cannot be undone.
          </p>

          <ul className="space-y-2 text-sm text-foreground">
            {DELETED_DATA_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Deletion is processed immediately. We do not retain copies of your
            workspace data after your account is removed.
          </p>

          <Button
            type="button"
            variant="destructive"
            className="h-10"
            onClick={() => setOpen(true)}
          >
            Delete my account and data
          </Button>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-background p-0 shadow-lg sm:max-w-[440px]"
        >
          <DialogHeader className="items-start gap-1.5 px-5 pt-5 pb-3 text-left">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <DialogTitle className="text-base leading-snug font-semibold tracking-tight text-foreground">
                Permanently delete your account?
              </DialogTitle>
            </div>
            <DialogDescription className="text-left text-[13px] leading-relaxed text-muted-foreground">
              All personal data in your Relio workspace will be erased. You will
              be asked to sign in with Google again to confirm this action.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 px-5 pb-4">
            <label className="block text-[13px] text-muted-foreground">
              Type{" "}
              <span className="font-semibold text-foreground">
                {CONFIRM_PHRASE}
              </span>{" "}
              to confirm
            </label>
            <Input
              value={confirmInput}
              onChange={(event) => setConfirmInput(event.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="h-9 border-0 bg-muted/50 text-[13px] shadow-none ring-0 focus-visible:ring-0"
              autoComplete="off"
              disabled={deleting}
            />
            {error ? (
              <p className="text-[13px] text-destructive">{error}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/40 px-5 py-3.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3"
              onClick={() => setOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-9 px-3"
              onClick={() => void handleDelete()}
              disabled={deleting || !confirmed}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete permanently"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
