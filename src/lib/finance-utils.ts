import {
  differenceInDays,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  Briefcase,
  Car,
  CreditCard,
  DollarSign,
  Film,
  Heart,
  Landmark,
  MoreHorizontal,
  Plane,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type {
  FixedDeposit,
  Transaction,
  TransactionFilters,
  Wallet,
  WalletCurrency,
} from "@/lib/types";

export const WALLET_CURRENCIES: WalletCurrency[] = [
  "USD",
  "GBP",
  "AED",
  "AUD",
  "LKR",
];

export const CURRENCY_FLAGS: Record<WalletCurrency, string> = {
  USD: "🇺🇸",
  GBP: "🇬🇧",
  AED: "🇦🇪",
  AUD: "🇦🇺",
  LKR: "🇱🇰",
};

export const WALLET_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];

export const SL_BANKS = [
  "Commercial Bank",
  "Sampath Bank",
  "HNB",
  "BOC",
  "Seylan Bank",
  "People's Bank",
  "NSB",
  "NTB",
  "Other",
] as const;

export const FD_CURRENCIES = ["LKR", "USD", "GBP", "AED", "AUD"] as const;

export const TRANSACTION_CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Business",
  "Entertainment",
  "Bills & Utilities",
  "Shopping",
  "Health",
  "Travel",
  "Subscriptions",
  "Savings & Investments",
  "Salary & Income",
  "Freelance Income",
  "Other",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Food & Dining": Utensils,
  Transport: Car,
  Business: Briefcase,
  Entertainment: Film,
  "Bills & Utilities": Zap,
  Shopping: ShoppingBag,
  Health: Heart,
  Travel: Plane,
  Subscriptions: CreditCard,
  "Savings & Investments": Landmark,
  "Salary & Income": DollarSign,
  "Freelance Income": TrendingUp,
  Other: MoreHorizontal,
};

export type ExchangeRates = Record<Exclude<WalletCurrency, "LKR">, number>;

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const response = await fetch("/api/exchange-rates");

  if (!response.ok) {
    throw new Error("Failed to load exchange rates.");
  }

  const data = (await response.json()) as {
    rates?: ExchangeRates;
    error?: string;
  };

  if (!data.rates) {
    throw new Error(data.error ?? "Failed to load exchange rates.");
  }

  return data.rates;
}

export function convertToLkr(
  amount: number,
  currency: WalletCurrency,
  rates: ExchangeRates,
): number {
  if (currency === "LKR") return amount;
  const rate = rates[currency];
  return rate ? amount * rate : amount;
}

export function convertCurrencyToLkr(
  amount: number,
  currency: string,
  rates: ExchangeRates,
): number {
  if (currency === "LKR") return amount;

  if (
    currency === "USD" ||
    currency === "GBP" ||
    currency === "AED" ||
    currency === "AUD"
  ) {
    return convertToLkr(amount, currency, rates);
  }

  return amount;
}

export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\s/g, "");
  if (digits.length <= 4) return digits;
  return `•••• ${digits.slice(-4)}`;
}

export function getFdProgress(openedDate: string, maturityDate: string) {
  const opened = parseISO(openedDate);
  const maturity = parseISO(maturityDate);
  const today = new Date();

  const totalDays = Math.max(differenceInDays(maturity, opened), 1);
  const elapsedDays = Math.min(
    Math.max(differenceInDays(today, opened), 0),
    totalDays,
  );
  const daysRemaining = Math.max(differenceInDays(maturity, today), 0);
  const percent = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
  const isMatured = today >= maturity;

  return {
    percent,
    daysRemaining,
    isMatured,
    elapsedDays,
    totalDays,
  };
}

export interface NetWorthSummary {
  liquidLkr: number;
  lockedLkr: number;
  totalLkr: number;
}

export function getNetWorthSummary(
  wallets: Wallet[],
  fixedDeposits: FixedDeposit[],
  rates: ExchangeRates,
): NetWorthSummary {
  const liquidLkr = wallets.reduce(
    (sum, wallet) =>
      sum + convertToLkr(wallet.balance, wallet.currency, rates),
    0,
  );

  const lockedLkr = fixedDeposits.reduce(
    (sum, fd) =>
      sum + convertCurrencyToLkr(fd.currentBalance, fd.currency, rates),
    0,
  );

  return {
    liquidLkr,
    lockedLkr,
    totalLkr: liquidLkr + lockedLkr,
  };
}

export function formatCurrencyAmount(amount: number, currency: string): string {
  if (currency === "LKR") return formatLkr(amount);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatMoney(amount: number, currency: WalletCurrency): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "LKR" ? 0 : 2,
    maximumFractionDigits: currency === "LKR" ? 0 : 2,
  });

  return formatter.format(amount);
}

export function formatLkr(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  return transactions.filter((transaction) => {
    if (filters.walletId && transaction.walletId !== filters.walletId) {
      return false;
    }

    if (filters.category && transaction.category !== filters.category) {
      return false;
    }

    if (filters.month) {
      const date = parseISO(transaction.date);
      const monthKey = format(date, "yyyy-MM");
      if (monthKey !== filters.month) return false;
    }

    return true;
  });
}

export function getTransactionMonthOptions(transactions: Transaction[]): string[] {
  const months = new Set<string>();

  transactions.forEach((transaction) => {
    months.add(format(parseISO(transaction.date), "yyyy-MM"));
  });

  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

export function getCurrentMonthKey(): string {
  return format(new Date(), "yyyy-MM");
}

export function getWalletMap(wallets: Wallet[]): Map<string, Wallet> {
  return new Map(
    wallets
      .filter((wallet) => wallet.id)
      .map((wallet) => [wallet.id!, wallet]),
  );
}

export interface MonthlyStats {
  totalSpentLkr: number;
  totalIncomeLkr: number;
  netLkr: number;
  biggestSpendCategory: string | null;
}

export function getMonthlyStats(
  transactions: Transaction[],
  wallets: Wallet[],
  rates: ExchangeRates,
  month = getCurrentMonthKey(),
): MonthlyStats {
  const walletMap = getWalletMap(wallets);
  const monthTransactions = filterTransactions(transactions, { month });

  let totalSpentLkr = 0;
  let totalIncomeLkr = 0;
  const categorySpend = new Map<string, number>();

  monthTransactions.forEach((transaction) => {
    const wallet = walletMap.get(transaction.walletId);
    if (!wallet) return;

    const lkrAmount = convertToLkr(transaction.amount, wallet.currency, rates);

    if (transaction.type === "expense") {
      totalSpentLkr += lkrAmount;
      categorySpend.set(
        transaction.category,
        (categorySpend.get(transaction.category) ?? 0) + lkrAmount,
      );
    } else {
      totalIncomeLkr += lkrAmount;
    }
  });

  let biggestSpendCategory: string | null = null;
  let biggestAmount = 0;

  categorySpend.forEach((amount, category) => {
    if (amount > biggestAmount) {
      biggestAmount = amount;
      biggestSpendCategory = category;
    }
  });

  return {
    totalSpentLkr,
    totalIncomeLkr,
    netLkr: totalIncomeLkr - totalSpentLkr,
    biggestSpendCategory,
  };
}

export interface CategoryChartDatum {
  name: string;
  value: number;
  fill: string;
}

const CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#ef4444",
  "#a855f7",
  "#64748b",
];

export function getCategorySpendingData(
  transactions: Transaction[],
  wallets: Wallet[],
  rates: ExchangeRates,
  month = getCurrentMonthKey(),
): CategoryChartDatum[] {
  const walletMap = getWalletMap(wallets);
  const monthTransactions = filterTransactions(transactions, { month }).filter(
    (transaction) => transaction.type === "expense",
  );

  const totals = new Map<string, number>();

  monthTransactions.forEach((transaction) => {
    const wallet = walletMap.get(transaction.walletId);
    if (!wallet) return;

    const lkrAmount = convertToLkr(transaction.amount, wallet.currency, rates);
    totals.set(
      transaction.category,
      (totals.get(transaction.category) ?? 0) + lkrAmount,
    );
  });

  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value: Math.round(value),
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
}

export interface DailySpendingDatum {
  day: string;
  amount: number;
}

export function getDailySpendingData(
  transactions: Transaction[],
  wallets: Wallet[],
  rates: ExchangeRates,
): DailySpendingDatum[] {
  const walletMap = getWalletMap(wallets);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const totals = new Map<string, number>();

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    totals.set(format(day, "EEE"), 0);
  }

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;

    const date = parseISO(transaction.date);
    if (!isWithinInterval(date, { start: weekStart, end: weekEnd })) return;

    const wallet = walletMap.get(transaction.walletId);
    if (!wallet) return;

    const dayKey = format(date, "EEE");
    const lkrAmount = convertToLkr(transaction.amount, wallet.currency, rates);
    totals.set(dayKey, (totals.get(dayKey) ?? 0) + lkrAmount);
  });

  return Array.from(totals.entries()).map(([day, amount]) => ({
    day,
    amount: Math.round(amount),
  }));
}

export interface CsvTransactionRow {
  date: string;
  description: string;
  amount: number;
  type: Transaction["type"];
  category: string;
}

export function parseTransactionCsv(text: string): {
  rows: CsvTransactionRow[];
  skipped: number;
} {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    return { rows: [], skipped: 0 };
  }

  const headers = lines[0]
    .split(",")
    .map((header) => header.trim().toLowerCase());

  const dateIndex = headers.indexOf("date");
  const descriptionIndex = headers.indexOf("description");
  const amountIndex = headers.indexOf("amount");
  const typeIndex = headers.indexOf("type");
  const categoryIndex = headers.indexOf("category");

  if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
    return { rows: [], skipped: lines.length - 1 };
  }

  const rows: CsvTransactionRow[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(",").map((value) => value.trim());
    const amount = Number(values[amountIndex]);

    if (!Number.isFinite(amount)) {
      skipped += 1;
      continue;
    }

    const rawType = typeIndex >= 0 ? values[typeIndex]?.toLowerCase() : "expense";
    const type: Transaction["type"] =
      rawType === "income" ? "income" : "expense";

    const category =
      categoryIndex >= 0 && values[categoryIndex]
        ? values[categoryIndex]
        : "Other";

    const dateValue = values[dateIndex];
    let parsedDate = dateValue;

    try {
      parsedDate = format(parseISO(dateValue), "yyyy-MM-dd");
    } catch {
      const fallback = new Date(dateValue);
      if (Number.isNaN(fallback.getTime())) {
        skipped += 1;
        continue;
      }
      parsedDate = format(fallback, "yyyy-MM-dd");
    }

    rows.push({
      date: parsedDate,
      description: values[descriptionIndex] || "Imported transaction",
      amount: Math.abs(amount),
      type,
      category: TRANSACTION_CATEGORIES.includes(category as TransactionCategory)
        ? category
        : "Other",
    });
  }

  return { rows, skipped };
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

export function isCurrentMonth(monthKey: string): boolean {
  const date = parseISO(`${monthKey}-01`);
  const now = new Date();
  return (
    date >= startOfMonth(now) &&
    date <= endOfMonth(now)
  );
}
