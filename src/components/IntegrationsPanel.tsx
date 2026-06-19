"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import HubSpotLogo from "@/components/HubSpotLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  syncGoogleContacts,
  syncLinkedInContacts,
  syncVcfContacts,
} from "@/lib/contact-import";
import {
  getFileImportMeta,
  getGoogleIntegration,
  getHubSpotToken,
  logActivity,
  saveHubSpotToken,
  updateGoogleCalendarLastSynced,
} from "@/lib/firestore";
import { syncHubSpotData } from "@/lib/hubspot-sync";

function IntegrationStatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
        Connected
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="border-border bg-muted text-muted-foreground"
    >
      Not connected
    </Badge>
  );
}

function ImportStatus({
  message,
  loading,
}: {
  message: string | null;
  loading: boolean;
}) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      )}
      {message}
    </div>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 4.126 0 2.063 2.063 0 0 1-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IntegrationCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      {children}
    </div>
  );
}

export default function IntegrationsPanel() {
  const { user, connectGoogleContacts } = useAuth();

  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [hubspotConnectedAt, setHubspotConnectedAt] = useState<string | null>(null);
  const [hubspotLastSyncedAt, setHubspotLastSyncedAt] = useState<string | null>(null);
  const [googleConnectedAt, setGoogleConnectedAt] = useState<string | null>(null);
  const [googleLastSyncedAt, setGoogleLastSyncedAt] = useState<string | null>(null);
  const [googleCalendarLastSyncedAt, setGoogleCalendarLastSyncedAt] = useState<
    string | null
  >(null);
  const [googleScopes, setGoogleScopes] = useState<string[]>([]);
  const [googleImportCount, setGoogleImportCount] = useState<number | null>(null);
  const [linkedinLastSyncedAt, setLinkedinLastSyncedAt] = useState<string | null>(
    null,
  );
  const [linkedinImportCount, setLinkedinImportCount] = useState<number | null>(
    null,
  );
  const [vcfLastSyncedAt, setVcfLastSyncedAt] = useState<string | null>(null);
  const [vcfImportCount, setVcfImportCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [hubspotSaving, setHubspotSaving] = useState(false);
  const [hubspotSyncing, setHubspotSyncing] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [linkedinSyncing, setLinkedinSyncing] = useState(false);
  const [vcfSyncing, setVcfSyncing] = useState(false);

  const [hubspotStatus, setHubspotStatus] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);
  const [linkedinStatus, setLinkedinStatus] = useState<string | null>(null);
  const [vcfStatus, setVcfStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const linkedinInputRef = useRef<HTMLInputElement>(null);
  const vcfInputRef = useRef<HTMLInputElement>(null);

  const hubspotConnected = Boolean(token.trim() || hubspotConnectedAt);
  const googleConnected = Boolean(googleConnectedAt);
  const contactsConnected =
    googleConnected &&
    (googleScopes.includes("contacts") || googleLastSyncedAt !== null);
  const calendarConnected =
    googleConnected &&
    (googleScopes.includes("calendar") || googleCalendarLastSyncedAt !== null);

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    async function loadIntegrations() {
      try {
        const [hubspot, google, linkedin, vcf] = await Promise.all([
          getHubSpotToken(userId),
          getGoogleIntegration(userId),
          getFileImportMeta(userId, "linkedin"),
          getFileImportMeta(userId, "vcf"),
        ]);

        if (hubspot) {
          setToken(hubspot.token);
          setHubspotConnectedAt(hubspot.connectedAt);
          setHubspotLastSyncedAt(hubspot.lastSyncedAt ?? null);
        }

        if (google) {
          setGoogleConnectedAt(google.connectedAt);
          setGoogleLastSyncedAt(google.lastSyncedAt ?? null);
          setGoogleCalendarLastSyncedAt(google.calendarLastSyncedAt ?? null);
          setGoogleImportCount(google.lastImportCount ?? null);
          setGoogleScopes(google.scopes ?? ["contacts", "calendar"]);
        }

        if (linkedin) {
          setLinkedinLastSyncedAt(linkedin.lastSyncedAt ?? null);
          setLinkedinImportCount(linkedin.lastImportCount ?? null);
        }

        if (vcf) {
          setVcfLastSyncedAt(vcf.lastSyncedAt ?? null);
          setVcfImportCount(vcf.lastImportCount ?? null);
        }
      } catch (err) {
        console.error("Failed to load integrations:", err);
      } finally {
        setLoading(false);
      }
    }

    loadIntegrations();
  }, [user]);

  async function handleSaveHubSpotToken() {
    if (!user || !token.trim()) return;

    setHubspotSaving(true);
    setError(null);

    try {
      const integration = await saveHubSpotToken(user.uid, token.trim());
      setHubspotConnectedAt(integration.connectedAt);
      setHubspotStatus(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save HubSpot token.",
      );
    } finally {
      setHubspotSaving(false);
    }
  }

  async function handleHubSpotSync() {
    if (!user || !token.trim()) return;

    setHubspotSyncing(true);
    setError(null);
    setHubspotStatus("Connecting to HubSpot...");

    try {
      const result = await syncHubSpotData(user.uid, token.trim(), setHubspotStatus);
      setHubspotLastSyncedAt(result.syncedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
      setHubspotStatus(null);
    } finally {
      setHubspotSyncing(false);
    }
  }

  async function handleGoogleConnectAndImport() {
    if (!user) return;

    setGoogleSyncing(true);
    setError(null);
    setGoogleStatus("Connecting to Google...");

    try {
      const accessToken = await connectGoogleContacts();
      if (!accessToken) {
        throw new Error("Could not get Google access token.");
      }

      const now = new Date().toISOString();
      setGoogleConnectedAt(now);
      setGoogleScopes(["contacts", "calendar"]);
      setGoogleCalendarLastSyncedAt(now);

      await logActivity(user.uid, "calendar_connected", "Connected Google Calendar");
      await updateGoogleCalendarLastSynced(user.uid);

      setGoogleStatus("Google connected.");

      try {
        const result = await syncGoogleContacts(
          user.uid,
          accessToken,
          setGoogleStatus,
        );

        setGoogleLastSyncedAt(result.syncedAt);
        setGoogleImportCount(result.imported);
        setGoogleStatus(
          `Connected. Imported ${result.imported} contact${result.imported === 1 ? "" : "s"}.`,
        );
      } catch (importErr) {
        const message =
          importErr instanceof Error
            ? importErr.message
            : "Contacts import failed.";

        setGoogleStatus(
          "Google Calendar connected. Contacts import needs People API enabled in Google Cloud Console.",
        );
        setError(message);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google connection failed.",
      );
      setGoogleStatus(null);
    } finally {
      setGoogleSyncing(false);
    }
  }

  async function handleLinkedInUpload(file: File) {
    if (!user) return;

    setLinkedinSyncing(true);
    setError(null);
    setLinkedinStatus("Reading LinkedIn CSV...");

    try {
      const csv = await file.text();
      const result = await syncLinkedInContacts(user.uid, csv, setLinkedinStatus);
      setLinkedinLastSyncedAt(result.syncedAt);
      setLinkedinImportCount(result.imported);
    } catch (err) {
      setError(err instanceof Error ? err.message : "LinkedIn import failed.");
      setLinkedinStatus(null);
    } finally {
      setLinkedinSyncing(false);
      if (linkedinInputRef.current) {
        linkedinInputRef.current.value = "";
      }
    }
  }

  async function handleVcfUpload(file: File) {
    if (!user) return;

    setVcfSyncing(true);
    setError(null);
    setVcfStatus("Reading VCF file...");

    try {
      const vcf = await file.text();
      const result = await syncVcfContacts(user.uid, vcf, setVcfStatus);
      setVcfLastSyncedAt(result.syncedAt);
      setVcfImportCount(result.imported);
    } catch (err) {
      setError(err instanceof Error ? err.message : "VCF import failed.");
      setVcfStatus(null);
    } finally {
      setVcfSyncing(false);
      if (vcfInputRef.current) {
        vcfInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <IntegrationCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <HubSpotLogo height={30} />
              <IntegrationStatusBadge connected={hubspotConnected} />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Import your contacts and companies from HubSpot.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground/80">
              Relio is independent of HubSpot, Inc. and is not authorized by,
              endorsed by, sponsored by, affiliated with, or otherwise approved
              by HubSpot, Inc.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">
              Private App Token
            </span>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="pat-na1-..."
                className="h-11 pr-11"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowToken((current) => !current)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your token from HubSpot → Settings → Integrations → Private
              Apps.{" "}
              <a
                href="https://app.hubspot.com/private-apps"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
              >
                Open HubSpot Private Apps
                <ExternalLink className="size-3" />
              </a>
            </p>
          </label>

          <ImportStatus message={hubspotStatus} loading={hubspotSyncing} />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void handleSaveHubSpotToken()}
              disabled={hubspotSaving || !token.trim()}
              className="h-10"
            >
              {hubspotSaving ? "Saving..." : "Save Token"}
            </Button>

            <Button
              variant="outline"
              onClick={() => void handleHubSpotSync()}
              disabled={hubspotSyncing || !token.trim()}
              className="h-10"
            >
              {hubspotSyncing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>

          {hubspotLastSyncedAt ? (
            <p className="text-xs text-muted-foreground">
              Last synced{" "}
              {formatDistanceToNow(new Date(hubspotLastSyncedAt), {
                addSuffix: true,
              })}
            </p>
          ) : null}
        </div>
      </IntegrationCard>

      <IntegrationCard>
        <div className="flex flex-wrap items-center gap-3">
          <GoogleLogo className="size-7" />
          <span className="text-sm font-semibold text-foreground">Google</span>
          <IntegrationStatusBadge connected={googleConnected} />
        </div>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Sync contacts and calendar from your Google account in one connection.
        </p>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground/80">
          In Google Cloud Console, enable{" "}
          <a
            href="https://console.cloud.google.com/apis/library/people.googleapis.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            People API
          </a>
          {" "}and{" "}
          <a
            href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Google Calendar API
          </a>
          {" "}for your Firebase project, then connect.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Contacts</span>
              <IntegrationStatusBadge connected={contactsConnected} />
            </div>
            {googleImportCount !== null ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {googleImportCount} contact{googleImportCount === 1 ? "" : "s"} imported
              </p>
            ) : null}
            {googleLastSyncedAt ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Last synced{" "}
                {formatDistanceToNow(new Date(googleLastSyncedAt), {
                  addSuffix: true,
                })}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Calendar</span>
              <IntegrationStatusBadge connected={calendarConnected} />
            </div>
            {googleCalendarLastSyncedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Last synced{" "}
                {formatDistanceToNow(new Date(googleCalendarLastSyncedAt), {
                  addSuffix: true,
                })}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Meetings appear on Dashboard and Calendar
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ImportStatus message={googleStatus} loading={googleSyncing} />

          <Button
            onClick={() => void handleGoogleConnectAndImport()}
            disabled={googleSyncing || loading}
            className="h-10"
          >
            {googleSyncing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Google"
            )}
          </Button>
        </div>
      </IntegrationCard>

      <IntegrationCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-md bg-[#0A66C2] text-white">
            <LinkedInLogo className="size-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            LinkedIn Connections
          </span>
        </div>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Import your LinkedIn connections via CSV export.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
          <li>
            Go to LinkedIn → Settings → Data Privacy → Get a copy of your data →
            Connections
          </li>
          <li>Download the CSV file</li>
          <li>Upload it here</li>
        </ol>

        <div className="mt-6 space-y-4">
          <Input
            ref={linkedinInputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={linkedinSyncing}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleLinkedInUpload(file);
            }}
            className="h-11 cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium"
          />

          <ImportStatus message={linkedinStatus} loading={linkedinSyncing} />

          {linkedinImportCount !== null ? (
            <p className="text-xs text-muted-foreground">
              {linkedinImportCount} contact
              {linkedinImportCount === 1 ? "" : "s"} imported
            </p>
          ) : null}

          {linkedinLastSyncedAt ? (
            <p className="text-xs text-muted-foreground">
              Last imported{" "}
              {formatDistanceToNow(new Date(linkedinLastSyncedAt), {
                addSuffix: true,
              })}
            </p>
          ) : null}
        </div>
      </IntegrationCard>

      <IntegrationCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-md bg-muted text-foreground">
            <Smartphone className="size-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Phone Contacts
          </span>
        </div>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Import contacts exported from your phone as a VCF file.
        </p>
        <div className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
          <p>
            iPhone: Contacts app → select all → Share → export as vCard
          </p>
          <p>Android: Contacts app → Export → .vcf file</p>
        </div>

        <div className="mt-6 space-y-4">
          <Input
            ref={vcfInputRef}
            type="file"
            accept=".vcf,text/vcard"
            disabled={vcfSyncing}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleVcfUpload(file);
            }}
            className="h-11 cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium"
          />

          <ImportStatus message={vcfStatus} loading={vcfSyncing} />

          {vcfImportCount !== null ? (
            <p className="text-xs text-muted-foreground">
              {vcfImportCount} contact{vcfImportCount === 1 ? "" : "s"} imported
            </p>
          ) : null}

          {vcfLastSyncedAt ? (
            <p className="text-xs text-muted-foreground">
              Last imported{" "}
              {formatDistanceToNow(new Date(vcfLastSyncedAt), { addSuffix: true })}
            </p>
          ) : null}
        </div>
      </IntegrationCard>
    </div>
  );
}
