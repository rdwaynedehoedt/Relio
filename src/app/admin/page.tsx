"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Brain,
  Building2,
  Flag,
  Landmark,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import AdminGuard from "@/components/AdminGuard";
import Sidebar from "@/components/Sidebar";
import SidebarInset from "@/components/SidebarInset";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider } from "@/hooks/useSidebar";
import { useAuth } from "@/context/AuthContext";
import {
  adoptionPercent,
  fetchAdminDashboardData,
  formatAuthSource,
  formatDateTime,
  formatRelativeTime,
  totalUserRecords,
  type AdminDashboardData,
  type AdminUserRow,
} from "@/lib/admin-utils";
import { getInitials } from "@/lib/contact-utils";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm",
        highlight
          ? "border-[#0a0a0a]/10 bg-[#0a0a0a] text-white"
          : "border-border/60 bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-xs font-medium tracking-wide uppercase",
            highlight ? "text-white/60" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        <Icon
          className={cn("size-4", highlight ? "text-white/70" : "text-muted-foreground")}
        />
      </div>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight",
          highlight ? "text-white" : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub ? (
        <p
          className={cn(
            "mt-1 text-xs",
            highlight ? "text-white/60" : "text-muted-foreground",
          )}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function UserAvatar({ user }: { user: AdminUserRow }) {
  const name = user.displayName || user.email || "User";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "U";
  const lastName = parts[1] ?? "";

  return (
    <Avatar className="size-9">
      {user.photoURL ? <AvatarImage src={user.photoURL} alt={name} /> : null}
      <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
        {lastName
          ? getInitials(firstName, lastName)
          : firstName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function UserTableRow({
  user,
  expanded,
  onToggle,
}: {
  user: AdminUserRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const name = user.displayName || user.email || "Unknown user";
  const totalItems =
    user.contactsCount +
    user.companiesCount +
    user.notesCount +
    user.goalsCount +
    user.walletsCount;

  return (
    <>
      <tr
        className="cursor-pointer border-t border-border/40 transition-colors hover:bg-muted/30"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                {user.disabled ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    Disabled
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {user.email ?? user.userId.slice(0, 12)}
              </p>
            </div>
          </div>
        </td>
        <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
          {formatDateTime(user.signedUpAt)}
        </td>
        <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
          {formatRelativeTime(user.lastActiveAt)}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-foreground">{totalItems}</td>
        <td className="hidden px-4 py-3 text-sm text-foreground sm:table-cell">
          {user.contactsCount}
        </td>
        <td className="hidden px-4 py-3 text-sm text-foreground md:table-cell">
          {user.walletsCount}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {formatAuthSource(user.source)}
        </td>
      </tr>
      {expanded ? (
        <tr className="border-t border-border/30 bg-muted/20">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">User ID</p>
                <p className="mt-1 font-mono text-xs text-foreground">{user.userId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Content</p>
                <p className="mt-1 text-foreground">
                  {user.contactsCount} contacts · {user.companiesCount} companies ·{" "}
                  {user.notesCount} notes · {user.goalsCount} goals
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Finance</p>
                <p className="mt-1 text-foreground">
                  {user.walletsCount} wallets · {user.transactionsCount} transactions
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Integrations</p>
                <p className="mt-1 text-foreground">
                  {[
                    user.hasHubSpot ? "HubSpot" : null,
                    user.hasGoogle ? "Google" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "None"}
                </p>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const idToken = await user.getIdToken();
      const dashboard = await fetchAdminDashboardData(idToken);
      setData(dashboard);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load admin dashboard",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data.users;

    return data.users.filter((row) =>
      [row.displayName, row.email, row.userId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [data, search]);

  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />

          <SidebarInset className="min-h-screen">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                    Relio Admin
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    Platform overview
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Real user counts from Firebase Auth + live Firestore data
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {lastRefreshed ? (
                    <p className="text-xs text-muted-foreground">
                      Updated {format(lastRefreshed, "MMM d · h:mm a")}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void loadData(true)}
                    disabled={refreshing}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-60"
                  >
                    <RefreshCw
                      className={cn("size-4", refreshing && "animate-spin")}
                    />
                    Refresh
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="mt-20 flex justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
                  <p className="text-sm font-medium text-destructive">
                    Could not load admin data
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Vercel / local: set{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
                    </code>{" "}
                    in environment variables. Run{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      npm run encode-firebase-admin-env
                    </code>{" "}
                    to generate the value.
                  </p>
                </div>
              ) : data ? (
                <div className="mt-8 space-y-8">
                  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      label="Total users"
                      value={data.totalUsers}
                      sub={`${data.newUsersToday} joined today`}
                      icon={Users}
                      highlight
                    />
                    <StatCard
                      label="Active this week"
                      value={data.activeUsersThisWeek}
                      sub={`${adoptionPercent(data.activeUsersThisWeek, data.totalUsers)} of all users`}
                      icon={Activity}
                    />
                    <StatCard
                      label="New this week"
                      value={data.newUsersThisWeek}
                      sub={`${data.authBreakdown.google} Google · ${data.authBreakdown.email} email`}
                      icon={TrendingUp}
                    />
                    <StatCard
                      label="Total records"
                      value={totalUserRecords(data).toLocaleString()}
                      sub="Contacts, notes, goals, wallets & more"
                      icon={Building2}
                    />
                  </section>

                  <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                    <StatCard label="Contacts" value={data.totalContacts} icon={Users} />
                    <StatCard label="Companies" value={data.totalCompanies} icon={Building2} />
                    <StatCard label="Notes" value={data.totalNotes} icon={Brain} />
                    <StatCard label="Goals" value={data.totalGoals} icon={Flag} />
                    <StatCard label="Wallets" value={data.totalWallets} icon={Wallet} />
                    <StatCard label="Transactions" value={data.totalTransactions} icon={Wallet} />
                    <StatCard label="Fixed deposits" value={data.totalFixedDeposits} icon={Landmark} />
                    <StatCard label="Activities" value={data.totalActivities} icon={Activity} />
                  </section>

                  <section className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
                      <h2 className="text-base font-semibold text-foreground">
                        Signups · last 14 days
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        New Firebase Auth accounts per day
                      </p>
                      <div className="mt-5 h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.signupTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip
                              formatter={(value) => [`${value} users`, "Signups"]}
                              contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                              }}
                            />
                            <Bar dataKey="count" fill="#0a0a0a" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                      <h2 className="text-base font-semibold text-foreground">
                        Auth methods
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        How users signed up
                      </p>
                      <div className="mt-6 space-y-4">
                        {[
                          { label: "Google", value: data.authBreakdown.google, color: "#4285F4" },
                          { label: "Email", value: data.authBreakdown.email, color: "#0a0a0a" },
                          { label: "Other", value: data.authBreakdown.other, color: "#a3a3a3" },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="text-foreground">{item.label}</span>
                              <span className="text-muted-foreground">
                                {item.value} · {adoptionPercent(item.value, data.totalUsers)}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: adoptionPercent(item.value, data.totalUsers),
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-foreground">All users</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {filteredUsers.length} registered accounts from Firebase Auth
                        </p>
                      </div>
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="search"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search name or email"
                          className="h-10 w-full rounded-lg border border-border/60 bg-background pr-3 pl-9 text-sm outline-none focus:border-border"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead className="bg-muted/30 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="hidden px-4 py-3 md:table-cell">Signed up</th>
                            <th className="hidden px-4 py-3 lg:table-cell">Last active</th>
                            <th className="px-4 py-3">Items</th>
                            <th className="hidden px-4 py-3 sm:table-cell">Contacts</th>
                            <th className="hidden px-4 py-3 md:table-cell">Wallets</th>
                            <th className="px-4 py-3">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-10 text-center text-sm text-muted-foreground"
                              >
                                No users match your search.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((row) => (
                              <UserTableRow
                                key={row.userId}
                                user={row}
                                expanded={expandedUserId === row.userId}
                                onToggle={() =>
                                  setExpandedUserId((current) =>
                                    current === row.userId ? null : row.userId,
                                  )
                                }
                              />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                      <h2 className="text-base font-semibold text-foreground">
                        Feature adoption
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        % of registered users using each feature
                      </p>
                      <div className="mt-5 h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={data.featureAdoption}
                            layout="vertical"
                            margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
                          >
                            <XAxis type="number" allowDecimals={false} domain={[0, "dataMax"]} />
                            <YAxis
                              type="category"
                              dataKey="label"
                              width={120}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              formatter={(value, _name, item) => {
                                const total = item.payload.total as number;
                                return [
                                  `${value} users (${adoptionPercent(Number(value), total)})`,
                                  "Adoption",
                                ];
                              }}
                              contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                              }}
                            />
                            <Bar dataKey="users" radius={[0, 6, 6, 0]}>
                              {data.featureAdoption.map((entry, index) => (
                                <Cell
                                  key={entry.label}
                                  fill={index % 2 === 0 ? "#0a0a0a" : "#525252"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                        <h2 className="text-base font-semibold text-foreground">
                          Recent signups
                        </h2>
                        <ul className="mt-4 divide-y divide-border/40">
                          {data.recentSignups.map((signup) => (
                            <li
                              key={signup.userId}
                              className="flex items-center justify-between gap-3 py-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <UserAvatar user={signup} />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {signup.displayName || signup.email || "Unknown"}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {signup.email}
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(signup.signedUpAt)}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {formatAuthSource(signup.source)}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                        <h2 className="text-base font-semibold text-foreground">
                          Live activity
                        </h2>
                        <ul className="mt-4 max-h-80 divide-y divide-border/40 overflow-y-auto">
                          {data.recentActivities.map((activity) => (
                            <li key={activity.id} className="py-3">
                              <p className="text-sm text-foreground">
                                <span className="font-medium">{activity.userLabel}</span>{" "}
                                {activity.description}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {activity.createdAt
                                  ? format(parseISO(activity.createdAt), "MMM d · h:mm a")
                                  : "—"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
}
