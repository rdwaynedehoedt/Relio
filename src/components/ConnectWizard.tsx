"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  GOOGLE_CALENDAR_API_ENABLE_URL,
  GOOGLE_PEOPLE_API_ENABLE_URL,
} from "@/lib/google-cloud-constants";
import { testGoogleConnection } from "@/lib/google-test-connection";

export type ConnectWizardType = "hubspot" | "google" | "linkedin" | "vcf";

interface ConnectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ConnectWizardType;
  onHubSpotConnect?: (token: string) => Promise<void>;
  onGoogleConnect?: () => Promise<string | null>;
  onLinkedInImport?: (file: File) => Promise<void>;
  onVcfImport?: (file: File) => Promise<void>;
}

const STEP_COUNTS: Record<ConnectWizardType, number> = {
  hubspot: 4,
  google: 3,
  linkedin: 2,
  vcf: 2,
};

const STEP_TITLES: Record<ConnectWizardType, string[]> = {
  hubspot: [
    "Open HubSpot",
    "Create a private app named 'Relio'",
    "Enable these scopes:",
    "Paste your token",
  ],
  google: [
    "Connect your Google account",
    "Enable two Google services",
    "Testing connection...",
  ],
  linkedin: ["Export your connections", "Upload the CSV"],
  vcf: ["Export contacts as VCF from your phone", "Upload the file"],
};

export default function ConnectWizard({
  open,
  onOpenChange,
  type,
  onHubSpotConnect,
  onGoogleConnect,
  onLinkedInImport,
  onVcfImport,
}: ConnectWizardProps) {
  const [step, setStep] = useState(0);
  const [hubspotToken, setHubspotToken] = useState("");
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleResults, setGoogleResults] = useState<{
    contacts: boolean | null;
    calendar: boolean | null;
    tested: boolean;
  }>({ contacts: null, calendar: null, tested: false });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalSteps = STEP_COUNTS[type];

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setHubspotToken("");
    setActing(false);
    setError(null);
    setGoogleAccessToken(null);
    setGoogleResults({ contacts: null, calendar: null, tested: false });
    setSelectedFile(null);
  }, [open, type]);

  useEffect(() => {
    if (!open || type !== "google" || step !== 2 || !googleAccessToken) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function run() {
      if (!googleAccessToken) return;
      setActing(true);
      setGoogleResults({ contacts: null, calendar: null, tested: false });

      const [cResult, kResult] = await Promise.all([
        testGoogleConnection("contacts", googleAccessToken),
        testGoogleConnection("calendar", googleAccessToken),
      ]);

      if (cancelled) return;

      const contacts = cResult.success;
      const calendar = kResult.success;
      setGoogleResults({ contacts, calendar, tested: true });
      setActing(false);

      if (contacts && calendar) {
        timer = setTimeout(() => {
          if (!cancelled) onOpenChange(false);
        }, 1500);
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [open, type, step, googleAccessToken, onOpenChange]);

  function close() {
    onOpenChange(false);
  }

  function next() {
    setStep((s) => s + 1);
    setError(null);
  }

  function back() {
    setStep((s) => s - 1);
    setError(null);
  }

  async function connectHubSpot() {
    if (!onHubSpotConnect || !hubspotToken.trim()) return;
    setActing(true);
    setError(null);
    try {
      await onHubSpotConnect(hubspotToken.trim());
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setActing(false);
    }
  }

  async function connectGoogle() {
    if (!onGoogleConnect) return;
    setActing(true);
    setError(null);
    try {
      const token = await onGoogleConnect();
      if (token) {
        setGoogleAccessToken(token);
        next();
      } else {
        setError("Could not connect Google account.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google connection failed.");
    } finally {
      setActing(false);
    }
  }

  async function retryGoogleTest() {
    if (!googleAccessToken) return;
    setActing(true);
    setGoogleResults({ contacts: null, calendar: null, tested: false });
    try {
      const [cResult, kResult] = await Promise.all([
        testGoogleConnection("contacts", googleAccessToken),
        testGoogleConnection("calendar", googleAccessToken),
      ]);
      const contacts = cResult.success;
      const calendar = kResult.success;
      setGoogleResults({ contacts, calendar, tested: true });
      if (contacts && calendar) {
        setTimeout(() => close(), 1500);
      }
    } finally {
      setActing(false);
    }
  }

  async function importFile() {
    if (!selectedFile) return;
    const handler = type === "linkedin" ? onLinkedInImport : onVcfImport;
    if (!handler) return;
    setActing(true);
    setError(null);
    try {
      await handler(selectedFile);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setActing(false);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ── Content ──────────────────────────────────────────────────────────────

  let content: React.ReactNode = null;

  if (type === "hubspot") {
    if (step === 0) {
      content = (
        <Button
          variant="outline"
          className="h-10"
          onClick={() =>
            window.open(
              "https://app-na2.hubspot.com/service-keys/",
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          Open HubSpot
        </Button>
      );
    } else if (step === 2) {
      content = (
        <ul className="space-y-1.5">
          {["crm.objects.contacts.read", "crm.objects.companies.read"].map(
            (scope) => (
              <li key={scope} className="flex items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                <code className="font-mono text-xs text-foreground">{scope}</code>
              </li>
            ),
          )}
        </ul>
      );
    } else if (step === 3) {
      content = (
        <div className="space-y-3">
          <Input
            type="password"
            value={hubspotToken}
            onChange={(e) => setHubspotToken(e.target.value)}
            placeholder="pat-na1-..."
            className="h-11"
            autoFocus
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      );
    }
  } else if (type === "google") {
    if (step === 0) {
      content = (
        <div className="space-y-3">
          <Button
            className="h-10 w-full"
            onClick={() => void connectGoogle()}
            disabled={acting}
          >
            {acting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Continue with Google"
            )}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      );
    } else if (step === 1) {
      content = (
        <div className="space-y-2">
          {[
            { label: "People API", url: GOOGLE_PEOPLE_API_ENABLE_URL },
            { label: "Calendar API", url: GOOGLE_CALENDAR_API_ENABLE_URL },
          ].map(({ label, url }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <span className="text-sm font-medium">{label}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              >
                Enable →
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Takes about a minute</p>
        </div>
      );
    } else if (step === 2) {
      const { contacts, calendar, tested } = googleResults;
      const allPassed = contacts && calendar;
      content = (
        <div className="space-y-3">
          <TestRow label="Contacts" result={contacts} />
          <TestRow label="Calendar" result={calendar} />
          {allPassed ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              All good — closing...
            </p>
          ) : tested ? (
            <Button
              className="h-10 w-full"
              onClick={() => void retryGoogleTest()}
              disabled={acting}
            >
              {acting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Try again"
              )}
            </Button>
          ) : null}
        </div>
      );
    }
  } else if (type === "linkedin" || type === "vcf") {
    if (step === 0 && type === "linkedin") {
      content = (
        <Button
          variant="outline"
          className="h-10"
          onClick={() =>
            window.open(
              "https://www.linkedin.com/mypreferences/d/download-my-data",
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          Open LinkedIn
        </Button>
      );
    } else if (step === 1) {
      const accept =
        type === "linkedin" ? ".csv,text/csv" : ".vcf,text/vcard";
      content = (
        <div className="space-y-3">
          <Input
            ref={fileRef}
            type="file"
            accept={accept}
            disabled={acting}
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="h-11 cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {acting ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Importing...
            </div>
          ) : null}
        </div>
      );
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  let navButtons: React.ReactNode = null;

  if (type === "google" && step === 0) {
    navButtons = null;
  } else if (type === "google" && step === 2) {
    const allPassed = googleResults.contacts && googleResults.calendar;
    navButtons = allPassed ? null : (
      <Button variant="ghost" size="sm" onClick={back}>
        Back
      </Button>
    );
  } else if (type === "google" && step === 1) {
    navButtons = (
      <>
        <Button variant="ghost" size="sm" onClick={back}>
          Back
        </Button>
        <Button className="h-10" onClick={next}>
          Done, continue
        </Button>
      </>
    );
  } else if (type === "hubspot" && step === 3) {
    navButtons = (
      <>
        <Button variant="ghost" size="sm" onClick={back}>
          Back
        </Button>
        <Button
          className="h-10"
          onClick={() => void connectHubSpot()}
          disabled={acting || !hubspotToken.trim()}
        >
          {acting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect"
          )}
        </Button>
      </>
    );
  } else if ((type === "linkedin" || type === "vcf") && step === 1) {
    navButtons = (
      <>
        <Button variant="ghost" size="sm" onClick={back}>
          Back
        </Button>
        <Button
          className="h-10"
          onClick={() => void importFile()}
          disabled={acting || !selectedFile}
        >
          {acting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Importing...
            </>
          ) : (
            "Import"
          )}
        </Button>
      </>
    );
  } else {
    navButtons = (
      <>
        {step > 0 ? (
          <Button variant="ghost" size="sm" onClick={back}>
            Back
          </Button>
        ) : null}
        <Button className="h-10" onClick={next}>
          Next
        </Button>
      </>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-1">
          <p className="text-xs text-muted-foreground">
            {step + 1} of {totalSteps}
          </p>
          <DialogTitle>{STEP_TITLES[type][step]}</DialogTitle>
        </DialogHeader>

        {content ? <div className="py-1">{content}</div> : null}

        <DialogFooter className="flex-row items-center justify-between sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={close}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">{navButtons}</div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TestRow({
  label,
  result,
}: {
  label: string;
  result: boolean | null;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex size-5 shrink-0 items-center justify-center">
        {result === null ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : result ? (
          <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <span className="font-medium text-destructive">✗</span>
        )}
      </div>
      <span
        className={result === false ? "text-destructive" : "text-foreground"}
      >
        {label}
      </span>
    </div>
  );
}
