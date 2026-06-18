"use client";

import { motion } from "motion/react";
import { Brain, Map, Users, Wallet, type LucideIcon } from "lucide-react";
import {
  BrainMockup,
  ContactsMockup,
  FinanceMockup,
  LifeMapMockup,
} from "@/components/landing/LandingMockups";

const easeOut = [0.16, 1, 0.3, 1] as const;

type Feature = {
  icon: LucideIcon;
  headline: string;
  body: string;
  visual: React.ReactNode;
  reverse?: boolean;
};

const features: Feature[] = [
  {
    icon: Users,
    headline: "Know everyone. Lose no one.",
    body: "148 contacts, 190 companies — all searchable, filterable, and linked. Import from HubSpot, Google, LinkedIn or your phone in one click.",
    visual: <ContactsMockup />,
  },
  {
    icon: Wallet,
    headline: "Your money, across every currency.",
    body: "Track wallets in LKR, USD, GBP, AED and AUD. Live exchange rates. Fixed deposits. Your real net worth, always up to date.",
    visual: <FinanceMockup />,
    reverse: true,
  },
  {
    icon: Brain,
    headline: "Capture every idea that matters.",
    body: "Rich text notes, article saves with auto-preview, mood tags, and a masonry grid that makes your thinking feel organized.",
    visual: <BrainMockup />,
  },
  {
    icon: Map,
    headline: "Plot your life on a timeline.",
    body: "From buying a house to traveling the world — set goals, track milestones, and see exactly when you'll get there based on your real savings.",
    visual: <LifeMapMockup />,
    reverse: true,
  },
];

function FeatureBlock({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: easeOut, delay: index * 0.05 }}
      className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
        feature.reverse ? "lg:[&>div:first-child]:order-2" : ""
      }`}
    >
      <div>{feature.visual}</div>
      <div>
        <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
          <Icon className="size-5 text-[#0a0a0a]" strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-medium tracking-tight text-[#0a0a0a] sm:text-3xl">
          {feature.headline}
        </h3>
        <p className="mt-4 text-base leading-relaxed text-neutral-500">{feature.body}</p>
      </div>
    </motion.div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-medium tracking-tight text-[#0a0a0a] sm:text-4xl">
            Everything in one place
          </h2>
          <p className="mt-4 text-base text-neutral-500 sm:text-lg">
            Built for growth leads, founders, and operators who hate switching tabs.
          </p>
        </motion.div>

        <div className="mt-20 space-y-24 sm:space-y-32">
          {features.map((feature, index) => (
            <FeatureBlock key={feature.headline} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
