"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import CsvImportDialog from "@/components/finance/CsvImportDialog";
import FixedDepositDrawer, {
  type FixedDepositFormValues,
} from "@/components/finance/FixedDepositDrawer";
import FinanceCharts from "@/components/finance/FinanceCharts";
import TransactionDrawer from "@/components/finance/TransactionDrawer";
import WalletDrawer from "@/components/finance/WalletDrawer";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  CATEGORY_ICONS,
  convertCurrencyToLkr,
  convertToLkr,
  CURRENCY_FLAGS,
  type CsvTransactionRow,
  type ExchangeRates,
  fetchExchangeRates,
  filterTransactions,
  formatCurrencyAmount,
  formatLkr,
  formatMoney,
  getCategorySpendingData,
  getCurrentMonthKey,
  getDailySpendingData,
  getFdProgress,
  getMonthlyStats,
  getMonthLabel,
  getNetWorthSummary,
  getTransactionMonthOptions,
  getWalletMap,
  maskAccountNumber,
  TRANSACTION_CATEGORIES,
} from "@/lib/finance-utils";
import {
  addFixedDeposit,
  addTransaction,
  addTransactionsBatch,
  addWallet,
  deleteTransaction,
  getFixedDeposits,
  getTransactions,
  getWallets,
  updateWallet,
} from "@/lib/firestore";
import type {
  FixedDeposit,
  Transaction,
  TransactionFilters,
  Wallet as WalletType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_RATES: ExchangeRates = {
  USD: 0,
  GBP: 0,
  AED: 0,
  AUD: 0,
};

export default function FinancePage() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false);
  const [fdDrawerOpen, setFdDrawerOpen] = useState(false);
  const [transactionDrawerOpen, setTransactionDrawerOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    month: getCurrentMonthKey(),
  });

  const loadRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError(null);

    try {
      const nextRates = await fetchExchangeRates();
      setRates(nextRates);
    } catch (error) {
      setRatesError(
        error instanceof Error ? error.message : "Failed to load exchange rates.",
      );
    } finally {
      setRatesLoading(false);
    }
  }, []);

  const reloadFinanceData = useCallback(async () => {
    if (!user) return;

    const [nextWallets, nextFixedDeposits, nextTransactions] = await Promise.all([
      getWallets(user.uid),
      getFixedDeposits(user.uid),
      getTransactions(user.uid),
    ]);

    setWallets(nextWallets);
    setFixedDeposits(nextFixedDeposits);
    setTransactions(nextTransactions);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        await Promise.all([reloadFinanceData(), loadRates()]);
      } catch (error) {
        console.error("Failed to load finance data:", error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, reloadFinanceData, loadRates]);

  const walletMap = useMemo(() => getWalletMap(wallets), [wallets]);
  const monthOptions = useMemo(
    () => getTransactionMonthOptions(transactions),
    [transactions],
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters],
  );

  const monthlyStats = useMemo(
    () => getMonthlyStats(transactions, wallets, rates, filters.month),
    [transactions, wallets, rates, filters.month],
  );

  const categoryData = useMemo(
    () => getCategorySpendingData(transactions, wallets, rates, filters.month),
    [transactions, wallets, rates, filters.month],
  );

  const dailyData = useMemo(
    () => getDailySpendingData(transactions, wallets, rates),
    [transactions, wallets, rates],
  );

  const netWorth = useMemo(
    () => getNetWorthSummary(wallets, fixedDeposits, rates),
    [wallets, fixedDeposits, rates],
  );

  async function handleCreateWallet(data: {
    name: string;
    currency: WalletType["currency"];
    balance: number;
    color: string;
  }) {
    if (!user) return;

    const wallet = await addWallet({
      ...data,
      userId: user.uid,
    });

    setWallets((current) => [...current, wallet]);
  }

  async function handleCreateFixedDeposit(data: FixedDepositFormValues) {
    if (!user) return;

    const fd = await addFixedDeposit({
      ...data,
      userId: user.uid,
    });

    setFixedDeposits((current) =>
      [...current, fd].sort((a, b) =>
        (a.maturityDate ?? "").localeCompare(b.maturityDate ?? ""),
      ),
    );
  }

  async function handleCreateTransaction(data: {
    walletId: string;
    amount: number;
    type: Transaction["type"];
    category: string;
    description: string;
    date: string;
  }) {
    if (!user) return;

    const wallet = walletMap.get(data.walletId);
    if (!wallet?.id) return;

    const transaction = await addTransaction({
      ...data,
      userId: user.uid,
    });

    const nextBalance =
      data.type === "income"
        ? wallet.balance + data.amount
        : wallet.balance - data.amount;

    await updateWallet(wallet.id, { balance: nextBalance });

    setTransactions((current) => [transaction, ...current]);
    setWallets((current) =>
      current.map((item) =>
        item.id === wallet.id ? { ...item, balance: nextBalance } : item,
      ),
    );
  }

  async function handleCsvImport(rows: CsvTransactionRow[], walletId: string) {
    if (!user) return;

    const wallet = walletMap.get(walletId);
    if (!wallet?.id) return;

    const payload = rows.map((row) => ({
      walletId,
      amount: row.amount,
      type: row.type,
      category: row.category,
      description: row.description,
      date: row.date,
      userId: user.uid,
    }));

    const created = await addTransactionsBatch(payload);

    let balanceDelta = 0;
    rows.forEach((row) => {
      balanceDelta += row.type === "income" ? row.amount : -row.amount;
    });

    const nextBalance = wallet.balance + balanceDelta;
    await updateWallet(wallet.id, { balance: nextBalance });

    setTransactions((current) => [...created, ...current]);
    setWallets((current) =>
      current.map((item) =>
        item.id === wallet.id ? { ...item, balance: nextBalance } : item,
      ),
    );
  }

  async function handleDeleteTransaction(id: string) {
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;

    const wallet = walletMap.get(transaction.walletId);
    await deleteTransaction(id);

    if (wallet?.id) {
      const reversal =
        transaction.type === "income"
          ? -transaction.amount
          : transaction.amount;
      const nextBalance = wallet.balance + reversal;
      await updateWallet(wallet.id, { balance: nextBalance });

      setWallets((current) =>
        current.map((item) =>
          item.id === wallet.id ? { ...item, balance: nextBalance } : item,
        ),
      );
    }

    setTransactions((current) => current.filter((item) => item.id !== id));
  }

  const ratePairs: { from: keyof ExchangeRates; label: string }[] = [
    { from: "USD", label: "USD → LKR" },
    { from: "GBP", label: "GBP → LKR" },
    { from: "AED", label: "AED → LKR" },
    { from: "AUD", label: "AUD → LKR" },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="pl-72">
          <div className="mx-auto max-w-7xl px-8 py-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Finance
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track your money across currencies
                </p>
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  {ratePairs.map(({ from, label }) => (
                    <div
                      key={from}
                      className="flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium text-foreground">{label}</span>
                      <span className="text-muted-foreground">
                        {ratesLoading
                          ? "..."
                          : rates[from]
                            ? rates[from].toFixed(2)
                            : "—"}
                      </span>
                      {!ratesLoading && rates[from] ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Live
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    Mid-market rate · Updated daily
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => void loadRates()}
                    disabled={ratesLoading}
                  >
                    <RefreshCw
                      className={cn("size-3.5", ratesLoading && "animate-spin")}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
              {ratesError ? (
                <p className="mt-2 text-xs text-destructive">{ratesError}</p>
              ) : null}
            </section>

            <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    Net Worth
                  </h2>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                    {formatLkr(netWorth.totalLkr)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/30 px-4 py-3">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {formatLkr(netWorth.liquidLkr)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Liquid</p>
                  <p className="text-xs text-muted-foreground/80">
                    Wallet balances in LKR
                  </p>
                </div>
                <div className="rounded-xl bg-muted/30 px-4 py-3">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {formatLkr(netWorth.lockedLkr)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Locked in FDs
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Fixed deposit balances
                  </p>
                </div>
                <div className="rounded-xl bg-muted/30 px-4 py-3">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {formatLkr(netWorth.totalLkr)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Total net worth
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Liquid + locked
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Spent this month"
                value={formatLkr(monthlyStats.totalSpentLkr)}
                icon={TrendingDown}
                tone="expense"
              />
              <StatCard
                label="Income this month"
                value={formatLkr(monthlyStats.totalIncomeLkr)}
                icon={TrendingUp}
                tone="income"
              />
              <StatCard
                label="Net this month"
                value={formatLkr(monthlyStats.netLkr)}
                icon={monthlyStats.netLkr >= 0 ? ArrowUpRight : ArrowDownLeft}
                tone={monthlyStats.netLkr >= 0 ? "income" : "expense"}
              />
              <StatCard
                label="Biggest spend"
                value={monthlyStats.biggestSpendCategory ?? "—"}
                icon={Wallet}
                tone="neutral"
                compact
              />
            </section>

            <section className="mt-6">
              <FinanceCharts categoryData={categoryData} dailyData={dailyData} />
            </section>

            <section className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Wallets</h2>
                  <p className="text-sm text-muted-foreground">
                    Balances with live LKR conversion
                  </p>
                </div>
                <Button size="sm" onClick={() => setWalletDrawerOpen(true)}>
                  <Plus className="size-4" />
                  Add wallet
                </Button>
              </div>

              {loading ? (
                <div className="mt-4 flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/60 text-sm text-muted-foreground">
                  Loading wallets...
                </div>
              ) : wallets.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 px-6 py-12 text-center">
                  <Wallet className="size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    No wallets yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a wallet to start tracking balances.
                  </p>
                  <Button
                    className="mt-4"
                    size="sm"
                    onClick={() => setWalletDrawerOpen(true)}
                  >
                    <Plus className="size-4" />
                    Add wallet
                  </Button>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {wallets.map((wallet) => {
                    const lkrAmount = convertToLkr(
                      wallet.balance,
                      wallet.currency,
                      rates,
                    );

                    return (
                      <div
                        key={wallet.id}
                        className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {CURRENCY_FLAGS[wallet.currency]}
                              </span>
                              <h3 className="font-semibold text-foreground">
                                {wallet.name}
                              </h3>
                            </div>
                            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                              {formatMoney(wallet.balance, wallet.currency)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              ≈ {formatLkr(lkrAmount)}
                            </p>
                          </div>
                          <span
                            className="size-3 rounded-full"
                            style={{ backgroundColor: wallet.color }}
                          />
                        </div>

                        <div className="mt-4 h-10 rounded-lg bg-gradient-to-r from-muted/20 via-muted/60 to-muted/20" />
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setWalletDrawerOpen(true)}
                    className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 text-muted-foreground transition-colors hover:border-border hover:bg-muted/20 hover:text-foreground"
                  >
                    <Plus className="size-5" />
                    <span className="mt-2 text-sm font-medium">Add wallet</span>
                  </button>
                </div>
              )}
            </section>

            <section className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Fixed Deposits
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Locked savings with maturity tracking
                  </p>
                </div>
                <Button size="sm" onClick={() => setFdDrawerOpen(true)}>
                  <Plus className="size-4" />
                  Add FD
                </Button>
              </div>

              {loading ? (
                <div className="mt-4 flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/60 text-sm text-muted-foreground">
                  Loading fixed deposits...
                </div>
              ) : fixedDeposits.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 px-6 py-12 text-center">
                  <Lock className="size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    No fixed deposits yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add an FD to track locked savings and interest.
                  </p>
                  <Button
                    className="mt-4"
                    size="sm"
                    onClick={() => setFdDrawerOpen(true)}
                  >
                    <Plus className="size-4" />
                    Add FD
                  </Button>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {fixedDeposits.map((fd) => (
                    <FixedDepositCard key={fd.id} fd={fd} rates={rates} />
                  ))}

                  <button
                    type="button"
                    onClick={() => setFdDrawerOpen(true)}
                    className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 text-muted-foreground transition-colors hover:border-border hover:bg-muted/20 hover:text-foreground"
                  >
                    <Plus className="size-5" />
                    <span className="mt-2 text-sm font-medium">Add FD</span>
                  </button>
                </div>
              )}
            </section>

            <section className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Transactions
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Filter by wallet, category, or month
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCsvDialogOpen(true)}
                    disabled={wallets.length === 0}
                  >
                    <Upload className="size-4" />
                    Import CSV
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setTransactionDrawerOpen(true)}
                    disabled={wallets.length === 0}
                  >
                    <Plus className="size-4" />
                    Add transaction
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <select
                  value={filters.walletId ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      walletId: event.target.value || undefined,
                    }))
                  }
                  className="h-9 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none"
                >
                  <option value="">All wallets</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.category ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      category: event.target.value || undefined,
                    }))
                  }
                  className="h-9 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none"
                >
                  <option value="">All categories</option>
                  {TRANSACTION_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.month ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      month: event.target.value || undefined,
                    }))
                  }
                  className="h-9 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none"
                >
                  <option value="">All months</option>
                  {monthOptions.map((month) => (
                    <option key={month} value={month}>
                      {getMonthLabel(month)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                {filteredTransactions.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No transactions match your filters.
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {filteredTransactions.map((transaction) => {
                      const wallet = walletMap.get(transaction.walletId);
                      const Icon =
                        CATEGORY_ICONS[transaction.category] ??
                        CATEGORY_ICONS.Other;

                      return (
                        <div
                          key={transaction.id}
                          className="flex flex-wrap items-center gap-4 px-5 py-4"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {transaction.description}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {transaction.category}
                                {wallet ? ` · ${wallet.name}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p
                              className={cn(
                                "font-semibold",
                                transaction.type === "income"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400",
                              )}
                            >
                              {transaction.type === "income" ? "+" : "−"}
                              {wallet
                                ? formatMoney(transaction.amount, wallet.currency)
                                : transaction.amount.toFixed(2)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {format(parseISO(transaction.date), "MMM d, yyyy")}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground"
                            onClick={() =>
                              transaction.id &&
                              void handleDeleteTransaction(transaction.id)
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <WalletDrawer
        open={walletDrawerOpen}
        onOpenChange={setWalletDrawerOpen}
        walletCount={wallets.length}
        onSubmit={handleCreateWallet}
      />

      <FixedDepositDrawer
        open={fdDrawerOpen}
        onOpenChange={setFdDrawerOpen}
        onSubmit={handleCreateFixedDeposit}
      />

      <TransactionDrawer
        open={transactionDrawerOpen}
        onOpenChange={setTransactionDrawerOpen}
        wallets={wallets}
        onSubmit={handleCreateTransaction}
      />

      <CsvImportDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        wallets={wallets}
        onImport={handleCsvImport}
      />
    </AuthGuard>
  );
}

function FixedDepositCard({
  fd,
  rates,
}: {
  fd: FixedDeposit;
  rates: ExchangeRates;
}) {
  const progress = getFdProgress(fd.openedDate, fd.maturityDate);
  const principalLkr = convertCurrencyToLkr(
    fd.principalAmount,
    fd.currency,
    rates,
  );
  const balanceLkr = convertCurrencyToLkr(
    fd.currentBalance,
    fd.currency,
    rates,
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">
              {fd.bankName}
            </h3>
            <Lock className="size-3.5 shrink-0 text-muted-foreground/70" />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {maskAccountNumber(fd.accountNumber)}
          </p>
          {fd.branch ? (
            <p className="mt-0.5 text-xs text-muted-foreground/80">
              {fd.branch}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
          {fd.interestRate.toFixed(2)}% p.a.
        </span>
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        {formatLkr(principalLkr)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Principal
        {fd.currency !== "LKR"
          ? ` · ${formatCurrencyAmount(fd.principalAmount, fd.currency)}`
          : ""}
      </p>

      <p className="mt-3 text-sm text-muted-foreground">
        Current balance{" "}
        <span className="font-medium text-foreground">
          {formatCurrencyAmount(fd.currentBalance, fd.currency)}
        </span>
        {fd.currency !== "LKR" ? (
          <span className="text-muted-foreground/80">
            {" "}
            · ≈ {formatLkr(balanceLkr)}
          </span>
        ) : null}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(parseISO(fd.openedDate), "MMM d, yyyy")}</span>
          <span>{format(parseISO(fd.maturityDate), "MMM d, yyyy")}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-foreground/80 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {progress.isMatured
            ? "Matured"
            : `${progress.daysRemaining} day${progress.daysRemaining === 1 ? "" : "s"} remaining`}
        </p>
      </div>

      {fd.nextInterestPayment ? (
        <div className="mt-4 rounded-xl bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">Next interest payment</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {format(parseISO(fd.nextInterestPayment), "MMM d, yyyy")}
            {fd.nextInterestAmount
              ? ` · ${formatCurrencyAmount(fd.nextInterestAmount, fd.currency)}`
              : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  compact = false,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  tone: "income" | "expense" | "neutral";
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone === "income" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            tone === "expense" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            tone === "neutral" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <p
        className={cn(
          "mt-3 font-semibold text-foreground",
          compact ? "text-base" : "text-2xl tracking-tight",
        )}
      >
        {value}
      </p>
    </div>
  );
}
