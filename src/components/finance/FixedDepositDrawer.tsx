"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
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
import { FD_CURRENCIES, SL_BANKS } from "@/lib/finance-utils";
import type { FixedDeposit } from "@/lib/types";

export type FixedDepositFormValues = Omit<
  FixedDeposit,
  "id" | "userId" | "createdAt"
>;

interface FixedDepositDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  fd?: FixedDeposit | null;
  onSubmit: (data: FixedDepositFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

function fdToFormValues(fd: FixedDeposit): FixedDepositFormValues {
  const isKnownBank = SL_BANKS.includes(fd.bankName);

  return {
    bankName: isKnownBank ? fd.bankName : "Other",
    accountNumber: fd.accountNumber,
    branch: fd.branch ?? "",
    currency: fd.currency,
    principalAmount: fd.principalAmount,
    currentBalance: fd.currentBalance,
    interestRate: fd.interestRate,
    openedDate: fd.openedDate,
    maturityDate: fd.maturityDate,
    nextInterestPayment: fd.nextInterestPayment ?? "",
    nextInterestAmount: fd.nextInterestAmount,
    interestDispositionAccount: fd.interestDispositionAccount ?? "",
    notes: fd.notes ?? "",
  };
}

const emptyForm: FixedDepositFormValues = {
  bankName: SL_BANKS[0],
  accountNumber: "",
  branch: "",
  currency: "LKR",
  principalAmount: 0,
  currentBalance: 0,
  interestRate: 0,
  openedDate: format(new Date(), "yyyy-MM-dd"),
  maturityDate: "",
  nextInterestPayment: "",
  nextInterestAmount: undefined,
  interestDispositionAccount: "",
  notes: "",
};

export default function FixedDepositDrawer({
  open,
  onOpenChange,
  mode,
  fd,
  onSubmit,
  onDelete,
}: FixedDepositDrawerProps) {
  const [values, setValues] = useState<FixedDepositFormValues>(emptyForm);
  const [customBank, setCustomBank] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOtherBank = values.bankName === "Other";

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && fd) {
      setValues(fdToFormValues(fd));
      setCustomBank(SL_BANKS.includes(fd.bankName) ? "" : fd.bankName);
    } else {
      setValues(emptyForm);
      setCustomBank("");
    }

    setError(null);
  }, [open, mode, fd]);

  function updateField<K extends keyof FixedDepositFormValues>(
    key: K,
    value: FixedDepositFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const bankName = isOtherBank ? customBank.trim() : values.bankName;

    if (!bankName) {
      setError("Bank name is required.");
      return;
    }

    if (!values.accountNumber.trim()) {
      setError("Account number is required.");
      return;
    }

    if (!values.maturityDate) {
      setError("Maturity date is required.");
      return;
    }

    if (values.principalAmount <= 0) {
      setError("Principal amount must be greater than zero.");
      return;
    }

    if (values.currentBalance < 0) {
      setError("Current balance cannot be negative.");
      return;
    }

    if (values.interestRate < 0) {
      setError("Interest rate cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        ...values,
        bankName,
        accountNumber: values.accountNumber.trim(),
        branch: values.branch?.trim() || undefined,
        currentBalance:
          values.currentBalance > 0
            ? values.currentBalance
            : values.principalAmount,
        nextInterestPayment: values.nextInterestPayment || undefined,
        nextInterestAmount: values.nextInterestAmount || undefined,
        interestDispositionAccount:
          values.interestDispositionAccount?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save fixed deposit.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!fd?.id || !onDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await onDelete(fd.id);
      onOpenChange(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete fixed deposit.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {mode === "edit" ? "Fixed deposit" : "Add fixed deposit"}
          </SheetTitle>
          <SheetDescription>
            Track locked savings with maturity dates and interest payments.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-6">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Bank</span>
            <select
              value={values.bankName}
              onChange={(event) => updateField("bankName", event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none"
            >
              {SL_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </label>

          {isOtherBank ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Bank name
              </span>
              <Input
                value={customBank}
                onChange={(event) => setCustomBank(event.target.value)}
                placeholder="Enter bank name"
                className="h-10"
              />
            </label>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Account number
            </span>
            <Input
              value={values.accountNumber}
              onChange={(event) =>
                updateField("accountNumber", event.target.value)
              }
              placeholder="Full account number"
              className="h-10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Branch</span>
            <Input
              value={values.branch ?? ""}
              onChange={(event) => updateField("branch", event.target.value)}
              placeholder="Optional"
              className="h-10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Currency</span>
            <select
              value={values.currency}
              onChange={(event) => updateField("currency", event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none"
            >
              {FD_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Principal amount
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values.principalAmount || ""}
                onChange={(event) =>
                  updateField("principalAmount", Number(event.target.value))
                }
                className="h-10"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Current balance
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values.currentBalance || ""}
                onChange={(event) =>
                  updateField("currentBalance", Number(event.target.value))
                }
                placeholder="Defaults to principal"
                className="h-10"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Interest rate (% p.a.)
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={values.interestRate || ""}
              onChange={(event) =>
                updateField("interestRate", Number(event.target.value))
              }
              className="h-10"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Opened date
              </span>
              <Input
                type="date"
                value={values.openedDate}
                onChange={(event) =>
                  updateField("openedDate", event.target.value)
                }
                className="h-10"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Maturity date
              </span>
              <Input
                type="date"
                value={values.maturityDate}
                onChange={(event) =>
                  updateField("maturityDate", event.target.value)
                }
                className="h-10"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Next interest payment
              </span>
              <Input
                type="date"
                value={values.nextInterestPayment ?? ""}
                onChange={(event) =>
                  updateField("nextInterestPayment", event.target.value)
                }
                className="h-10"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Next interest amount
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={values.nextInterestAmount ?? ""}
                onChange={(event) =>
                  updateField(
                    "nextInterestAmount",
                    event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  )
                }
                className="h-10"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Interest disposition account
            </span>
            <Input
              value={values.interestDispositionAccount ?? ""}
              onChange={(event) =>
                updateField("interestDispositionAccount", event.target.value)
              }
              placeholder="Optional"
              className="h-10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Notes</span>
            <textarea
              value={values.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Optional notes"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <SheetFooter className="px-0">
            <div className="flex w-full flex-wrap items-center gap-2">
              {mode === "edit" && fd?.id && onDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || deleting}
                  onClick={() => void handleDelete()}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={saving || deleting}
                className="ml-auto min-w-[160px] flex-1 sm:flex-none"
              >
                {saving
                  ? "Saving..."
                  : mode === "edit"
                    ? "Save changes"
                    : "Create fixed deposit"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
