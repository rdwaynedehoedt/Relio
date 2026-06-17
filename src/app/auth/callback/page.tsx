"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EMAIL_FOR_SIGN_IN_KEY,
  useAuth,
} from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

type CallbackState = "loading" | "needs-email" | "signing-in" | "error";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { completeMagicLinkSignIn } = useAuth();
  const [state, setState] = useState<CallbackState>("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

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

    const storedEmail = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);

    if (storedEmail) {
      setEmail(storedEmail);
      finishSignIn(storedEmail, url);
      return;
    }

    setState("needs-email");
  }, []);

  async function finishSignIn(emailAddress: string, url: string) {
    setState("signing-in");
    setError(null);

    try {
      await completeMagicLinkSignIn(emailAddress, url);
      router.replace("/dashboard");
    } catch (err) {
      setState("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong completing sign-in.",
      );
    }
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) return;

    await finishSignIn(email.trim(), window.location.href);
  }

  if (state === "loading" || state === "signing-in") {
    return (
      <CallbackShell>
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <p className="text-sm text-zinc-400">
            {state === "signing-in"
              ? "Signing you in..."
              : "Verifying your link..."}
          </p>
        </div>
      </CallbackShell>
    );
  }

  if (state === "needs-email") {
    return (
      <CallbackShell>
        <div className="w-full text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Confirm your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Enter the email address you used to request the sign-in link.
          </p>

          <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4 text-left">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="h-11 border-zinc-700 bg-zinc-950 px-4 text-[15px] text-white placeholder:text-zinc-500"
            />
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full bg-white text-[15px] font-medium text-zinc-950 hover:bg-zinc-200"
            >
              Complete sign in
            </Button>
          </form>
        </div>
      </CallbackShell>
    );
  }

  return (
    <CallbackShell>
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Sign-in failed
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {error ?? "Something went wrong."}
        </p>
        <Button
          variant="outline"
          size="lg"
          className="mt-8 h-11 border-zinc-700 bg-zinc-950 text-white hover:bg-zinc-800 hover:text-white"
          onClick={() => router.replace("/")}
        >
          Back to login
        </Button>
      </div>
    </CallbackShell>
  );
}

function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
