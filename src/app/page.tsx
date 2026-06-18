"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import RelioLogo from "@/components/RelioLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

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

export default function LoginPage() {
  const { user, loading, signIn, sendMagicLink } = useAuth();
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);

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

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-[400px] rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <RelioLogo className="size-11" />
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground">
            Relio
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground">
            Sign in to continue
          </p>
        </div>

        <div className="mt-8">
          {linkSent ? (
            <div className="space-y-3 text-center">
              <p className="text-base font-bold text-foreground">Check your inbox</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We sent a sign-in link to{" "}
                <span className="font-semibold text-foreground">{email}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setLinkSent(false);
                  setError(null);
                }}
                className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 w-full font-semibold"
                disabled={googleLoading || sendingLink}
                onClick={() => void handleGoogleSignIn()}
              >
                {googleLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form
                className="space-y-3"
                onSubmit={(event) => void handleMagicLinkSubmit(event)}
              >
                <Input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  disabled={sendingLink || googleLoading}
                  className="h-11"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full font-semibold"
                  disabled={sendingLink || googleLoading || !email.trim()}
                >
                  {sendingLink ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Send magic link"
                  )}
                </Button>
              </form>
            </div>
          )}

          {error ? (
            <p className="mt-4 text-center text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
