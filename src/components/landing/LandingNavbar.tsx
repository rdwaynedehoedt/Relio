"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  LANDING_SECTION_IDS,
  scrollToLandingSection,
  type LandingSectionId,
} from "@/lib/landing-scroll";
import { cn } from "@/lib/utils";

const navItems: { id: LandingSectionId; label: string }[] = [
  { id: "features", label: "Features" },
  { id: "integrations", label: "Integrations" },
];

function NavSectionLink({
  id,
  label,
  active,
  onNavigate,
  className,
}: {
  id: LandingSectionId;
  label: string;
  active: boolean;
  onNavigate: (id: LandingSectionId) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "text-sm transition-colors duration-200",
        active
          ? "font-medium text-[#0a0a0a]"
          : "text-neutral-600 hover:text-[#0a0a0a]",
        className,
      )}
    >
      {label}
    </button>
  );
}

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<LandingSectionId | null>(
    null,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const sections = LANDING_SECTION_IDS.map((id) =>
      document.getElementById(id),
    ).filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id as LandingSectionId);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.35, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const navigateToSection = useCallback((sectionId: LandingSectionId) => {
    setMobileOpen(false);
    scrollToLandingSection(sectionId);
    setActiveSection(sectionId);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-white transition-shadow duration-300",
        scrolled && "border-b border-neutral-200/80 shadow-[0_1px_0_rgba(0,0,0,0.03)]",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/home"
          className="text-lg font-light tracking-[0.28em] text-[#0a0a0a] uppercase"
        >
          relio
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavSectionLink
              key={item.id}
              id={item.id}
              label={item.label}
              active={activeSection === item.id}
              onNavigate={navigateToSection}
            />
          ))}
          <Link
            href="/auth"
            className="text-sm text-neutral-600 transition-colors hover:text-[#0a0a0a]"
          >
            Sign in
          </Link>
          <Link
            href="/auth"
            className="inline-flex h-9 items-center rounded-full bg-[#0a0a0a] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get started free
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-[#0a0a0a] md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-neutral-200/80 bg-white px-5 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <NavSectionLink
                key={item.id}
                id={item.id}
                label={item.label}
                active={activeSection === item.id}
                onNavigate={navigateToSection}
                className="text-left text-base"
              />
            ))}
            <Link
              href="/auth"
              className="text-base text-neutral-600"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#0a0a0a] px-5 text-sm font-medium text-white"
              onClick={() => setMobileOpen(false)}
            >
              Get started free
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
