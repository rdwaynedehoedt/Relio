"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  Brain,
  Building2,
  Flag,
  Landmark,
  Users,
  Wallet,
} from "lucide-react";
import TodayMeetingsCard from "@/components/calendar/TodayMeetingsCard";
import AuthGuard from "@/components/AuthGuard";
import GettingStartedCard from "@/components/onboarding/GettingStartedCard";
import Sidebar from "@/components/Sidebar";
import SidebarInset from "@/components/SidebarInset";
import { SidebarProvider } from "@/hooks/useSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/contact-utils";
import {
  getActiveGoals,
  getFdTimelinePoints,
  getRecentContacts,
  getRecentNotes,
} from "@/lib/dashboard-utils";
import {
  fetchExchangeRates,
  formatLkr,
  getMonthlyStats,
  getNetWorthSummary,
  type ExchangeRates,
} from "@/lib/finance-utils";
import {
  getCompanies,
  getContacts,
  getFileImportMeta,
  getFixedDeposits,
  getGoals,
  getGoogleIntegration,
  getHubSpotToken,
  getNotes,
  getTransactions,
  getWallets,
} from "@/lib/firestore";
import type {
  Contact,
  FixedDeposit,
  Goal,
  Note,
  Transaction,
  Wallet as WalletType,
} from "@/lib/types";
import { GOAL_STATUS_LABELS } from "@/lib/lifemap-utils";
import { NOTE_TYPE_ICONS } from "@/lib/note-utils";
import { getTimeGreeting, getUserFirstName } from "@/lib/user-utils";

const DEFAULT_RATES: ExchangeRates = {
  USD: 0,
  GBP: 0,
  AED: 0,
  AUD: 0,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);
  const [notes, setNotes] = useState<Note[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hasIntegration, setHasIntegration] = useState(false);

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    async function loadDashboard() {
      try {
        const [
          userContacts,
          userCompanies,
          userWallets,
          fds,
          userTransactions,
          exchangeRates,
          userNotes,
          userGoals,
          hubspot,
          google,
          linkedin,
          vcf,
        ] = await Promise.all([
          getContacts(userId),
          getCompanies(userId),
          getWallets(userId),
          getFixedDeposits(userId),
          getTransactions(userId),
          fetchExchangeRates().catch(() => DEFAULT_RATES),
          getNotes(userId),
          getGoals(userId),
          getHubSpotToken(userId),
          getGoogleIntegration(userId),
          getFileImportMeta(userId, "linkedin"),
          getFileImportMeta(userId, "vcf"),
        ]);

        setContacts(userContacts);
        setCompanyCount(userCompanies.length);
        setWallets(userWallets);
        setFixedDeposits(fds);
        setTransactions(userTransactions);
        setRates(exchangeRates);
        setNotes(userNotes);
        setGoals(userGoals);
        setHasIntegration(
          Boolean(
            hubspot?.token ||
              google?.accessToken ||
              linkedin?.lastSyncedAt ||
              vcf?.lastSyncedAt,
          ),
        );
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [user]);

  const firstName = getUserFirstName(user?.displayName, user?.email);
  const greeting = getTimeGreeting();
  const recentContacts = getRecentContacts(contacts);
  const recentNotes = getRecentNotes(notes, 3);
  const activeGoals = getActiveGoals(goals, 3);
  const fullNetWorth = useMemo(
    () => getNetWorthSummary(wallets, fixedDeposits, rates),
    [wallets, fixedDeposits, rates],
  );

  const monthlyStats = useMemo(
    () => getMonthlyStats(transactions, wallets, rates),
    [transactions, wallets, rates],
  );

  const fdTimeline = useMemo(
    () => getFdTimelinePoints(fixedDeposits, rates),
    [fixedDeposits, rates],
  );

  const ratePairs: { key: keyof ExchangeRates; label: string }[] = [
    { key: "USD", label: "USD → LKR" },
    { key: "GBP", label: "GBP → LKR" },
    { key: "AED", label: "AED → LKR" },
    { key: "AUD", label: "AUD → LKR" },
  ];

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />

          <SidebarInset className="min-h-screen">
          <div className="mx-auto max-w-7xl px-8 py-8">
            {/* Section 1 Morning Briefing */}
            <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {greeting}, {firstName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(new Date(), "EEEE, d MMMM yyyy")}
              </p>
            </section>

            <GettingStartedCard
              contactCount={contacts.length}
              walletCount={wallets.length}
              noteCount={notes.length}
              goalCount={goals.length}
              hasIntegration={hasIntegration}
            />

            {/* Section 2 Command Center */}
            <section className="mt-6 grid gap-4 xl:grid-cols-3">
              <CommandCard title="CRM snapshot" subtitle="Your pipeline at a glance">
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Contacts" value={loading ? "—" : contacts.length} />
                  <MiniStat label="Companies" value={loading ? "—" : companyCount} />
                </div>

                <div className="mt-5 space-y-1">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Recent contacts
                  </p>
                  {loading ? (
                    <p className="py-6 text-sm text-muted-foreground">Loading...</p>
                  ) : recentContacts.length === 0 ? (
                    <p className="py-6 text-sm text-muted-foreground">
                      No contacts yet
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/40">
                      {recentContacts.map((contact) => (
                        <li key={contact.id}>
                          <Link
                            href={`/contacts?id=${contact.id}`}
                            className="flex items-center gap-3 py-3 transition-colors hover:text-foreground"
                          >
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                                {getInitials(
                                  contact.firstName,
                                  contact.lastName,
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {contact.companyName || "No company"}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Link
                  href="/contacts"
                  className="mt-4 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  View all contacts
                </Link>
              </CommandCard>

              <CommandCard title="Finance snapshot" subtitle="Net worth & cash flow">
                <div>
                  <p className="text-xs text-muted-foreground">Net worth</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                    {loading ? "—" : formatLkr(fullNetWorth.totalLkr)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatLkr(fullNetWorth.liquidLkr)} liquid ·{" "}
                    {formatLkr(fullNetWorth.lockedLkr)} in FDs
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-rose-500/5 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="mt-0.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
                      {loading ? "—" : formatLkr(monthlyStats.totalSpentLkr)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">Income</p>
                    <p className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {loading ? "—" : formatLkr(monthlyStats.totalIncomeLkr)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Exchange rates
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ratePairs.map(({ key, label }) => (
                      <div
                        key={key}
                        className="rounded-lg bg-muted/40 px-2.5 py-2 text-xs"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <p className="mt-0.5 font-medium text-foreground">
                          {rates[key] ? rates[key].toFixed(2) : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CommandCard>

              <CommandCard
                title="Personal snapshot"
                subtitle="Second Brain & Life Map"
              >
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat
                    label="Notes"
                    value={loading ? "—" : notes.length}
                  />
                  <MiniStat
                    label="Goals"
                    value={loading ? "—" : goals.length}
                  />
                </div>

                <div className="mt-5 space-y-1">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Recent notes
                  </p>
                  {loading ? (
                    <p className="py-4 text-sm text-muted-foreground">Loading...</p>
                  ) : recentNotes.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                      No notes yet
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/40">
                      {recentNotes.map((note) => {
                        const NoteIcon = NOTE_TYPE_ICONS[note.type];

                        return (
                          <li key={note.id}>
                            <Link
                              href="/brain"
                              className="flex items-center gap-3 py-2.5 transition-colors hover:text-foreground"
                            >
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                <NoteIcon className="size-3.5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {note.title || "Untitled"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {note.type}
                                </p>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <Link
                  href="/brain"
                  className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Open Second Brain
                </Link>

                <div className="mt-5 border-t border-border/40 pt-5 space-y-1">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Active goals
                  </p>
                  {loading ? (
                    <p className="py-4 text-sm text-muted-foreground">Loading...</p>
                  ) : activeGoals.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                      No active goals yet
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/40">
                      {activeGoals.map((goal) => (
                        <li key={goal.id}>
                          <Link
                            href="/lifemap"
                            className="flex items-center gap-3 py-2.5 transition-colors hover:text-foreground"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-base">
                              {goal.coverEmoji || "🎯"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {goal.title}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {GOAL_STATUS_LABELS[goal.status]}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Link
                  href="/lifemap"
                  className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Open Life Map
                </Link>
              </CommandCard>
            </section>

            <section className="mt-6">
              <TodayMeetingsCard />
            </section>

            {/* Section 3 Overview */}
            <section className="mt-8">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <OverviewStat
                  label="Total Contacts"
                  value={loading ? "—" : contacts.length}
                  icon={Users}
                />
                <OverviewStat
                  label="Total Companies"
                  value={loading ? "—" : companyCount}
                  icon={Building2}
                />
                <OverviewStat
                  label="Notes"
                  value={loading ? "—" : notes.length}
                  icon={Brain}
                />
                <OverviewStat
                  label="Goals"
                  value={loading ? "—" : goals.length}
                  icon={Flag}
                />
                <OverviewStat
                  label="Total Wallets"
                  value={loading ? "—" : wallets.length}
                  icon={Wallet}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      FD maturity timeline
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Today through nearest maturities
                    </p>
                  </div>
                  <Landmark className="size-4 text-muted-foreground" />
                </div>

                {loading ? (
                  <p className="mt-8 text-sm text-muted-foreground">Loading...</p>
                ) : fdTimeline.length === 0 ? (
                  <p className="mt-8 text-sm text-muted-foreground">
                    No fixed deposits yet
                  </p>
                ) : (
                  <div className="mt-8">
                    <div className="relative h-2 rounded-full bg-muted/60">
                      <div className="absolute top-1/2 left-0 size-3 -translate-y-1/2 rounded-full bg-foreground" />
                      {fdTimeline.map((point) => (
                        <FdTimelineDot key={point.id} point={point} />
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                      <span>Today</span>
                      <span>
                        {format(
                          parseISO(
                            fdTimeline[fdTimeline.length - 1]?.maturityDate ??
                              new Date().toISOString(),
                          ),
                          "MMM d, yyyy",
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

function CommandCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function OverviewStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function FdTimelineDot({
  point,
}: {
  point: {
    id: string;
    bankName: string;
    amountLkr: number;
    position: number;
    daysRemaining: number;
  };
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${point.position}%` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="size-3 rounded-full border-2 border-background bg-violet-500 shadow-sm transition-transform hover:scale-125"
        aria-label={`${point.bankName} matures in ${point.daysRemaining} days`}
      />
      {hovered ? (
        <div className="absolute bottom-5 left-1/2 z-20 w-44 -translate-x-1/2 rounded-lg border border-border/60 bg-card px-3 py-2 text-left shadow-md">
          <p className="text-xs font-medium text-foreground">{point.bankName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatLkr(point.amountLkr)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {point.daysRemaining} days left
          </p>
        </div>
      ) : null}
    </div>
  );
}
