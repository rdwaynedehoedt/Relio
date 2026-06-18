"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/home"
          className="text-lg font-light tracking-[0.28em] text-[#0a0a0a] uppercase"
        >
          relio
        </Link>
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-[#0a0a0a]"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.5} />
          Back
        </Link>
      </div>
    </header>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white text-[#0a0a0a]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,0,0,0.04),transparent)]"
      />
      <AuthNavbar />
      <div className="relative flex min-h-screen items-center justify-center px-5 pb-12 pt-24 sm:px-8">
        {children}
      </div>
    </div>
  );
}
