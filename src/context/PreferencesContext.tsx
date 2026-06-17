"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserPreferences, saveUserPreferences } from "@/lib/firestore";
import type { ThemeMode, UserPreferences } from "@/lib/types";
import { applyTheme, getStoredTheme } from "@/lib/theme";

const defaultPreferences: UserPreferences = {
  theme: "system",
  defaultCountry: "",
};

interface PreferencesContextValue {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPreferences(defaultPreferences);
      applyTheme(getStoredTheme());
      setLoading(false);
      return;
    }

    const userId = user.uid;

    async function loadPreferences() {
      try {
        const stored = await getUserPreferences(userId);
        const next = stored ?? {
          ...defaultPreferences,
          theme: getStoredTheme(),
        };
        setPreferences(next);
        applyTheme(next.theme);
      } catch (error) {
        console.error("Failed to load preferences:", error);
        const fallbackTheme = getStoredTheme();
        applyTheme(fallbackTheme);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  useEffect(() => {
    if (preferences.theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preferences.theme]);

  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>) => {
      if (!user) return;

      const next = { ...preferences, ...prefs };
      setPreferences(next);

      if (prefs.theme !== undefined) {
        applyTheme(next.theme);
      }

      await saveUserPreferences(user.uid, next);
    },
    [preferences, user],
  );

  const setTheme = useCallback(
    async (theme: ThemeMode) => {
      applyTheme(theme);

      setPreferences((current) => {
        const next = { ...current, theme };

        if (user) {
          void saveUserPreferences(user.uid, next);
        }

        return next;
      });
    },
    [user],
  );

  return (
    <PreferencesContext.Provider
      value={{ preferences, loading, updatePreferences, setTheme }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }

  return context;
}
