"use client";

import { useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Check,
  Loader2,
  RefreshCw,
  Smartphone,
  Unplug,
} from "lucide-react";
import ConnectWizard, { type ConnectWizardType } from "@/components/ConnectWizard";
import HubSpotLogo from "@/components/HubSpotLogo";
import EnableApiModal from "@/components/settings/EnableApiModal";
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
  deleteFileImportMeta,
  deleteGoogleIntegration,
  deleteHubSpotIntegration,
  saveHubSpotToken,
  updateGoogleCalendarLastSynced,
} from "@/lib/firestore";
import { syncHubSpotData } from "@/lib/hubspot-sync";
import { getViewRange, loadCalendarEventsForUser } from "@/lib/calendar-utils";
import {
  GOOGLE_CALENDAR_API_ENABLE_URL,
  GOOGLE_PEOPLE_API_ENABLE_URL,
  type GoogleApiService,
} from "@/lib/google-cloud-constants";
import {
  GoogleApiDisabledError,
  isGoogleApiDisabledError,
} from "@/lib/google-api-errors";
import { testGoogleConnection } from "@/lib/google-test-connection";

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

function ConnectedBanner({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-900 dark:text-emerald-100">
      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div>
        <p className="font-medium">{title}</p>
        {detail ? (
          <p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-100/80">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function IntegrationActionButtons({
  connected,
  connectLabel,
  connecting,
  syncing,
  disconnecting,
  onConnect,
  onSync,
  onDisconnect,
  syncDisabled,
  connectDisabled,
}: {
  connected: boolean;
  connectLabel: string;
  connecting: boolean;
  syncing: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  syncDisabled?: boolean;
  connectDisabled?: boolean;
}) {
  if (!connected) {
    return (
      <Button
        onClick={onConnect}
        disabled={connecting || connectDisabled}
        className="h-10"
      >
        {connecting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Connecting...
          </>
        ) : (
          connectLabel
        )}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onClick={onSync}
        disabled={syncing || syncDisabled}
        className="h-10"
      >
        {syncing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="size-4" />
            Sync now
          </>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={onDisconnect}
        disabled={disconnecting}
        className="h-10 text-destructive hover:text-destructive"
      >
        {disconnecting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Disconnecting...
          </>
        ) : (
          <>
            <Unplug className="size-4" />
            Disconnect
          </>
        )}
      </Button>
    </div>
  );
}

function formatConnectedDetail(
  connectedAt: string | null,
  lastSyncedAt: string | null,
): string | undefined {
  const parts: string[] = [];

  if (connectedAt) {
    parts.push(`Connected ${format(new Date(connectedAt), "MMM d, yyyy")}`);
  }

  if (lastSyncedAt) {
    parts.push(
      `Last synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`,
    );
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export default function IntegrationsPanel() {
  const { user, connectGoogleContacts } = useAuth();

  const [token, setToken] = useState("");
  const [hubspotConnectedAt, setHubspotConnectedAt] = useState<string | null>(null);
  const [hubspotLastSyncedAt, setHubspotLastSyncedAt] = useState<string | null>(null);
  const [googleConnectedAt, setGoogleConnectedAt] = useState<string | null>(null);
  const [googleLastSyncedAt, setGoogleLastSyncedAt] = useState<string | null>(null);
  const [googleCalendarLastSyncedAt, setGoogleCalendarLastSyncedAt] = useState<
    string | null
  >(null);
  const [googleScopes, setGoogleScopes] = useState<string[]>([]);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
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
  const [hubspotDisconnecting, setHubspotDisconnecting] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleDisconnecting, setGoogleDisconnecting] = useState(false);
  const [linkedinSyncing, setLinkedinSyncing] = useState(false);
  const [linkedinDisconnecting, setLinkedinDisconnecting] = useState(false);
  const [vcfSyncing, setVcfSyncing] = useState(false);
  const [vcfDisconnecting, setVcfDisconnecting] = useState(false);

  const [hubspotStatus, setHubspotStatus] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);
  const [linkedinStatus, setLinkedinStatus] = useState<string | null>(null);
  const [vcfStatus, setVcfStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testingGoogleService, setTestingGoogleService] =
    useState<GoogleApiService | null>(null);
  const [enableApiModalOpen, setEnableApiModalOpen] = useState(false);
  const [enableApiService, setEnableApiService] =
    useState<GoogleApiService>("contacts");
  const [enableApiUrl, setEnableApiUrl] = useState(GOOGLE_PEOPLE_API_ENABLE_URL);

  const linkedinInputRef = useRef<HTMLInputElement>(null);
  const vcfInputRef = useRef<HTMLInputElement>(null);

  const [wizardType, setWizardType] = useState<ConnectWizardType | null>(null);

  const hubspotConnected = Boolean(token.trim() || hubspotConnectedAt);
  const googleConnected = Boolean(googleConnectedAt);
  const contactsConnected =
    googleConnected &&
    (googleScopes.includes("contacts") || googleLastSyncedAt !== null);
  const calendarConnected =
    googleConnected &&
    (googleScopes.includes("calendar") || googleCalendarLastSyncedAt !== null);
  const linkedinConnected = linkedinLastSyncedAt !== null;
  const vcfConnected = vcfLastSyncedAt !== null;

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
          setGoogleAccessToken(google.accessToken ?? null);
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

  async function handleHubSpotDisconnect() {
    if (!user) return;

    setHubspotDisconnecting(true);
    setError(null);

    try {
      await deleteHubSpotIntegration(user.uid);
      setToken("");
      setHubspotConnectedAt(null);
      setHubspotLastSyncedAt(null);
      setHubspotStatus("HubSpot disconnected.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not disconnect HubSpot.",
      );
    } finally {
      setHubspotDisconnecting(false);
    }
  }

  async function resolveGoogleAccessToken(): Promise<string> {
    if (!user) {
      throw new Error("You must be signed in.");
    }

    const integration = await getGoogleIntegration(user.uid);
    const storedToken = integration?.accessToken ?? googleAccessToken;

    if (storedToken) return storedToken;

    const accessToken = await connectGoogleContacts();
    if (!accessToken) {
      throw new Error("Could not get Google access token.");
    }

    setGoogleAccessToken(accessToken);
    setGoogleConnectedAt(new Date().toISOString());
    setGoogleScopes(["contacts", "calendar"]);
    return accessToken;
  }

  function openEnableApiModal(error: GoogleApiDisabledError) {
    setEnableApiService(error.service);
    setEnableApiUrl(error.enableUrl);
    setEnableApiModalOpen(true);
    setError(null);
  }

  async function runGoogleConnectionTest(
    service: GoogleApiService,
  ): Promise<boolean> {
    const accessToken = await resolveGoogleAccessToken();
    const result = await testGoogleConnection(service, accessToken);

    if (result.success) {
      return true;
    }

    if (result.errorType === "service_disabled") {
      setEnableApiService(service);
      setEnableApiUrl(result.enableUrl);
      setEnableApiModalOpen(true);
      setError(null);
      return false;
    }

    setError(result.message);
    return false;
  }

  async function handleGoogleTestConnection(service: GoogleApiService) {
    setTestingGoogleService(service);
    setError(null);

    try {
      const ok = await runGoogleConnectionTest(service);
      if (ok) {
        setGoogleStatus(
          `${service === "contacts" ? "Contacts" : "Calendar"} connection verified.`,
        );
      }
    } catch (err) {
      if (isGoogleApiDisabledError(err)) {
        openEnableApiModal(err);
      } else {
        setError(
          err instanceof Error ? err.message : "Connection test failed.",
        );
      }
    } finally {
      setTestingGoogleService(null);
    }
  }

  async function handleGoogleConnect() {
    if (!user) return;

    setGoogleConnecting(true);
    setError(null);
    setGoogleStatus("Connecting to Google...");

    try {
      const accessToken = await connectGoogleContacts();
      if (!accessToken) {
        throw new Error("Could not get Google access token.");
      }

      const now = new Date().toISOString();
      setGoogleConnectedAt(now);
      setGoogleAccessToken(accessToken);
      setGoogleScopes(["contacts", "calendar"]);
      setGoogleCalendarLastSyncedAt(now);

      await logActivity(user.uid, "calendar_connected", "Connected Google Calendar");
      await updateGoogleCalendarLastSynced(user.uid);

      setGoogleStatus(
        "Google connected. Contacts and Calendar are ready use Sync now to import.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google connection failed.",
      );
      setGoogleStatus(null);
    } finally {
      setGoogleConnecting(false);
    }
  }

  async function handleGoogleSync() {
    if (!user) return;

    setGoogleSyncing(true);
    setError(null);
    setGoogleStatus("Syncing Google contacts...");

    try {
      let accessToken = await resolveGoogleAccessToken();

      try {
        const result = await syncGoogleContacts(
          user.uid,
          accessToken,
          setGoogleStatus,
        );

        setGoogleLastSyncedAt(result.syncedAt);
        setGoogleImportCount(result.imported);
        setGoogleStatus(`Imported ${result.imported} contact(s).`);
      } catch (importErr) {
        if (isGoogleApiDisabledError(importErr)) {
          openEnableApiModal(importErr);
          setGoogleStatus(null);
          return;
        }

        const message =
          importErr instanceof Error
            ? importErr.message
            : "Contacts import failed.";

        if (
          message.toLowerCase().includes("expired") ||
          message.toLowerCase().includes("invalid")
        ) {
          accessToken = await connectGoogleContacts() ?? "";
          if (!accessToken) throw importErr;

          setGoogleAccessToken(accessToken);
          const result = await syncGoogleContacts(
            user.uid,
            accessToken,
            setGoogleStatus,
          );
          setGoogleLastSyncedAt(result.syncedAt);
          setGoogleImportCount(result.imported);
          setGoogleStatus(`Imported ${result.imported} contact(s).`);
        } else {
          setGoogleStatus("Contacts sync failed. Calendar sync continuing...");
          setError(message);
        }
      }

      setGoogleStatus((current) =>
        current ? `${current} Syncing calendar...` : "Syncing calendar...",
      );

      const { start: timeMin, end: timeMax } = getViewRange("week", new Date());
      const calendarResult = await loadCalendarEventsForUser(
        accessToken,
        timeMin,
        timeMax,
      );

      if (calendarResult.needsReconnect) {
        const refreshedToken = await connectGoogleContacts();
        if (!refreshedToken) {
          throw new Error("Google session expired. Please connect again.");
        }

        setGoogleAccessToken(refreshedToken);
        const retry = await loadCalendarEventsForUser(
          refreshedToken,
          timeMin,
          timeMax,
        );

        if (retry.needsReconnect) {
          throw new Error("Google session expired. Please connect again.");
        }
      }

      const syncedAt = new Date().toISOString();
      await updateGoogleCalendarLastSynced(user.uid);
      setGoogleCalendarLastSyncedAt(syncedAt);
      setGoogleStatus((current) =>
        `${current?.replace(/ Syncing calendar\.\.\.$/, "") ?? "Sync complete."} Calendar synced.`,
      );
    } catch (err) {
      if (isGoogleApiDisabledError(err)) {
        openEnableApiModal(err);
        setGoogleStatus(null);
      } else {
        setError(err instanceof Error ? err.message : "Google sync failed.");
        setGoogleStatus(null);
      }
    } finally {
      setGoogleSyncing(false);
    }
  }

  async function handleGoogleDisconnect() {
    if (!user) return;

    setGoogleDisconnecting(true);
    setError(null);

    try {
      await deleteGoogleIntegration(user.uid);
      setGoogleConnectedAt(null);
      setGoogleLastSyncedAt(null);
      setGoogleCalendarLastSyncedAt(null);
      setGoogleImportCount(null);
      setGoogleScopes([]);
      setGoogleAccessToken(null);
      setGoogleStatus("Google disconnected.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not disconnect Google.",
      );
    } finally {
      setGoogleDisconnecting(false);
    }
  }

  async function handleLinkedInDisconnect() {
    if (!user) return;

    setLinkedinDisconnecting(true);
    setError(null);

    try {
      await deleteFileImportMeta(user.uid, "linkedin");
      setLinkedinLastSyncedAt(null);
      setLinkedinImportCount(null);
      setLinkedinStatus("LinkedIn import history cleared.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not disconnect LinkedIn.",
      );
    } finally {
      setLinkedinDisconnecting(false);
    }
  }

  async function handleVcfDisconnect() {
    if (!user) return;

    setVcfDisconnecting(true);
    setError(null);

    try {
      await deleteFileImportMeta(user.uid, "vcf");
      setVcfLastSyncedAt(null);
      setVcfImportCount(null);
      setVcfStatus("Phone contacts import history cleared.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not clear phone import.",
      );
    } finally {
      setVcfDisconnecting(false);
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

  // ── Wizard callbacks ───────────────────────────────────────────────────────

  async function wizardConnectHubSpot(apiToken: string): Promise<void> {
    if (!user) throw new Error("You must be signed in.");
    const integration = await saveHubSpotToken(user.uid, apiToken);
    setToken(apiToken);
    setHubspotConnectedAt(integration.connectedAt);
  }

  async function wizardConnectGoogle(): Promise<string | null> {
    if (!user) throw new Error("You must be signed in.");
    const accessToken = await connectGoogleContacts();
    if (!accessToken) throw new Error("Could not get Google access token.");
    const now = new Date().toISOString();
    setGoogleConnectedAt(now);
    setGoogleAccessToken(accessToken);
    setGoogleScopes(["contacts", "calendar"]);
    setGoogleCalendarLastSyncedAt(now);
    await Promise.all([
      logActivity(user.uid, "calendar_connected", "Connected Google Calendar"),
      updateGoogleCalendarLastSynced(user.uid),
    ]);
    return accessToken;
  }

  async function wizardImportLinkedIn(file: File): Promise<void> {
    if (!user) throw new Error("You must be signed in.");
    const csv = await file.text();
    const result = await syncLinkedInContacts(user.uid, csv, () => {});
    setLinkedinLastSyncedAt(result.syncedAt);
    setLinkedinImportCount(result.imported);
  }

  async function wizardImportVcf(file: File): Promise<void> {
    if (!user) throw new Error("You must be signed in.");
    const content = await file.text();
    const result = await syncVcfContacts(user.uid, content, () => {});
    setVcfLastSyncedAt(result.syncedAt);
    setVcfImportCount(result.imported);
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
          <ImportStatus message={hubspotStatus} loading={hubspotSyncing} />

          {hubspotConnected ? (
            <ConnectedBanner
              title="HubSpot is connected"
              detail={formatConnectedDetail(
                hubspotConnectedAt,
                hubspotLastSyncedAt,
              )}
            />
          ) : null}

          {hubspotConnected ? (
            <IntegrationActionButtons
              connected
              connectLabel="Connect HubSpot"
              connecting={false}
              syncing={hubspotSyncing}
              disconnecting={hubspotDisconnecting}
              onConnect={() => setWizardType("hubspot")}
              onSync={() => void handleHubSpotSync()}
              onDisconnect={() => void handleHubSpotDisconnect()}
              syncDisabled={!token.trim()}
            />
          ) : (
            <Button
              onClick={() => setWizardType("hubspot")}
              disabled={loading}
              className="h-10"
            >
              Connect HubSpot
            </Button>
          )}
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
            href={GOOGLE_PEOPLE_API_ENABLE_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            People API
          </a>
          {" "}and{" "}
          <a
            href={GOOGLE_CALENDAR_API_ENABLE_URL}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleGoogleTestConnection("contacts")}
              disabled={testingGoogleService === "contacts" || googleConnecting}
              className="mt-2 h-8"
            >
              {testingGoogleService === "contacts" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test connection"
              )}
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleGoogleTestConnection("calendar")}
              disabled={testingGoogleService === "calendar" || googleConnecting}
              className="mt-2 h-8"
            >
              {testingGoogleService === "calendar" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test connection"
              )}
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ImportStatus message={googleStatus} loading={googleSyncing || googleConnecting} />

          {googleConnected ? (
            <ConnectedBanner
              title="Google is connected"
              detail={formatConnectedDetail(
                googleConnectedAt,
                googleLastSyncedAt ?? googleCalendarLastSyncedAt,
              )}
            />
          ) : null}

          <IntegrationActionButtons
            connected={googleConnected}
            connectLabel="Connect Google"
            connecting={googleConnecting}
            syncing={googleSyncing}
            disconnecting={googleDisconnecting}
            onConnect={() => setWizardType("google")}
            onSync={() => void handleGoogleSync()}
            onDisconnect={() => void handleGoogleDisconnect()}
            connectDisabled={loading}
          />
        </div>
      </IntegrationCard>

      <EnableApiModal
        open={enableApiModalOpen}
        onOpenChange={setEnableApiModalOpen}
        service={enableApiService}
        enableUrl={enableApiUrl}
        onTestAgain={() => runGoogleConnectionTest(enableApiService)}
      />

      <IntegrationCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-md bg-[#0A66C2] text-white">
            <LinkedInLogo className="size-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            LinkedIn Connections
          </span>
          <IntegrationStatusBadge connected={linkedinConnected} />
        </div>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Import your LinkedIn connections via CSV export.
        </p>

        <div className="mt-6 space-y-4">
          {linkedinConnected ? (
            <ConnectedBanner
              title="LinkedIn import is connected"
              detail={formatConnectedDetail(null, linkedinLastSyncedAt)}
            />
          ) : null}

          {linkedinImportCount !== null ? (
            <p className="text-xs text-muted-foreground">
              {linkedinImportCount} contact
              {linkedinImportCount === 1 ? "" : "s"} imported
            </p>
          ) : null}

          <ImportStatus message={linkedinStatus} loading={linkedinSyncing} />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setWizardType("linkedin")}
              disabled={linkedinSyncing}
              className="h-10"
            >
              {linkedinConnected ? "Import again" : "Import from LinkedIn"}
            </Button>

            {linkedinConnected ? (
              <Button
                variant="outline"
                onClick={() => void handleLinkedInDisconnect()}
                disabled={linkedinDisconnecting}
                className="h-10 text-destructive hover:text-destructive"
              >
                {linkedinDisconnecting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unplug className="size-4" />
                    Disconnect
                  </>
                )}
              </Button>
            ) : null}
          </div>
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
          <IntegrationStatusBadge connected={vcfConnected} />
        </div>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Import contacts exported from your phone as a VCF file.
        </p>

        <div className="mt-6 space-y-4">
          {vcfConnected ? (
            <ConnectedBanner
              title="Phone contacts import is connected"
              detail={formatConnectedDetail(null, vcfLastSyncedAt)}
            />
          ) : null}

          {vcfImportCount !== null ? (
            <p className="text-xs text-muted-foreground">
              {vcfImportCount} contact{vcfImportCount === 1 ? "" : "s"} imported
            </p>
          ) : null}

          <ImportStatus message={vcfStatus} loading={vcfSyncing} />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setWizardType("vcf")}
              disabled={vcfSyncing}
              className="h-10"
            >
              {vcfConnected ? "Import again" : "Import contacts"}
            </Button>

            {vcfConnected ? (
              <Button
                variant="outline"
                onClick={() => void handleVcfDisconnect()}
                disabled={vcfDisconnecting}
                className="h-10 text-destructive hover:text-destructive"
              >
                {vcfDisconnecting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unplug className="size-4" />
                    Disconnect
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </IntegrationCard>

      <ConnectWizard
        open={wizardType !== null}
        onOpenChange={(open) => { if (!open) setWizardType(null); }}
        type={wizardType ?? "hubspot"}
        onHubSpotConnect={(apiToken) => wizardConnectHubSpot(apiToken)}
        onGoogleConnect={() => wizardConnectGoogle()}
        onLinkedInImport={(file) => wizardImportLinkedIn(file)}
        onVcfImport={(file) => wizardImportVcf(file)}
      />
    </div>
  );
}
