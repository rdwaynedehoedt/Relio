"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  ChevronRight,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Map,
  PanelLeftClose,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  useSidebar,
} from "@/hooks/useSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import RelioLogo from "@/components/RelioLogo";
import { cn } from "@/lib/utils";

const crmItems = [
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
];

const primaryNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/brain", label: "Second Brain", icon: Lightbulb },
  { href: "/lifemap", label: "Life Map", icon: Map },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(isActive: boolean, collapsed: boolean) {
  return cn(
    "flex items-center rounded-lg font-medium transition-colors",
    collapsed
      ? "mx-auto size-10 justify-center p-0"
      : "w-full gap-3 px-3 py-2.5 text-[15px]",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
  );
}

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={navLinkClass(isActive, collapsed)}
    >
      <Icon className="size-[18px] shrink-0" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip content={label} side="right" className="flex w-full justify-center">
      {link}
    </Tooltip>
  );
}

function SidebarShell() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isOpen, isMobile, isCollapsed, toggle, close } = useSidebar();

  const crmIsActive = crmItems.some((item) => isActivePath(pathname, item.href));
  const handleNavigate = () => {
    if (isMobile) close();
  };
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

  const sidebarWidth = isMobile
    ? SIDEBAR_WIDTH_EXPANDED
    : isOpen
      ? SIDEBAR_WIDTH_EXPANDED
      : SIDEBAR_WIDTH_COLLAPSED;

  const railPadding = isCollapsed ? "px-3" : "px-4";

  return (
    <>
      {isMobile && isOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
          onClick={close}
        />
      ) : null}

      <aside
        style={{ width: sidebarWidth }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-out",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-sidebar-border/60",
            isCollapsed ? "h-14 justify-center" : "h-16 gap-3 px-4",
          )}
        >
          <RelioLogo className={cn("shrink-0", isCollapsed ? "size-8" : "size-9")} />
          {!isCollapsed ? (
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold tracking-tight text-sidebar-foreground">
                Relio
              </span>
              <span className="block text-[11px] text-muted-foreground">
                CRM workspace
              </span>
            </div>
          ) : null}
        </div>

        <nav
          className={cn(
            "flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-3",
            railPadding,
          )}
        >
          {!isCollapsed ? (
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Menu
            </p>
          ) : null}

          {primaryNavItems.map((item) => (
            <SidebarNavLink
              key={item.href}
              {...item}
              isActive={isActivePath(pathname, item.href)}
              collapsed={isCollapsed}
              onNavigate={handleNavigate}
            />
          ))}

          {isCollapsed ? (
            crmItems.map((item) => (
              <SidebarNavLink
                key={item.href}
                {...item}
                isActive={isActivePath(pathname, item.href)}
                collapsed
                onNavigate={handleNavigate}
              />
            ))
          ) : (
            <NavGroup
              label="CRM"
              icon={Briefcase}
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
                    onClick={handleNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg py-2 pr-3 pl-3 text-[15px] font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </NavGroup>
          )}

        </nav>

        <div className={cn("mt-auto shrink-0 space-y-1 pb-2", railPadding)}>
          <SidebarNavLink
            href="/settings"
            label="Settings"
            icon={Settings}
            isActive={isActivePath(pathname, "/settings")}
            collapsed={isCollapsed}
            onNavigate={handleNavigate}
          />
        </div>

        {!isMobile ? (
          <div className={cn("shrink-0 pb-2", railPadding)}>
            <Tooltip
              content={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              side="right"
              className={cn("flex", isCollapsed ? "justify-center" : "w-full")}
            >
              <button
                type="button"
                onClick={toggle}
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                className={cn(
                  "flex items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  isCollapsed
                    ? "size-10 justify-center"
                    : "w-full gap-2 px-3 py-2 text-sm",
                )}
              >
                {isOpen ? (
                  <PanelLeftClose className="size-4 shrink-0" />
                ) : (
                  <ChevronRight className="size-4 shrink-0" />
                )}
                {!isCollapsed ? (
                  <span className="font-medium">Collapse</span>
                ) : null}
              </button>
            </Tooltip>
          </div>
        ) : null}

        <div className={cn("shrink-0 border-t border-sidebar-border", railPadding, "py-3")}>
          {isCollapsed ? (
            <Tooltip content={displayName} side="right" className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex size-10 items-center justify-center rounded-lg outline-none transition-colors hover:bg-sidebar-accent/70">
                  <Avatar size="sm">
                    <AvatarImage
                      src={user?.photoURL ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" className="w-60">
                  <DropdownMenuItem onClick={() => signOut()} className="gap-2.5">
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Tooltip>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-sidebar-accent/70">
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
          )}
        </div>
      </aside>
    </>
  );
}

export default function Sidebar() {
  return <SidebarShell />;
}

function NavGroup({
  label,
  icon: Icon,
  isOpen,
  isActive,
  onToggle,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium transition-colors",
          isActive || isOpen
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
        )}
      >
        <Icon className="size-[18px] shrink-0" />
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
          <div className="ml-4 space-y-1 border-l border-sidebar-border py-1 pl-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
