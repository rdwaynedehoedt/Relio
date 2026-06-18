"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { TRANSACTION_CATEGORIES } from "@/lib/finance-utils";
import type { Transaction, TransactionType, Wallet } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Wallet[];
  onSubmit: (data: {
    walletId: string;
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    date: string;
  }) => Promise<void>;
}

export default function TransactionDrawer({
  open,
  onOpenChange,
  wallets,
  onSubmit,
}: TransactionDrawerProps) {
  const [walletId, setWalletId] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(TRANSACTION_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setWalletId(wallets[0]?.id ?? "");
    setType("expense");
    setAmount("");
    setCategory(TRANSACTION_CATEGORIES[0]);
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setError(null);
  }, [open, wallets]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!walletId) {
      setError("Select a wallet first.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        walletId,
        amount: parsedAmount,
        type,
        category,
        description: description.trim(),
        date,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save transaction.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add transaction</SheetTitle>
          <SheetDescription>
            Record income or expenses against a wallet.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 px-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Wallet</span>
            <select
              value={walletId}
              onChange={(event) => setWalletId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none"
              disabled={wallets.length === 0}
            >
              {wallets.length === 0 ? (
                <option value="">No wallets yet</option>
              ) : (
                wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Type</span>
            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income"] as TransactionType[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
                    type === option
                      ? option === "income"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                      : "border-border text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Amount</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="h-10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none"
            >
              {TRANSACTION_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Description</span>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What was this for?"
              className="h-10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Date</span>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-10"
            />
          </label>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <SheetFooter className="px-0">
            <Button
              type="submit"
              disabled={saving || wallets.length === 0}
              className="w-full"
            >
              {saving ? "Saving..." : "Add transaction"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
