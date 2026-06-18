"use client";

import Link from "next/link";
import { motion } from "motion/react";

const easeOut = [0.16, 1, 0.3, 1] as const;

export function LandingCTA() {
  return (
    <section className="bg-[#0a0a0a] py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="mx-auto max-w-3xl px-5 text-center sm:px-8"
      >
        <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Start building your personal OS.
        </h2>
        <p className="mt-4 text-base text-neutral-400">
          Free forever. No credit card required.
        </p>
        <Link
          href="/auth"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
        >
          Get started free
        </Link>
      </motion.div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200/80 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center sm:px-8">
        <div>
          <p className="text-sm font-light tracking-[0.28em] text-[#0a0a0a] uppercase">
            relio
          </p>
          <p className="mt-1 text-xs text-neutral-400">© 2026 Relio</p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
          <a href="#" className="transition-colors hover:text-[#0a0a0a]">
            Privacy
          </a>
          <span aria-hidden>·</span>
          <a href="#" className="transition-colors hover:text-[#0a0a0a]">
            Terms
          </a>
          <span aria-hidden>·</span>
          <a
            href="https://github.com"
            className="transition-colors hover:text-[#0a0a0a]"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
