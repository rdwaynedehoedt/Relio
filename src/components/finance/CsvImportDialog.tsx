"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CsvTransactionRow } from "@/lib/finance-utils";
import { parseTransactionCsv } from "@/lib/finance-utils";
import type { Wallet } from "@/lib/types";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Wallet[];
  onImport: (rows: CsvTransactionRow[], walletId: string) => Promise<void>;
}

export default function CsvImportDialog({
  open,
  onOpenChange,
  wallets,
  onImport,
}: CsvImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvTransactionRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [walletId, setWalletId] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setRows([]);
    setSkipped(0);
    setWalletId(wallets[0]?.id ?? "");
    setError(null);
  }, [open, wallets]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseTransactionCsv(text);
      setRows(parsed.rows);
      setSkipped(parsed.skipped);
      setError(parsed.rows.length === 0 ? "No valid rows found in CSV." : null);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  async function handleImport() {
    if (!walletId || rows.length === 0) return;

    setImporting(true);
    setError(null);

    try {
      await onImport(rows, walletId);
      onOpenChange(false);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Failed to import transactions.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: date, description, amount, type,
            category (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-4" />
              Choose file
            </Button>

            {wallets.length > 0 ? (
              <select
                value={walletId}
                onChange={(event) => setWalletId(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none"
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    Assign to: {wallet.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {rows.length > 0 ? (
            <div className="rounded-xl border border-border/60">
              <div className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
                {rows.length} row{rows.length === 1 ? "" : "s"} ready
                {skipped > 0 ? ` · ${skipped} skipped` : ""}
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Description</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Category</th>
                      <th className="px-4 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((row, index) => (
                      <tr key={`${row.date}-${row.description}-${index}`} className="border-t border-border/40">
                        <td className="px-4 py-2 text-muted-foreground">
                          {format(parseISO(row.date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-2">{row.description}</td>
                        <td className="px-4 py-2 capitalize">{row.type}</td>
                        <td className="px-4 py-2">{row.category}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {row.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 ? (
                <p className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
                  Showing first 50 of {rows.length} rows.
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || rows.length === 0 || !walletId}
          >
            {importing ? "Importing..." : `Import ${rows.length} transactions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
