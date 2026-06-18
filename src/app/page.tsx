"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Contacts & companies",
  "Finance across currencies",
  "Second Brain for ideas",
  "Life Map for goals",
  "HubSpot, Google & more",
] as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function RelioMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-10", className)}
      aria-hidden="true"
    >
      <rect
        width="40"
        height="40"
        rx="8"
        className="fill-[#0a0a0a] dark:fill-white"
      />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        className="fill-white text-[22px] font-semibold dark:fill-[#0a0a0a]"
        style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}
      >
        R
      </text>
    </svg>
  );
}

function LeftPanelContent({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "login-fade-up flex w-full flex-col",
        compact ? "items-center text-center" : "max-w-lg",
      )}
    >
      <p
        className={cn(
          "font-extralight tracking-[0.35em] text-white lowercase",
          compact ? "text-5xl sm:text-6xl" : "text-7xl xl:text-[5.5rem]",
        )}
      >
        relio
      </p>

      <div
        className={cn(
          "h-px bg-white/10",
          compact ? "mt-5 w-16" : "mt-8 w-full max-w-xs",
        )}
      />

      <h1
        className={cn(
          "font-semibold tracking-tight text-white",
          compact
            ? "mt-6 text-2xl leading-tight sm:text-3xl"
            : "mt-10 text-4xl leading-[1.08] xl:text-[2.75rem]",
        )}
      >
        Remember everyone
        <br />
        that matters.
      </h1>

      {!compact ? (
        <>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/50">
            Your personal OS for relationships,
            <br />
            money, and life goals.
          </p>

          <ul className="mt-10 w-full max-w-md">
            {FEATURES.map((feature, index) => (
              <li key={feature}>
                {index > 0 ? (
                  <div className="my-3 h-px bg-white/10" aria-hidden />
                ) : null}
                <div className="flex items-center gap-3">
                  <span className="size-1 shrink-0 rounded-full bg-white/60" />
                  <span className="text-sm text-white/60">{feature}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function SignInPanel() {
  const { signIn, sendMagicLink } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!linkSent) {
      emailRef.current?.focus();
    }
  }, [linkSent]);

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    try {
      await signIn();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in failed. Please try again.",
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleMagicLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setSendingLink(true);

    try {
      await sendMagicLink(email.trim());
      setLinkSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send magic link. Please try again.",
      );
    } finally {
      setSendingLink(false);
    }
  }

  return (
    <div className="login-fade-up-delayed mx-auto flex w-full max-w-[340px] flex-col items-center">
      <RelioMark />
      <p className="mt-5 text-2xl font-extralight tracking-[0.28em] text-[#0a0a0a] lowercase dark:text-white">
        relio
      </p>
      <p className="mt-2 text-sm text-[#0a0a0a]/45 dark:text-white/45">
        Sign in to continue
      </p>

      <div className="mt-10 w-full">
        {linkSent ? (
          <div className="text-center">
            <p className="text-5xl leading-none text-[#0a0a0a] dark:text-white">
              &#9993;
            </p>
            <p className="mt-6 text-lg font-semibold tracking-tight text-[#0a0a0a] dark:text-white">
              Check your inbox
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#0a0a0a]/50 dark:text-white/50">
              We sent a sign in link to{" "}
              <span className="font-medium text-[#0a0a0a]/70 dark:text-white/70">
                {email}
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                setLinkSent(false);
                setError(null);
              }}
              className="mt-6 text-sm text-[#0a0a0a]/45 underline underline-offset-4 transition-opacity hover:opacity-70 dark:text-white/45"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={googleLoading || sendingLink}
              onClick={() => void handleGoogleSignIn()}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border text-sm font-medium transition-colors",
                "border-[#0a0a0a]/15 bg-white text-[#0a0a0a] hover:bg-[#0a0a0a]/[0.03]",
                "dark:border-white/15 dark:bg-[#0a0a0a] dark:text-white dark:hover:bg-white/[0.04]",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {googleLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="h-px bg-[#0a0a0a]/10 dark:bg-white/10" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-[#0a0a0a]/35 dark:bg-[#0a0a0a] dark:text-white/35">
                or
              </span>
            </div>

            <form onSubmit={(event) => void handleMagicLinkSubmit(event)}>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                disabled={sendingLink || googleLoading}
                className={cn(
                  "h-11 w-full rounded-lg border bg-transparent px-3.5 text-sm outline-none transition-colors",
                  "border-[#0a0a0a]/15 text-[#0a0a0a] placeholder:text-[#0a0a0a]/30",
                  "focus:border-[#0a0a0a]/35",
                  "dark:border-white/15 dark:text-white dark:placeholder:text-white/30",
                  "dark:focus:border-white/35",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
              <button
                type="submit"
                disabled={sendingLink || googleLoading || !email.trim()}
                className={cn(
                  "mt-3 flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium transition-opacity",
                  "bg-[#0a0a0a] text-white hover:opacity-85",
                  "dark:bg-white dark:text-[#0a0a0a] dark:hover:opacity-90",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                {sendingLink ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Send magic link"
                )}
              </button>
            </form>
          </>
        )}

        {error ? (
          <p className="mt-4 border border-red-500/20 px-3 py-2.5 text-left text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <Loader2 className="size-5 animate-spin text-[#0a0a0a]/40 dark:text-white/40" />
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-[100dvh] flex-col overflow-hidden lg:flex-row">
      <section className="relative hidden bg-[#0a0a0a] lg:flex lg:w-[55%] lg:items-center lg:justify-center lg:px-16 xl:px-24">
        <LeftPanelContent />
        <p className="absolute bottom-8 left-16 text-[11px] tracking-wide text-white/30 xl:left-24">
          Built for growth leads, founders &amp; operators
        </p>
      </section>

      <section className="flex h-[40vh] shrink-0 items-center justify-center bg-[#0a0a0a] px-8 lg:hidden">
        <LeftPanelContent compact />
      </section>

      <section className="flex min-h-0 flex-1 items-center justify-center bg-white px-8 py-10 dark:bg-[#0a0a0a] lg:h-screen lg:w-[45%] lg:flex-none lg:py-0">
        <SignInPanel />
      </section>
    </div>
  );
}
