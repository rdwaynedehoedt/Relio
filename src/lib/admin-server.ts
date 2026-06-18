import type { UserRecord } from "firebase-admin/auth";
import { ADMIN_EMAIL } from "@/lib/admin-constants";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import type {
  AdminActivityItem,
  AdminAuthSource,
  AdminDashboardData,
  AdminFeatureAdoption,
  AdminUserRow,
} from "@/lib/admin-utils";
import { getUserFirstName } from "@/lib/user-utils";

const COLLECTIONS = [
  "contacts",
  "companies",
  "wallets",
  "transactions",
  "fixedDeposits",
  "notes",
  "goals",
  "lifeEvents",
  "activities",
] as const;

function getAuthSource(user: UserRecord): AdminAuthSource {
  const providers = user.providerData.map((provider) => provider.providerId);
  if (providers.includes("google.com")) return "google";
  if (providers.includes("password")) return "email";
  return "unknown";
}

function isoFromAuthDate(value: string | undefined): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function startOfDayIso(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

async function listAllAuthUsers(): Promise<UserRecord[]> {
  const auth = getAdminAuth();
  const users: UserRecord[] = [];
  let pageToken: string | undefined;

  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  return users;
}

function increment(map: Map<string, number>, userId: string) {
  map.set(userId, (map.get(userId) ?? 0) + 1);
}

function maxIso(current: string | null, candidate: string | undefined | null) {
  if (!candidate) return current;
  if (!current) return candidate;
  return candidate.localeCompare(current) > 0 ? candidate : current;
}

export async function verifyAdminIdToken(idToken: string) {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  if (decoded.email !== ADMIN_EMAIL) {
    throw new Error("Forbidden");
  }
  return decoded;
}

export async function buildAdminDashboardData(
  adminUserId: string,
): Promise<AdminDashboardData> {
  const firestore = getAdminFirestore();
  const weekAgo = daysAgoIso(7);
  const todayStart = startOfDayIso(new Date());

  const [authUsers, ...collectionSnapshots] = await Promise.all([
    listAllAuthUsers(),
    ...COLLECTIONS.map((name) => firestore.collection(name).get()),
  ]);

  const [
    contactsSnap,
    companiesSnap,
    walletsSnap,
    transactionsSnap,
    fixedDepositsSnap,
    notesSnap,
    goalsSnap,
    lifeEventsSnap,
    activitiesSnap,
  ] = collectionSnapshots;

  const contactCounts = new Map<string, number>();
  const companyCounts = new Map<string, number>();
  const walletCounts = new Map<string, number>();
  const transactionCounts = new Map<string, number>();
  const noteCounts = new Map<string, number>();
  const goalCounts = new Map<string, number>();
  const lifeEventCounts = new Map<string, number>();
  const lastActiveByUser = new Map<string, string>();

  contactsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as { userId?: string; createdAt?: string };
    if (!data.userId) return;
    increment(contactCounts, data.userId);
  });

  companiesSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as { userId?: string };
    if (!data.userId) return;
    increment(companyCounts, data.userId);
  });

  walletsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as { userId?: string };
    if (!data.userId) return;
    increment(walletCounts, data.userId);
  });

  transactionsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as { userId?: string };
    if (!data.userId) return;
    increment(transactionCounts, data.userId);
  });

  notesSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as { userId?: string };
    if (!data.userId) return;
    increment(noteCounts, data.userId);
  });

  goalsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as { userId?: string };
    if (!data.userId) return;
    increment(goalCounts, data.userId);
  });

  lifeEventsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as { userId?: string };
    if (!data.userId) return;
    increment(lifeEventCounts, data.userId);
  });

  const activities = activitiesSnap.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as {
        userId: string;
        description: string;
        createdAt?: string;
      }),
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  activities.forEach((activity) => {
    lastActiveByUser.set(
      activity.userId,
      maxIso(lastActiveByUser.get(activity.userId) ?? null, activity.createdAt) ??
        activity.createdAt ??
        "",
    );
  });

  const integrationResults = await Promise.all(
    authUsers.map(async (authUser) => {
      const [hubspotDoc, googleDoc] = await Promise.all([
        firestore.doc(`users/${authUser.uid}/integrations/hubspot`).get(),
        firestore.doc(`users/${authUser.uid}/integrations/google`).get(),
      ]);

      const hubspot = hubspotDoc.data() as { token?: string } | undefined;
      const google = googleDoc.data() as { accessToken?: string } | undefined;

      return {
        userId: authUser.uid,
        hasHubSpot: Boolean(hubspot?.token),
        hasGoogle: Boolean(google?.accessToken),
      };
    }),
  );

  const integrationMap = new Map(
    integrationResults.map((result) => [result.userId, result]),
  );

  const users: AdminUserRow[] = authUsers.map((authUser) => {
    const integrations = integrationMap.get(authUser.uid);
    const signedUpAt = isoFromAuthDate(authUser.metadata.creationTime);
    const lastLoginAt = isoFromAuthDate(authUser.metadata.lastSignInTime);

    return {
      userId: authUser.uid,
      email: authUser.email ?? null,
      displayName: authUser.displayName ?? null,
      photoURL: authUser.photoURL ?? null,
      signedUpAt,
      lastActiveAt:
        maxIso(lastActiveByUser.get(authUser.uid) ?? null, lastLoginAt) ??
        lastLoginAt,
      contactsCount: contactCounts.get(authUser.uid) ?? 0,
      companiesCount: companyCounts.get(authUser.uid) ?? 0,
      notesCount: noteCounts.get(authUser.uid) ?? 0,
      goalsCount: goalCounts.get(authUser.uid) ?? 0,
      walletsCount: walletCounts.get(authUser.uid) ?? 0,
      transactionsCount: transactionCounts.get(authUser.uid) ?? 0,
      lifeEventsCount: lifeEventCounts.get(authUser.uid) ?? 0,
      source: getAuthSource(authUser),
      hasHubSpot: integrations?.hasHubSpot ?? false,
      hasGoogle: integrations?.hasGoogle ?? false,
      disabled: authUser.disabled,
    };
  });

  users.sort((a, b) => (b.signedUpAt ?? "").localeCompare(a.signedUpAt ?? ""));

  const totalUsers = users.length;
  const newUsersThisWeek = users.filter(
    (user) => (user.signedUpAt ?? "") >= weekAgo,
  ).length;
  const newUsersToday = users.filter(
    (user) => (user.signedUpAt ?? "") >= todayStart,
  ).length;
  const activeUsersThisWeek = new Set(
    activities
      .filter((activity) => (activity.createdAt ?? "") >= weekAgo)
      .map((activity) => activity.userId),
  ).size;

  const authBreakdown = {
    google: users.filter((user) => user.source === "google").length,
    email: users.filter((user) => user.source === "email").length,
    other: users.filter((user) => user.source === "unknown").length,
  };

  const featureAdoption: AdminFeatureAdoption[] = [
    {
      label: "CRM · contacts",
      users: users.filter((user) => user.contactsCount > 0).length,
      total: totalUsers,
    },
    {
      label: "CRM · companies",
      users: users.filter((user) => user.companiesCount > 0).length,
      total: totalUsers,
    },
    {
      label: "Finance · wallets",
      users: users.filter((user) => user.walletsCount > 0).length,
      total: totalUsers,
    },
    {
      label: "Second Brain",
      users: users.filter((user) => user.notesCount > 0).length,
      total: totalUsers,
    },
    {
      label: "Life Map · goals",
      users: users.filter((user) => user.goalsCount > 0).length,
      total: totalUsers,
    },
    {
      label: "HubSpot sync",
      users: users.filter((user) => user.hasHubSpot).length,
      total: totalUsers,
    },
    {
      label: "Google Contacts",
      users: users.filter((user) => user.hasGoogle).length,
      total: totalUsers,
    },
  ];

  const signupTrend = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const dayStart = startOfDayIso(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayEnd = startOfDayIso(nextDay);

    const count = users.filter((user) => {
      const signedUp = user.signedUpAt ?? "";
      return signedUp >= dayStart && signedUp < dayEnd;
    }).length;

    return {
      date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    };
  });

  const authUserMap = new Map(users.map((user) => [user.userId, user]));

  const recentActivities: AdminActivityItem[] = activities.slice(0, 20).map((activity) => {
    const row = authUserMap.get(activity.userId);
    const isAdminUser = activity.userId === adminUserId;
    const fullName =
      row?.displayName?.trim() ||
      getUserFirstName(null, row?.email) ||
      "Someone";
    const userLabel = isAdminUser
      ? fullName
      : getUserFirstName(row?.displayName, row?.email);

    return {
      id: activity.id,
      userId: activity.userId,
      userLabel,
      description: activity.description,
      createdAt: activity.createdAt ?? "",
    };
  });

  return {
    totalUsers,
    newUsersThisWeek,
    newUsersToday,
    activeUsersThisWeek,
    totalContacts: contactsSnap.size,
    totalCompanies: companiesSnap.size,
    totalNotes: notesSnap.size,
    totalGoals: goalsSnap.size,
    totalWallets: walletsSnap.size,
    totalTransactions: transactionsSnap.size,
    totalFixedDeposits: fixedDepositsSnap.size,
    totalLifeEvents: lifeEventsSnap.size,
    totalActivities: activitiesSnap.size,
    authBreakdown,
    signupTrend,
    users,
    featureAdoption,
    recentSignups: users.slice(0, 10),
    recentActivities,
  };
}
