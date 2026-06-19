"use client";

import { cn } from "@/lib/utils";

function SidebarItem({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px]",
        active ? "bg-neutral-100 font-medium text-[#0a0a0a]" : "text-neutral-500",
      )}
    >
      <span className="size-2.5 rounded-sm bg-neutral-300" />
      {label}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200/80 bg-white p-2.5">
      <p className="text-[8px] text-neutral-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#0a0a0a]">{value}</p>
      {sub ? <p className="mt-0.5 text-[8px] text-neutral-400">{sub}</p> : null}
    </div>
  );
}

function ContactRow({
  initials,
  name,
  company,
}: {
  initials: string;
  name: string;
  company: string;
}) {
  return (
    <div className="flex items-center gap-2 border-t border-neutral-100 py-2 first:border-t-0">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[8px] font-medium text-neutral-600">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium text-[#0a0a0a]">{name}</p>
        <p className="truncate text-[8px] text-neutral-400">{company}</p>
      </div>
    </div>
  );
}

export function DashboardMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-neutral-200/80 bg-[#fafafa] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.18)]",
        className,
      )}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-neutral-200/80 bg-white px-3">
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
        <div className="mx-auto h-4 w-32 rounded-md bg-neutral-100" />
      </div>

      <div className="flex min-h-[280px] sm:min-h-[320px]">
        <aside className="hidden w-28 shrink-0 border-r border-neutral-200/80 bg-white p-2 sm:block">
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <span className="size-4 rounded bg-neutral-900" />
            <span className="text-[9px] font-light tracking-[0.2em] uppercase">
              relio
            </span>
          </div>
          <div className="space-y-0.5">
            <SidebarItem label="Dashboard" active />
            <SidebarItem label="Contacts" />
            <SidebarItem label="Calendar" />
            <SidebarItem label="Finance" />
            <SidebarItem label="Brain" />
            <SidebarItem label="Life Map" />
          </div>
        </aside>

        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="rounded-lg border border-neutral-200/60 bg-white p-3">
            <p className="text-xs font-semibold text-[#0a0a0a]">Good morning, Dwayne</p>
            <p className="text-[9px] text-neutral-400">Thursday, 18 June 2026</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatCard label="Contacts" value="148" />
            <StatCard label="Companies" value="190" />
            <StatCard label="Net worth" value="LKR 12.4M" sub="4 wallets" />
            <StatCard label="Goals" value="6 active" sub="2 due soon" />
          </div>

          <div className="mt-3 rounded-lg border border-neutral-200/60 bg-white p-3">
            <p className="text-[9px] font-medium tracking-wide text-neutral-400 uppercase">
              Today&apos;s meetings
            </p>
            <div className="mt-2 space-y-2">
              <div className="rounded-md bg-neutral-50 px-2 py-1.5">
                <p className="text-[8px] text-neutral-400">10:00 – 10:30</p>
                <p className="text-[10px] font-medium text-[#0a0a0a]">
                  Product sync
                </p>
                <p className="text-[8px] text-neutral-500">Sarah Kim · Known contact</p>
              </div>
              <div className="rounded-md bg-neutral-50 px-2 py-1.5">
                <p className="text-[8px] text-neutral-400">2:00 – 2:45</p>
                <p className="text-[10px] font-medium text-[#0a0a0a]">
                  Investor catch-up
                </p>
                <p className="text-[8px] text-neutral-500">James Miller · Known contact</p>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-neutral-200/60 bg-white p-3">
            <p className="text-[9px] font-medium tracking-wide text-neutral-400 uppercase">
              Recent contacts
            </p>
            <ContactRow initials="SK" name="Sarah Kim" company="Acme Corp" />
            <ContactRow initials="JM" name="James Miller" company="Linear" />
            <ContactRow initials="AP" name="Aisha Patel" company="Stripe" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactsMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_16px_48px_-16px_rgba(0,0,0,0.12)]">
      <div className="border-b border-neutral-100 p-4">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
          <span className="size-3 rounded-full bg-neutral-300" />
          <span className="text-xs text-neutral-400">Search 148 contacts...</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["All", "HubSpot", "Google", "LinkedIn"].map((filter, i) => (
            <span
              key={filter}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px]",
                i === 0
                  ? "bg-[#0a0a0a] text-white"
                  : "border border-neutral-200 text-neutral-500",
              )}
            >
              {filter}
            </span>
          ))}
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {[
          { name: "Sarah Kim", meta: "Acme Corp · HubSpot", tag: "Warm" },
          { name: "James Miller", meta: "Linear · Google", tag: "Client" },
          { name: "Aisha Patel", meta: "Stripe · LinkedIn", tag: "Founder" },
          { name: "Tom Nguyen", meta: "Notion · VCF", tag: "Partner" },
        ].map((row) => (
          <div key={row.name} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium">
                {row.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-[#0a0a0a]">{row.name}</p>
                <p className="text-[11px] text-neutral-400">{row.meta}</p>
              </div>
            </div>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
              {row.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinanceMockup() {
  const wallets = [
    { name: "Primary LKR", amount: "LKR 4.2M", color: "bg-emerald-500/10 text-emerald-700" },
    { name: "USD Savings", amount: "$12,400", color: "bg-blue-500/10 text-blue-700" },
    { name: "GBP Wallet", amount: "£8,200", color: "bg-violet-500/10 text-violet-700" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_16px_48px_-16px_rgba(0,0,0,0.12)]">
      <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
        <p className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
          Live exchange rates
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { pair: "USD → LKR", rate: "298.42" },
            { pair: "GBP → LKR", rate: "378.15" },
            { pair: "AED → LKR", rate: "81.24" },
            { pair: "AUD → LKR", rate: "192.08" },
          ].map((item) => (
            <div
              key={item.pair}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5"
            >
              <p className="text-[9px] text-neutral-400">{item.pair}</p>
              <p className="text-xs font-semibold text-[#0a0a0a]">{item.rate}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="rounded-xl bg-[#0a0a0a] p-4 text-white">
          <p className="text-[10px] text-neutral-400">Total net worth</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">LKR 12,438,500</p>
          <p className="mt-1 text-[10px] text-neutral-400">Updated daily · mid-market rates</p>
        </div>
        <div className="grid gap-2">
          {wallets.map((wallet) => (
            <div
              key={wallet.name}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5"
            >
              <div>
                <p className="text-xs font-medium text-[#0a0a0a]">{wallet.name}</p>
                <p className="text-[10px] text-neutral-400">Wallet</p>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", wallet.color)}>
                {wallet.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrainMockup() {
  const notes = [
    { title: "Q3 GTM ideas", color: "bg-amber-50 border-amber-100", h: "h-28" },
    { title: "Article: PLG motion", color: "bg-sky-50 border-sky-100", h: "h-36" },
    { title: "Meeting notes", color: "bg-rose-50 border-rose-100", h: "h-24" },
    { title: "Product roadmap", color: "bg-emerald-50 border-emerald-100", h: "h-32" },
    { title: "Book highlights", color: "bg-violet-50 border-violet-100", h: "h-28" },
    { title: "Weekly reflection", color: "bg-orange-50 border-orange-100", h: "h-24" },
  ];

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-4 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.12)]">
      <div className="columns-2 gap-3 sm:columns-3">
        {notes.map((note) => (
          <div
            key={note.title}
            className={cn(
              "mb-3 break-inside-avoid rounded-xl border p-3",
              note.color,
              note.h,
            )}
          >
            <p className="text-xs font-medium text-[#0a0a0a]">{note.title}</p>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-black/5" />
              <div className="h-1.5 w-4/5 rounded bg-black/5" />
              <div className="h-1.5 w-3/5 rounded bg-black/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarMockup() {
  const days = ["Mon 16", "Tue 17", "Wed 18", "Thu 19", "Fri 20"];
  const events = [
    { day: 2, time: "10:00", title: "Product sync", color: "bg-blue-500/15 border-blue-200" },
    { day: 2, time: "14:00", title: "Investor call", color: "bg-violet-500/15 border-violet-200" },
    { day: 3, time: "09:30", title: "Team standup", color: "bg-emerald-500/15 border-emerald-200" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_16px_48px_-16px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[#0a0a0a]">Calendar</p>
          <p className="text-[10px] text-neutral-400">Google Calendar · Week view</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          Connected
        </span>
      </div>
      <div className="grid grid-cols-5 gap-px bg-neutral-100 p-px">
        {days.map((day, index) => (
          <div key={day} className="bg-white p-2">
            <p
              className={cn(
                "text-center text-[9px] font-medium",
                index === 2 ? "text-[#0a0a0a]" : "text-neutral-400",
              )}
            >
              {day}
            </p>
            <div className="mt-2 min-h-[100px] space-y-1">
              {events
                .filter((event) => event.day === index)
                .map((event) => (
                  <div
                    key={event.title}
                    className={cn(
                      "rounded border px-1.5 py-1",
                      event.color,
                    )}
                  >
                    <p className="text-[8px] text-neutral-500">{event.time}</p>
                    <p className="text-[9px] font-medium text-[#0a0a0a]">
                      {event.title}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IntegrationsMockup() {
  const rows = [
    {
      name: "Google",
      detail: "Contacts + Calendar",
      status: "Connected",
      badges: ["Contacts", "Calendar"],
    },
    {
      name: "HubSpot",
      detail: "Private app token",
      status: "Connected",
      badges: ["Sync"],
    },
    {
      name: "LinkedIn",
      detail: "CSV import",
      status: "Ready",
      badges: ["Import"],
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_16px_48px_-16px_rgba(0,0,0,0.12)]">
      <div className="border-b border-neutral-100 px-4 py-3">
        <p className="text-sm font-medium text-[#0a0a0a]">Integrations</p>
        <p className="text-[10px] text-neutral-400">
          Connect once · Sync anytime · Test connection
        </p>
      </div>
      <div className="divide-y divide-neutral-100">
        {rows.map((row) => (
          <div key={row.name} className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-[#0a0a0a]">{row.name}</p>
              <p className="text-[10px] text-neutral-400">{row.detail}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {row.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] text-neutral-600"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-700">
              {row.status}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2.5">
        <p className="text-[9px] text-neutral-500">
          One-time Google Cloud setup · Guided steps if anything is missing
        </p>
      </div>
    </div>
  );
}

export function LifeMapMockup() {
  const milestones = [
    { label: "Emergency fund", year: "2025", done: true },
    { label: "Buy apartment", year: "2027", done: false },
    { label: "Sabbatical year", year: "2029", done: false },
    { label: "Retire early", year: "2035", done: false },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-6 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.12)]">
      <div className="relative">
        <div className="absolute top-5 right-0 left-0 h-px bg-neutral-200" />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {milestones.map((item) => (
            <div key={item.label} className="relative pt-8 text-center">
              <div
                className={cn(
                  "absolute top-3 left-1/2 size-4 -translate-x-1/2 rounded-full border-2 bg-white",
                  item.done
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-neutral-300",
                )}
              />
              <p className="text-[10px] font-medium text-neutral-400">{item.year}</p>
              <p className="mt-1 text-xs font-medium text-[#0a0a0a]">{item.label}</p>
              <p className="mt-1 text-[10px] text-neutral-400">
                {item.done ? "Complete" : "On track"}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-lg bg-neutral-50 p-3">
        <p className="text-[10px] text-neutral-400 uppercase tracking-wide">
          Savings projection
        </p>
        <div className="mt-2 flex items-end gap-1.5">
          {[40, 55, 48, 62, 70, 78, 85, 92].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-[#0a0a0a]/80"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
