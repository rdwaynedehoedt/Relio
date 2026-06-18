"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CURRENCY_FLAGS,
  WALLET_COLORS,
  WALLET_CURRENCIES,
} from "@/lib/finance-utils";
import type { Wallet, WalletCurrency } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WalletDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletCount: number;
  onSubmit: (data: {
    name: string;
    currency: WalletCurrency;
    balance: number;
    color: string;
  }) => Promise<void>;
}

export default function WalletDrawer({
  open,
  onOpenChange,
  walletCount,
  onSubmit,
}: WalletDrawerProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<WalletCurrency>("USD");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState(WALLET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setName("");
    setCurrency("USD");
    setBalance("");
    setColor(WALLET_COLORS[walletCount % WALLET_COLORS.length]);
    setError(null);
  }, [open, walletCount]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Wallet name is required.");
      return;
    }

    const parsedBalance = Number(balance);
    if (!Number.isFinite(parsedBalance)) {
      setError("Opening balance must be a valid number.");
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        name: name.trim(),
        currency,
        balance: parsedBalance,
        color,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save wallet.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add wallet</SheetTitle>
          <SheetDescription>
            Track balances in USD, GBP, AED, AUD, or LKR.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 px-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Wallet name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Business USD"
              className="h-10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Currency</span>
            <select
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as WalletCurrency)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none"
            >
              {WALLET_CURRENCIES.map((option) => (
                <option key={option} value={option}>
                  {CURRENCY_FLAGS[option]} {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Opening balance
            </span>
            <Input
              type="number"
              step="0.01"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
              placeholder="0.00"
              className="h-10"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Color</span>
            <div className="flex flex-wrap gap-2">
              {WALLET_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform hover:scale-105",
                    color === option
                      ? "border-foreground"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: option }}
                  aria-label={`Select color ${option}`}
                />
              ))}
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving..." : "Create wallet"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
