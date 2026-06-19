"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CompleteWelcomeInput {
  name: string;
  heardFrom: string;
  useCase: string[];
}

interface WelcomeModalProps {
  open: boolean;
  onComplete: (input: CompleteWelcomeInput) => void;
}

const HEARD_FROM_OPTIONS = [
  "Twitter/X",
  "LinkedIn",
  "Friend/Colleague",
  "Google",
  "ProductHunt",
  "Other",
] as const;

const USE_CASE_OPTIONS = [
  { icon: "👥", label: "Managing contacts & relationships" },
  { icon: "💰", label: "Tracking personal finances" },
  { icon: "🧠", label: "Capturing ideas & notes" },
  { icon: "🗺️", label: "Planning life goals" },
  { icon: "🏢", label: "Managing companies & deals" },
] as const;

export default function WelcomeModal({ open, onComplete }: WelcomeModalProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [heardFrom, setHeardFrom] = useState("");
  const [heardFromOther, setHeardFromOther] = useState("");
  const [useCase, setUseCase] = useState<string[]>([]);

  if (!open) return null;

  function toggleUseCase(label: string) {
    setUseCase((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  }

  function handleFinish() {
    const resolvedHeardFrom =
      heardFrom === "Other" ? heardFromOther.trim() : heardFrom;

    onComplete({
      name: name.trim(),
      heardFrom: resolvedHeardFrom,
      useCase,
    });
  }

  const canAdvanceStep1 = name.trim().length > 0;
  const canAdvanceStep2 =
    heardFrom.length > 0 &&
    (heardFrom !== "Other" || heardFromOther.trim().length > 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl">
        <div className="px-8 pt-8 pb-6">
          {step === 0 ? (
            <div className="text-center">
              <div className="text-5xl">👋</div>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
                Welcome to Relio
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Your personal OS for relationships, finance, and life goals
              </p>

              <label className="mt-8 block text-left">
                <span className="text-sm font-medium text-foreground">
                  What should we call you?
                </span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your first name"
                  className="mt-2 h-11"
                  autoFocus
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Where did you hear about us?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Helps us understand how people discover Relio
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {HEARD_FROM_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setHeardFrom(option)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      heardFrom === option
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {heardFrom === "Other" ? (
                <Input
                  value={heardFromOther}
                  onChange={(event) => setHeardFromOther(event.target.value)}
                  placeholder="Tell us more..."
                  className="mt-4 h-10"
                />
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                What will you use Relio for?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You can use all of these pick what matters most
              </p>

              <div className="mt-5 space-y-2">
                {USE_CASE_OPTIONS.map((option) => {
                  const selected = useCase.includes(option.label);

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => toggleUseCase(option.label)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                        selected
                          ? "border-foreground bg-foreground/5 text-foreground"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground",
                      )}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-8 py-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  step === index ? "bg-foreground" : "bg-border",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((current) => current - 1)}
              >
                Back
              </Button>
            ) : null}

            {step < 2 ? (
              <Button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                disabled={step === 0 ? !canAdvanceStep1 : !canAdvanceStep2}
              >
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleFinish}>
                Let&apos;s go
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
