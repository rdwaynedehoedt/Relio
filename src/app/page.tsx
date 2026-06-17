"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RelioLogo from "@/components/RelioLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
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

const features = [
  "Contacts & companies in one place",
  "HubSpot import built in",
  "Built for calm, focused selling",
];

export default function LoginPage() {
  const { user, loading, signIn, sendMagicLink } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

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

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.08),transparent_45%)]" />

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <RelioLogo className="mb-10 size-16 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_40px_-12px_rgba(0,0,0,0.5)]" />

        <h1 className="text-4xl font-bold tracking-tight text-white">
          Relio
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-zinc-400">
          Your calm, confident CRM for modern teams.
        </p>

        <div className="mt-12 w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-sm">
          <Button
            variant="outline"
            size="lg"
            disabled={googleLoading || sendingLink}
            className="h-12 w-full gap-3 border-zinc-700 bg-zinc-950 text-[15px] font-medium text-white hover:bg-zinc-800 hover:text-white"
            onClick={handleGoogleSignIn}
          >
            {googleLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </Button>

          <div className="relative my-8">
            <Separator className="bg-zinc-800" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900/60 px-3 text-xs font-medium text-zinc-500">
              or
            </span>
          </div>

          {linkSent ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-5 text-left">
              <p className="text-sm font-medium text-white">
                Check your email — we sent you a sign in link
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                We sent a link to{" "}
                <span className="font-medium text-zinc-300">{email}</span>.
                Open it on this device to continue.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLinkSent(false);
                  setError(null);
                }}
                className="mt-4 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-3 text-left">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                disabled={sendingLink || googleLoading}
                className="h-12 border-zinc-700 bg-zinc-950 px-4 text-[15px] text-white placeholder:text-zinc-500"
              />
              <Button
                type="submit"
                size="lg"
                disabled={sendingLink || googleLoading || !email.trim()}
                className="h-12 w-full bg-white text-[15px] font-medium text-zinc-950 hover:bg-zinc-200"
              >
                {sendingLink ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
                ) : (
                  "Send magic link"
                )}
              </Button>
            </form>
          )}

          {error ? (
            <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <ul className="mt-8 space-y-3 text-left">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-sm text-zinc-400"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-zinc-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
