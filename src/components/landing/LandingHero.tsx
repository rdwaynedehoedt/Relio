"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { DashboardMockup } from "@/components/landing/LandingMockups";
import { scrollToLandingSection } from "@/lib/landing-scroll";

const easeOut = [0.16, 1, 0.3, 1] as const;

export function LandingHero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-white pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,0,0,0.04),transparent)]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pb-20 pt-16 text-center sm:px-8 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs text-neutral-600">
            ✦ Google Calendar & Contacts sync
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
          className="mt-8 max-w-4xl text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] font-light tracking-[-0.03em] text-[#0a0a0a]"
        >
          Remember everyone
          <br />
          that matters.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.2 }}
          className="mt-6 max-w-[520px] text-base leading-relaxed text-neutral-500 sm:text-lg"
        >
          Relio is your personal OS for relationships, finances, and life goals.
          Sync Google Calendar, import contacts from anywhere, and see today&apos;s
          meetings on your dashboard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href="/auth"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#0a0a0a] px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get started free
          </Link>
          <button
            type="button"
            onClick={() => scrollToLandingSection("integrations")}
            className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 px-6 text-sm font-medium text-[#0a0a0a] transition-all duration-300 hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98]"
          >
            See integrations
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.35 }}
          className="mt-5 text-xs text-neutral-400"
        >
          Free forever · No credit card required
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.4 }}
          className="mt-14 w-full max-w-4xl [perspective:1200px]"
        >
          <div className="[transform:rotateX(2deg)_rotateY(-2deg)]">
            <DashboardMockup />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
