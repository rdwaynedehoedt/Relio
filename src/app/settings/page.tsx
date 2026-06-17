"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { updateProfile } from "firebase/auth";
import {
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Plug,
  RefreshCw,
  Sun,
  User,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import HubSpotLogo from "@/components/HubSpotLogo";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/context/PreferencesContext";
import { auth } from "@/lib/firebase";
import {
  getHubSpotToken,
  saveHubSpotToken,
} from "@/lib/firestore";
import { syncHubSpotData } from "@/lib/hubspot-sync";
import {
  fetchDetectedCountry,
  getCountryFlag,
  type DetectedCountry,
} from "@/lib/country-utils";
import type { ThemeMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type SettingsSection = "profile" | "integrations" | "preferences";

const sections: {
  id: SettingsSection;
  label: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Your personal account details",
    icon: User,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connect external tools",
    icon: Plug,
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Appearance and defaults",
    icon: Palette,
  },
];

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const initialSection: SettingsSection =
    sectionParam === "integrations" || sectionParam === "preferences"
      ? sectionParam
      : "profile";
  const [activeSection, setActiveSection] =
    useState<SettingsSection>(initialSection);

  useEffect(() => {
    if (
      sectionParam === "integrations" ||
      sectionParam === "preferences" ||
      sectionParam === "profile"
    ) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="pl-72">
          <div className="mx-auto max-w-5xl px-10 py-12">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-8 shadow-sm">
              <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-gradient-to-br from-muted via-transparent to-transparent" />
              <div className="relative">
                <p className="text-sm font-medium text-muted-foreground">Workspace</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                  Settings
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Manage your profile, integrations, and workspace preferences.
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-10">
              <nav className="w-56 shrink-0">
                <div className="sticky top-8 space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-all",
                          isActive
                            ? "bg-card shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            isActive ? "text-foreground" : "text-muted-foreground",
                          )}
                        />
                        <span>
                          <span
                            className={cn(
                              "block text-sm font-medium",
                              isActive ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {section.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {section.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="min-w-0 flex-1">
                {activeSection === "profile" ? <ProfileSection /> : null}
                {activeSection === "integrations" ? (
                  <IntegrationsSection />
                ) : null}
                {activeSection === "preferences" ? (
                  <PreferencesSection />
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
  }, [user?.displayName]);

  async function handleSave() {
    if (!auth?.currentUser) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  const initials = (displayName || user?.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SettingsCard
      title="Profile"
      description="Update how you appear across Relio."
    >
      <div className="flex items-start gap-5">
        <Avatar className="size-16 ring-2 ring-border">
          <AvatarImage src={user?.photoURL ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-muted text-base font-semibold text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">
              Display name
            </span>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-11"
              placeholder="Your name"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Email</span>
            <Input
              value={user?.email ?? ""}
              readOnly
              className="h-11 bg-muted/50 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Email is managed by your sign-in provider and cannot be changed
              here.
            </p>
          </label>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="h-10"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save profile"
              )}
            </Button>
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <Check className="size-4" />
                Saved
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

function IntegrationsSection() {
  const { user } = useAuth();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isConnected = Boolean(token.trim() || connectedAt);

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    async function loadIntegration() {
      try {
        const integration = await getHubSpotToken(userId);
        if (integration) {
          setToken(integration.token);
          setConnectedAt(integration.connectedAt);
          setLastSyncedAt(integration.lastSyncedAt ?? null);
        }
      } catch (err) {
        console.error("Failed to load HubSpot integration:", err);
      } finally {
        setLoading(false);
      }
    }

    loadIntegration();
  }, [user]);

  async function handleSaveToken() {
    if (!user || !token.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const integration = await saveHubSpotToken(user.uid, token.trim());
      setConnectedAt(integration.connectedAt);
      setSyncStatus(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save HubSpot token.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    if (!user || !token.trim()) return;

    setSyncing(true);
    setError(null);
    setSyncStatus("Connecting to HubSpot...");

    try {
      const result = await syncHubSpotData(user.uid, token.trim(), setSyncStatus);
      setLastSyncedAt(result.syncedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
      setSyncStatus(null);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <SettingsCard
      title="Integrations"
      description="Connect Relio to your existing tools."
    >
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <HubSpotLogo height={30} />
              {isConnected ? (
                <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  Connected
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="border-border bg-muted text-muted-foreground"
                >
                  Not connected
                </Badge>
              )}
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

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {syncStatus ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
              {syncing ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              {syncStatus}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void handleSaveToken()}
              disabled={saving || !token.trim()}
              className="h-10"
            >
              {saving ? "Saving..." : "Save Token"}
            </Button>

            <Button
              variant="outline"
              onClick={() => void handleSync()}
              disabled={syncing || !token.trim()}
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
                  Sync Now
                </>
              )}
            </Button>
          </div>

          {!token.trim() ? (
            <p className="text-xs text-muted-foreground">
              Enter your Private App Token above to enable sync.
            </p>
          ) : !connectedAt ? (
            <p className="text-xs text-muted-foreground">
              Save your token first, then click Sync Now to import contacts and
              companies.
            </p>
          ) : null}

          {lastSyncedAt ? (
            <p className="text-xs text-muted-foreground">
              Last synced{" "}
              {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
            </p>
          ) : null}
        </div>
      </div>
    </SettingsCard>
  );
}

function PreferencesSection() {
  const { preferences, updatePreferences, loading, setTheme } = usePreferences();
  const [defaultCountry, setDefaultCountry] = useState(
    preferences.defaultCountry ?? "",
  );
  const [defaultCountryCode, setDefaultCountryCode] = useState(
    preferences.defaultCountryCode ?? "",
  );
  const [detectedCountry, setDetectedCountry] =
    useState<DetectedCountry | null>(null);
  const [detectingCountry, setDetectingCountry] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [themeSaving, setThemeSaving] = useState<ThemeMode | null>(null);

  useEffect(() => {
    setDefaultCountry(preferences.defaultCountry ?? "");
    setDefaultCountryCode(preferences.defaultCountryCode ?? "");
  }, [preferences]);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    async function detectCountry() {
      setDetectingCountry(true);

      try {
        const detected = await fetchDetectedCountry();
        if (cancelled) return;

        setDetectedCountry(detected);

        if (!preferences.defaultCountry && detected) {
          await updatePreferences({
            defaultCountry: detected.country,
            defaultCountryCode: detected.countryCode,
          });
        }
      } finally {
        if (!cancelled) {
          setDetectingCountry(false);
        }
      }
    }

    void detectCountry();

    return () => {
      cancelled = true;
    };
  }, [loading, preferences.defaultCountry, updatePreferences]);

  const themeOptions: {
    value: ThemeMode;
    label: string;
    icon: typeof Sun;
  }[] = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  const displayCountry = defaultCountry || detectedCountry?.country || "";
  const displayCountryCode =
    defaultCountryCode || detectedCountry?.countryCode || "";
  const countrySource = preferences.defaultCountry
    ? "Saved default"
    : detectedCountry && detectedCountry.country === displayCountry
      ? "Detected from your location"
      : "Custom";

  async function handleThemeChange(nextTheme: ThemeMode) {
    setThemeSaving(nextTheme);
    try {
      await setTheme(nextTheme);
    } finally {
      setThemeSaving(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      await updatePreferences({
        defaultCountry: defaultCountry.trim() || undefined,
        defaultCountryCode: defaultCountryCode.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function applyDetectedCountry() {
    if (!detectedCountry) return;
    setDefaultCountry(detectedCountry.country);
    setDefaultCountryCode(detectedCountry.countryCode);
  }

  return (
    <SettingsCard
      title="Preferences"
      description="Customize how Relio looks and behaves."
    >
      <div className="space-y-0">
        <div className="pb-8">
          <h3 className="text-sm font-medium text-foreground">Appearance</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how Relio looks on your device.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = preferences.theme === option.value;
              const isSavingTheme = themeSaving === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => void handleThemeChange(option.value)}
                  disabled={Boolean(themeSaving)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-4 transition-all",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted",
                  )}
                >
                  {isSavingTheme ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border py-8">
          <h3 className="text-sm font-medium text-foreground">Default country</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pre-fills the country field when adding new contacts.
          </p>

          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
            {detectingCountry ? (
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Detecting your location...</p>
              </div>
            ) : displayCountry ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card text-2xl shadow-sm ring-1 ring-border"
                    aria-hidden
                  >
                    {getCountryFlag(displayCountry, displayCountryCode)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayCountry}
                    </p>
                    <p className="text-xs text-muted-foreground">{countrySource}</p>
                  </div>
                </div>
                {detectedCountry &&
                detectedCountry.country !== defaultCountry ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0"
                    onClick={applyDetectedCountry}
                  >
                    Use detected
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Could not detect your country. Enter one below.
              </p>
            )}
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Override country
            </span>
            <Input
              value={defaultCountry}
              onChange={(event) => {
                setDefaultCountry(event.target.value);
                setDefaultCountryCode("");
              }}
              placeholder="United States"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-6">
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="h-10"
          >
            {saving ? "Saving..." : "Save preferences"}
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="size-4" />
              Saved
            </span>
          ) : null}
        </div>
      </div>
    </SettingsCard>
  );
}
