import { differenceInDays, parseISO } from "date-fns";
import type { Contact } from "@/lib/types";
import type { FixedDeposit } from "@/lib/types";
import {
  convertCurrencyToLkr,
  type ExchangeRates,
} from "@/lib/finance-utils";
import { countStaleContacts } from "@/lib/contact-utils";

export const FD_MATURING_DAYS = 60;

export function countFdsMaturingSoon(
  fixedDeposits: FixedDeposit[],
  days = FD_MATURING_DAYS,
): number {
  const today = new Date();

  return fixedDeposits.filter((fd) => {
    const remaining = differenceInDays(parseISO(fd.maturityDate), today);
    return remaining >= 0 && remaining <= days;
  }).length;
}

export { countStaleContacts };

export function getRecentContacts(
  contacts: Contact[],
  limit = 5,
): Contact[] {
  return [...contacts]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, limit);
}

export interface FdTimelinePoint {
  id: string;
  bankName: string;
  amountLkr: number;
  maturityDate: string;
  position: number;
  daysRemaining: number;
}

export function getFdTimelinePoints(
  fixedDeposits: FixedDeposit[],
  rates: ExchangeRates,
): FdTimelinePoint[] {
  if (fixedDeposits.length === 0) return [];

  const today = new Date();
  const todayTime = today.getTime();
  const maturities = fixedDeposits.map((fd) =>
    parseISO(fd.maturityDate).getTime(),
  );
  const maxMaturity = Math.max(...maturities);
  const range = maxMaturity - todayTime || 1;

  return fixedDeposits
    .map((fd) => {
      const maturityTime = parseISO(fd.maturityDate).getTime();
      const position = Math.min(
        100,
        Math.max(0, ((maturityTime - todayTime) / range) * 100),
      );

      return {
        id: fd.id ?? fd.bankName,
        bankName: fd.bankName,
        amountLkr: convertCurrencyToLkr(fd.currentBalance, fd.currency, rates),
        maturityDate: fd.maturityDate,
        position,
        daysRemaining: Math.max(
          differenceInDays(parseISO(fd.maturityDate), today),
          0,
        ),
      };
    })
    .sort((a, b) => a.position - b.position);
}
