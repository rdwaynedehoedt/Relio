"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const SIDEBAR_STORAGE_KEY = "relio-sidebar-open";
export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 64;

type Breakpoint = "mobile" | "tablet" | "desktop";

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function readStoredOpen(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // Ignore storage errors.
  }

  return true;
}

function getInitialOpen(width: number): boolean {
  const breakpoint = getBreakpoint(width);
  if (breakpoint === "desktop") return readStoredOpen();
  return false;
}

type SidebarContextValue = {
  isOpen: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isCollapsed: boolean;
  offsetLeft: number;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const [isOpen, setIsOpen] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const syncBreakpoint = () => {
      const width = window.innerWidth;
      const nextBreakpoint = getBreakpoint(width);

      setBreakpoint((current) => {
        if (!initialized) {
          setIsOpen(getInitialOpen(width));
          setInitialized(true);
          return nextBreakpoint;
        }

        if (nextBreakpoint === "mobile" && current !== "mobile") {
          setIsOpen(false);
        }

        return nextBreakpoint;
      });
    };

    syncBreakpoint();
    window.addEventListener("resize", syncBreakpoint);
    return () => window.removeEventListener("resize", syncBreakpoint);
  }, [initialized]);

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";
  const isDesktop = breakpoint === "desktop";
  const isCollapsed = !isMobile && !isOpen;

  const offsetLeft = useMemo(() => {
    if (isMobile) return 0;
    return isOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;
  }, [isMobile, isOpen]);

  const toggle = useCallback(() => {
    setIsOpen((open) => {
      const next = !open;

      if (getBreakpoint(window.innerWidth) === "desktop") {
        try {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        } catch {
          // Ignore storage errors.
        }
      }

      return next;
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      isMobile,
      isTablet,
      isDesktop,
      isCollapsed,
      offsetLeft,
      toggle,
      close,
    }),
    [
      isOpen,
      isMobile,
      isTablet,
      isDesktop,
      isCollapsed,
      offsetLeft,
      toggle,
      close,
    ],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}
