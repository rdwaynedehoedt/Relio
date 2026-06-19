"use client";

import { motion } from "motion/react";
import {
  Calendar,
  CalendarDays,
  Moon,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Upload,
  type LucideIcon,
} from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

type BentoItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const items: BentoItem[] = [
  {
    icon: CalendarDays,
    title: "Today's meetings",
    description: "On your dashboard every morning",
  },
  {
    icon: Calendar,
    title: "Google Calendar sync",
    description: "Week view with contact matching",
  },
  {
    icon: Upload,
    title: "Google Contacts",
    description: "One-click import",
  },
  {
    icon: RefreshCw,
    title: "HubSpot sync",
    description: "Contacts & companies",
  },
  {
    icon: ShieldCheck,
    title: "Test connection",
    description: "Guided setup if APIs need enabling",
  },
  {
    icon: Smartphone,
    title: "Mobile ready",
    description: "Installable PWA",
  },
  {
    icon: Moon,
    title: "Dark & light mode",
    description: "Follows your system",
  },
];

export function LandingBento() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-2xl font-medium tracking-tight text-[#0a0a0a] sm:text-3xl">
            Built for how you actually work
          </h2>
          <p className="mt-3 text-base text-neutral-500">
            Calendar on the dashboard. Integrations in Settings. Sync when you
            want, disconnect when you don&apos;t.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.5,
                  ease: easeOut,
                  delay: index * 0.06,
                }}
                className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition-colors hover:border-neutral-300 sm:p-6"
              >
                <Icon className="size-5 text-[#0a0a0a]" strokeWidth={1.5} />
                <h3 className="mt-4 text-sm font-medium text-[#0a0a0a] sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
