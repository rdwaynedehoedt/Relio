"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  ArrowDownRight,
  Building2,
  Clock,
  Download,
  Landmark,
  Lock,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import SidebarInset from "@/components/SidebarInset";
import { SidebarProvider } from "@/hooks/useSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/contact-utils";
import {
  getFdTimelinePoints,
  getRecentContacts,
} from "@/lib/dashboard-utils";
import {
  fetchExchangeRates,
  formatLkr,
  getMonthlyStats,
  getNetWorthSummary,
  type ExchangeRates,
} from "@/lib/finance-utils";
import {
  getActivities,
  getCompanies,
  getContacts,
  getFixedDeposits,
  getTransactions,
  getWallets,
} from "@/lib/firestore";
import type {
  Activity,
  ActivityType,
  Contact,
  FixedDeposit,
  Transaction,
  Wallet as WalletType,
} from "@/lib/types";
import { getTimeGreeting, getUserFirstName } from "@/lib/user-utils";

const DEFAULT_RATES: ExchangeRates = {
  USD: 0,
  GBP: 0,
  AED: 0,
  AUD: 0,
};

const ACTIVITY_ICONS: Record<
  ActivityType,
  React.ComponentType<{ className?: string }>
> = {
  contact_added: UserPlus,
  company_added: Building2,
  wallet_added: Wallet,
  transaction_added: ArrowDownRight,
  fd_added: Lock,
  hubspot_import: Download,
  google_import: Download,
  linkedin_import: Download,
  vcf_import: Download,
  transactions_imported: Download,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);

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
          userActivities,
          exchangeRates,
        ] = await Promise.all([
          getContacts(userId),
          getCompanies(userId),
          getWallets(userId),
          getFixedDeposits(userId),
          getTransactions(userId),
          getActivities(userId, 10),
          fetchExchangeRates().catch(() => DEFAULT_RATES),
        ]);

        setContacts(userContacts);
        setCompanyCount(userCompanies.length);
        setWallets(userWallets);
        setFixedDeposits(fds);
        setTransactions(userTransactions);
        setActivities(userActivities);
        setRates(exchangeRates);
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
  const hubspotCount = contacts.filter(
    (contact) => contact.source === "hubspot",
  ).length;
  const recentContacts = getRecentContacts(contacts);
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
            {/* Section 1 — Morning Briefing */}
            <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {greeting}, {firstName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(new Date(), "EEEE, d MMMM yyyy")}
              </p>
            </section>

            {/* Section 2 — Command Center */}
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

              <CommandCard title="Activity feed" subtitle="Latest across Relio">
                {loading ? (
                  <p className="py-8 text-sm text-muted-foreground">Loading...</p>
                ) : activities.length === 0 ? (
                  <p className="py-8 text-sm text-muted-foreground">
                    No activity yet. Add a contact, wallet, or transaction to get
                    started.
                  </p>
                ) : (
                  <ul className="space-y-0">
                    {activities.map((activity, index) => {
                      const Icon = ACTIVITY_ICONS[activity.type] ?? Clock;

                      return (
                        <li
                          key={activity.id ?? `${activity.createdAt}-${index}`}
                          className="relative flex gap-3 pb-5 last:pb-0"
                        >
                          {index < activities.length - 1 ? (
                            <span className="absolute top-8 left-4 h-[calc(100%-12px)] w-px bg-border/60" />
                          ) : null}
                          <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Icon className="size-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-sm text-foreground">
                              {activity.description}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {activity.createdAt
                                ? formatDistanceToNow(
                                    parseISO(activity.createdAt),
                                    { addSuffix: true },
                                  )
                                : "Just now"}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CommandCard>
            </section>

            {/* Section 3 — Overview */}
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
                  label="HubSpot Contacts"
                  value={loading ? "—" : hubspotCount}
                  icon={Download}
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
