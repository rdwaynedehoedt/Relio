export type AdminAuthSource = "google" | "email" | "unknown";

export interface AdminUserRow {
  userId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  signedUpAt: string | null;
  lastActiveAt: string | null;
  contactsCount: number;
  companiesCount: number;
  notesCount: number;
  goalsCount: number;
  walletsCount: number;
  transactionsCount: number;
  lifeEventsCount: number;
  source: AdminAuthSource;
  hasHubSpot: boolean;
  hasGoogle: boolean;
  disabled?: boolean;
}

export interface AdminFeatureAdoption {
  label: string;
  users: number;
  total: number;
}

export interface AdminActivityItem {
  id: string;
  userId: string;
  userLabel: string;
  description: string;
  createdAt: string;
}

export interface AdminSignupTrendPoint {
  date: string;
  count: number;
}

export interface AdminDashboardData {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersToday: number;
  activeUsersThisWeek: number;
  totalContacts: number;
  totalCompanies: number;
  totalNotes: number;
  totalGoals: number;
  totalWallets: number;
  totalTransactions: number;
  totalFixedDeposits: number;
  totalLifeEvents: number;
  totalActivities: number;
  authBreakdown: {
    google: number;
    email: number;
    other: number;
  };
  signupTrend: AdminSignupTrendPoint[];
  users: AdminUserRow[];
  featureAdoption: AdminFeatureAdoption[];
  recentSignups: AdminUserRow[];
  recentActivities: AdminActivityItem[];
}

export async function fetchAdminDashboardData(
  idToken: string,
): Promise<AdminDashboardData> {
  const response = await fetch("/api/admin/dashboard", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Failed to load admin dashboard");
  }

  return response.json() as Promise<AdminDashboardData>;
}

export function formatAuthSource(source: AdminAuthSource): string {
  switch (source) {
    case "google":
      return "Google";
    case "email":
      return "Email";
    default:
      return "Unknown";
  }
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";

  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function adoptionPercent(users: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((users / total) * 100)}%`;
}

export function totalUserRecords(data: AdminDashboardData): number {
  return (
    data.totalContacts +
    data.totalCompanies +
    data.totalNotes +
    data.totalGoals +
    data.totalWallets +
    data.totalTransactions
  );
}
