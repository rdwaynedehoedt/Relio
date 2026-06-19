import type { Metadata } from "next";
import { LandingBento } from "@/components/landing/LandingBento";
import { LandingCTA, LandingFooter } from "@/components/landing/LandingCTA";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingIntegrations } from "@/components/landing/LandingIntegrations";
import { LandingNavbar } from "@/components/landing/LandingNavbar";

export const metadata: Metadata = {
  title: "Relio Your personal OS for relationships, finances, and life",
  description:
    "Remember everyone that matters. Sync Google Contacts & Calendar, import from HubSpot and LinkedIn, and manage relationships, finances, and life goals in one place.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingBento />
        <LandingIntegrations />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
