"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { AuthShell } from "@/components/auth/AuthShell";
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

const easeOut = [0.16, 1, 0.3, 1] as const;

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
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="w-full max-w-[400px] text-center"
      >
        {(state === "loading" || state === "signing-in") && (
          <>
            <Loader2 className="mx-auto size-5 animate-spin text-neutral-400" />
            <p className="mt-4 text-sm text-neutral-500">
              {state === "signing-in"
                ? "Signing you in..."
                : "Verifying your link..."}
            </p>
          </>
        )}

        {state === "needs-email" && (
          <>
            <span className="text-4xl leading-none">✉️</span>
            <h1 className="mt-6 text-3xl font-light tracking-tight text-[#0a0a0a]">
              Confirm your email
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
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
                  "h-11 w-full rounded-full border border-neutral-200 bg-white px-4 text-sm text-[#0a0a0a] outline-none transition-colors",
                  "placeholder:text-neutral-400 focus:border-neutral-400",
                )}
              />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0a0a0a] text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Complete sign in
              </button>
            </form>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="text-3xl font-light tracking-tight text-[#0a0a0a]">
              Sign-in failed
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              {error ?? "Something went wrong."}
            </p>
            <button
              type="button"
              onClick={() => router.replace("/auth")}
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 px-6 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-neutral-50"
            >
              Back to sign in
            </button>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
