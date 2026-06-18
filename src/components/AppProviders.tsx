"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { PreferencesProvider } from "@/context/PreferencesContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <OnboardingProvider>{children}</OnboardingProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
