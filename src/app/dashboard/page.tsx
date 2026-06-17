"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Building2, Download, Users } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { getCompanies, getContacts } from "@/lib/firestore";
import type { Contact } from "@/lib/types";

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function getFirstName(displayName?: string | null) {
  if (!displayName) return "there";
  return displayName.split(" ")[0];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    async function loadDashboardData() {
      try {
        const [userContacts, userCompanies] = await Promise.all([
          getContacts(userId),
          getCompanies(userId),
        ]);

        setContacts(userContacts);
        setCompanyCount(userCompanies.length);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoadingData(false);
      }
    }

    loadDashboardData();
  }, [user]);

  const hubspotCount = contacts.filter(
    (contact) => contact.source === "hubspot",
  ).length;
  const recentContacts = contacts.slice(0, 5);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="pl-72">
          <div className="mx-auto max-w-7xl px-10 py-12">
            <div className="mb-12">
              <p className="text-sm font-medium text-muted-foreground">
                Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                Good morning, {getFirstName(user?.displayName)}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Here&apos;s what&apos;s happening across your workspace today.
              </p>
            </div>

            <div className="mb-12 grid gap-6 sm:grid-cols-3">
              <StatCard
                label="Total Contacts"
                value={loadingData ? "—" : contacts.length}
                icon={Users}
              />
              <StatCard
                label="Total Companies"
                value={loadingData ? "—" : companyCount}
                icon={Building2}
              />
              <StatCard
                label="HubSpot Contacts"
                value={loadingData ? "—" : hubspotCount}
                icon={Download}
              />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-8 py-6">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Recent contacts
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Last 5 contacts added to your workspace
                </p>
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center px-8 py-24">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
                </div>
              ) : recentContacts.length === 0 ? (
                <div className="flex flex-col items-center px-8 py-24 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                    <Users className="size-6 text-muted-foreground" />
                  </div>
                  <p className="mt-5 text-base font-medium text-foreground">
                    No contacts yet
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Add your first contact or import from HubSpot to see them
                    here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recentContacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex items-center gap-5 px-8 py-5 transition-colors hover:bg-muted/50"
                    >
                      <Avatar className="size-11">
                        <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-foreground">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {[contact.companyName, contact.role]
                            .filter(Boolean)
                            .join(" · ") || "No company"}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm text-muted-foreground">
                        {contact.createdAt
                          ? formatDistanceToNow(new Date(contact.createdAt), {
                              addSuffix: true,
                            })
                          : "Recently"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-[18px] text-muted-foreground" />
        </div>
      </div>
      <p className="mt-5 text-4xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
