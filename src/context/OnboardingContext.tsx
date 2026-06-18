"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import WelcomeModal from "@/components/onboarding/WelcomeModal";
import OnboardingToast from "@/components/onboarding/OnboardingToast";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import {
  getOnboardingState,
  markPageComplete,
  updateOnboardingState,
} from "@/lib/firestore";
import { DEFAULT_ONBOARDING_STATE } from "@/lib/onboarding-utils";
import type { OnboardingPage, OnboardingState } from "@/lib/types";

interface CompleteWelcomeInput {
  name: string;
  heardFrom: string;
  useCase: string[];
}

interface OnboardingContextValue {
  state: OnboardingState | null;
  loading: boolean;
  markPageDone: (page: OnboardingPage) => Promise<void>;
  dismissChecklist: () => Promise<void>;
  restartWelcomeTour: () => Promise<void>;
  resetPageHints: () => Promise<void>;
  refreshState: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    if (!user) {
      setState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const saved = await getOnboardingState(user.uid);
      setState(saved ?? DEFAULT_ONBOARDING_STATE);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  async function completeWelcome(input: CompleteWelcomeInput) {
    if (!user) return;

    const trimmedName = input.name.trim();

    if (trimmedName && auth?.currentUser) {
      await updateProfile(auth.currentUser, { displayName: trimmedName });
    }

    const nextState: OnboardingState = {
      ...(state ?? DEFAULT_ONBOARDING_STATE),
      welcomeDone: true,
      name: trimmedName || undefined,
      heardFrom: input.heardFrom || undefined,
      useCase: input.useCase.length > 0 ? input.useCase : undefined,
    };

    await updateOnboardingState(user.uid, {
      welcomeDone: true,
      name: trimmedName || undefined,
      heardFrom: input.heardFrom || undefined,
      useCase: input.useCase.length > 0 ? input.useCase : undefined,
    });

    setState(nextState);
    setToast(`Welcome to Relio, ${trimmedName || "there"} 👋`);
    router.push("/dashboard");
  }

  const markPageDone = useCallback(
    async (page: OnboardingPage) => {
      if (!user) return;

      await markPageComplete(user.uid, page);
      setState((current) =>
        current
          ? {
              ...current,
              pagesCompleted: {
                ...current.pagesCompleted,
                [page]: true,
              },
            }
          : current,
      );
    },
    [user],
  );

  const dismissChecklist = useCallback(async () => {
    if (!user) return;

    await updateOnboardingState(user.uid, {
      checklistDismissed: true,
      completed: true,
    });
    setState((current) =>
      current
        ? { ...current, checklistDismissed: true, completed: true }
        : current,
    );
  }, [user]);

  const restartWelcomeTour = useCallback(async () => {
    if (!user) return;

    await updateOnboardingState(user.uid, { welcomeDone: false });
    setState((current) =>
      current ? { ...current, welcomeDone: false } : current,
    );
  }, [user]);

  const resetPageHints = useCallback(async () => {
    if (!user) return;

    const resetPages = DEFAULT_ONBOARDING_STATE.pagesCompleted;
    await updateOnboardingState(user.uid, { pagesCompleted: resetPages });
    setState((current) =>
      current ? { ...current, pagesCompleted: resetPages } : current,
    );
  }, [user]);

  const value = useMemo(
    () => ({
      state,
      loading,
      markPageDone,
      dismissChecklist,
      restartWelcomeTour,
      resetPageHints,
      refreshState: loadState,
    }),
    [
      state,
      loading,
      markPageDone,
      dismissChecklist,
      restartWelcomeTour,
      resetPageHints,
      loadState,
    ],
  );

  const showWelcome = Boolean(user && state && !state.welcomeDone && !loading);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {showWelcome ? (
        <WelcomeModal open onComplete={(input) => void completeWelcome(input)} />
      ) : null}
      <OnboardingToast
        message={toast}
        onDismiss={() => setToast(null)}
      />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
