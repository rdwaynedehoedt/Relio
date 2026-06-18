"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RelioLogo from "@/components/RelioLogo";
import { cn } from "@/lib/utils";

const crmItems = [
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navLinkClass = (isActive: boolean) =>
  cn(
    "flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
      : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
  );

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const crmIsActive = crmItems.some((item) => isActivePath(pathname, item.href));
  const [crmOpen, setCrmOpen] = useState(crmIsActive);

  useEffect(() => {
    if (crmIsActive) setCrmOpen(true);
  }, [crmIsActive]);

  const displayName = user?.displayName ?? "User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-20 items-center gap-4 px-7">
        <RelioLogo className="size-10" />
        <div>
          <span className="block text-base font-semibold tracking-tight text-sidebar-foreground">
            Relio
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            CRM workspace
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        <p className="mb-3 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Menu
        </p>

        <Link
          href="/dashboard"
          className={navLinkClass(isActivePath(pathname, "/dashboard"))}
        >
          <LayoutDashboard className="size-[18px] shrink-0" />
          Dashboard
        </Link>

        <Link
          href="/finance"
          className={navLinkClass(isActivePath(pathname, "/finance"))}
        >
          <Wallet className="size-[18px] shrink-0" />
          Finance
        </Link>

        <NavGroup
          label="CRM"
          isOpen={crmOpen}
          isActive={crmIsActive}
          onToggle={() => setCrmOpen((open) => !open)}
        >
          {crmItems.map(({ href, label, icon: Icon }) => {
            const isActive = isActivePath(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg py-2.5 pr-3 pl-3 text-[15px] font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </NavGroup>
      </nav>

      <div className="px-4 pb-2">
        <Link
          href="/settings"
          className={navLinkClass(isActivePath(pathname, "/settings"))}
        >
          <Settings className="size-[18px] shrink-0" />
          Settings
        </Link>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left outline-none transition-colors hover:bg-sidebar-accent/70">
            <Avatar size="sm">
              <AvatarImage src={user?.photoURL ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs leading-relaxed text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-60">
            <DropdownMenuItem onClick={() => signOut()} className="gap-2.5">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  isOpen,
  isActive,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition-colors",
          isActive || isOpen
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
        )}
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            isActive || isOpen ? "bg-sidebar-foreground" : "bg-muted-foreground",
          )}
        />
        <span className="flex-1">{label}</span>
        <ChevronRight
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            isOpen ? "rotate-90" : "",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-5 space-y-1 border-l border-sidebar-border py-1.5 pl-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
