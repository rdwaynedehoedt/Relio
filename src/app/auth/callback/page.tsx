"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import {
  clearMagicLinkSessionState,
  getAppOrigin,
  getMagicLinkSessionState,
  getOobCodeFromUrl,
  readStoredEmailForSignIn,
  setMagicLinkSessionState,
} from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

type CallbackState = "loading" | "needs-email" | "signing-in" | "error";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { completeMagicLinkSignIn, loading: authLoading } = useAuth();
  const [state, setState] = useState<CallbackState>("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const finishSignIn = useCallback(
    async (emailAddress: string, url: string) => {
      const oobCode = getOobCodeFromUrl(url);

      if (oobCode) {
        const linkState = getMagicLinkSessionState(oobCode);
        if (linkState === "done") {
          router.replace("/dashboard");
          return;
        }
        if (linkState === "processing") {
          setState("signing-in");
          return;
        }
        setMagicLinkSessionState(oobCode, "processing");
      }

      setState("signing-in");
      setError(null);

      try {
        await completeMagicLinkSignIn(emailAddress, url);

        if (oobCode) {
          setMagicLinkSessionState(oobCode, "done");
        }

        router.replace("/dashboard");
      } catch (err) {
        if (oobCode) {
          clearMagicLinkSessionState(oobCode);
        }

        setState("error");
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong completing sign-in.",
        );
      }
    },
    [completeMagicLinkSignIn, router],
  );

  useEffect(() => {
    const configuredOrigin = getAppOrigin();
    const currentUrl = new URL(window.location.href);

    if (
      currentUrl.origin !== configuredOrigin &&
      currentUrl.pathname === "/auth/callback" &&
      currentUrl.searchParams.has("oobCode")
    ) {
      const correctedUrl = new URL(
        `${currentUrl.pathname}${currentUrl.search}`,
        configuredOrigin,
      );
      window.location.replace(correctedUrl.toString());
      return;
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!auth) {
      setState("error");
      setError("Firebase is not configured.");
      return;
    }

    const url = window.location.href;

    if (!isSignInWithEmailLink(auth, url)) {
      setState("error");
      setError("This sign-in link is invalid or has expired.");
      return;
    }

    const storedEmail = readStoredEmailForSignIn();

    if (storedEmail) {
      setEmail(storedEmail);
      void finishSignIn(storedEmail, url);
      return;
    }

    setState("needs-email");
  }, [authLoading, finishSignIn]);

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    await finishSignIn(email.trim(), window.location.href);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 dark:bg-[#0a0a0a]">
      <div className="login-fade-up w-full max-w-[340px] text-center">
        {(state === "loading" || state === "signing-in") && (
          <>
            <Loader2 className="mx-auto size-5 animate-spin text-[#0a0a0a]/40 dark:text-white/40" />
            <p className="mt-4 text-sm text-[#0a0a0a]/50 dark:text-white/50">
              {state === "signing-in"
                ? "Signing you in..."
                : "Verifying your link..."}
            </p>
          </>
        )}

        {state === "needs-email" && (
          <>
            <p className="text-5xl leading-none text-[#0a0a0a] dark:text-white">
              &#9993;
            </p>
            <h1 className="mt-6 text-lg font-semibold tracking-tight text-[#0a0a0a] dark:text-white">
              Confirm your email
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#0a0a0a]/50 dark:text-white/50">
              Enter the email you used to request the sign-in link.
            </p>

            <form
              onSubmit={(event) => void handleEmailSubmit(event)}
              className="mt-8 space-y-3 text-left"
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                autoComplete="email"
                className={cn(
                  "h-11 w-full rounded-lg border bg-transparent px-3.5 text-sm outline-none",
                  "border-[#0a0a0a]/15 text-[#0a0a0a] placeholder:text-[#0a0a0a]/30",
                  "focus:border-[#0a0a0a]/35",
                  "dark:border-white/15 dark:text-white dark:placeholder:text-white/30",
                  "dark:focus:border-white/35",
                )}
              />
              <button
                type="submit"
                className={cn(
                  "flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium",
                  "bg-[#0a0a0a] text-white hover:opacity-85",
                  "dark:bg-white dark:text-[#0a0a0a] dark:hover:opacity-90",
                )}
              >
                Complete sign in
              </button>
            </form>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="text-lg font-semibold tracking-tight text-[#0a0a0a] dark:text-white">
              Sign-in failed
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#0a0a0a]/50 dark:text-white/50">
              {error ?? "Something went wrong."}
            </p>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className={cn(
                "mt-8 inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-medium",
                "border-[#0a0a0a]/15 text-[#0a0a0a] hover:bg-[#0a0a0a]/[0.03]",
                "dark:border-white/15 dark:text-white dark:hover:bg-white/[0.04]",
              )}
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
