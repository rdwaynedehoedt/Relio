"use client";

import { motion } from "motion/react";

const easeOut = [0.16, 1, 0.3, 1] as const;

function HubSpotLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.16 7.93V5.08a2.62 2.62 0 0 0 1.52-2.37A2.62 2.62 0 0 0 17.06.1a2.62 2.62 0 0 0-2.62 2.62c0 .32.06.63.17.92H12.1a5.9 5.9 0 0 0-4.2 1.74L5.1 4.8a3.28 3.28 0 0 0-4.6 0 3.28 3.28 0 0 0 0 4.6l2.8 2.8a5.9 5.9 0 0 0-.17 1.42 5.93 5.93 0 1 0 5.93-5.93c0-.17-.01-.34-.03-.5l2.8-2.8a3.27 3.27 0 0 0 2.36-.96zm-8.3 8.3a3.28 3.28 0 1 1 0-6.56 3.28 3.28 0 0 1 0 6.56z"
      />
    </svg>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.062 2.062 0 1 1 4.124 0 2.062 2.062 0 0 1-2.061 2.065zm1.782 13.019H3.555V9h3.564v11.452z"
      />
    </svg>
  );
}

function IPhoneLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M17 1H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm-5 20a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5-4H7V4h10v13z"
      />
    </svg>
  );
}

const integrations = [
  { name: "HubSpot", Logo: HubSpotLogo, color: "hover:text-[#ff7a59]" },
  { name: "Google", Logo: GoogleLogo, color: "hover:opacity-100" },
  { name: "LinkedIn", Logo: LinkedInLogo, color: "hover:text-[#0a66c2]" },
  { name: "iPhone", Logo: IPhoneLogo, color: "hover:text-[#0a0a0a]" },
];

export function LandingIntegrations() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="text-2xl font-medium tracking-tight text-[#0a0a0a] sm:text-3xl"
        >
          Connects to the tools you already use
        </motion.h2>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-10 sm:gap-14">
          {integrations.map((item, index) => {
            const Logo = item.Logo;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.5,
                  ease: easeOut,
                  delay: index * 0.08,
                }}
                className={`group flex flex-col items-center gap-2 text-neutral-400 transition-colors ${item.color}`}
              >
                <Logo className="size-8 opacity-60 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0 sm:size-10" />
                <span className="text-xs text-neutral-400">{item.name}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
