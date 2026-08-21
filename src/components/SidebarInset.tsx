"use client";

import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

type SidebarInsetProps = {
  children: ReactNode;
  className?: string;
  mode?: "padding" | "fixed";
  as?: "main" | "div";
};

export default function SidebarInset({
  children,
  className,
  mode = "padding",
  as: Component = "main",
}: SidebarInsetProps) {
  const { isMobile, toggle, offsetLeft } = useSidebar();

  return (
    <>
      {isMobile ? (
        <button
          type="button"
          onClick={toggle}
          aria-label="Open navigation menu"
          className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg transition-colors hover:bg-muted"
        >
          <Menu className="size-6" />
        </button>
      ) : null}

      <Component
        className={cn(
          "transition-[left,padding-left] duration-200 ease-out",
          className,
        )}
        style={
          mode === "fixed"
            ? { left: offsetLeft }
            : { paddingLeft: offsetLeft }
        }
      >
        {children}
      </Component>
    </>
  );
}
