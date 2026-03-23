// composables/useCurrency.ts
// Currency formatting utilities for CashPlow

import { useUserStore } from '~/stores/user'

export const useCurrency = () => {
  const userStore = useUserStore()

  /**
   * Format a number as full currency
   * e.g. 1500000 → "Rp 1.500.000" (if IDR)
   */
  const formatCurrency = (amount: number | string | null | undefined, currencyCode?: string): string => {
    const code = currencyCode || userStore.currency || 'IDR'
    const num = Number(amount ?? 0);
    if (isNaN(num)) return `0`;

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  /**
   * Format a number as full IDR currency (Legacy alias)
   */
  const formatIDR = (amount: number | string | null | undefined): string => {
    return formatCurrency(amount, userStore.currency);
  };

  /**
   * Format a number as compact IDR (Legacy)
   * e.g. 1500000 → "Rp 1,5 jt" | 1500000000 → "Rp 1,5 M"
   */
  const formatCompact = (
    amount: number | string | null | undefined,
    currencyCode?: string
  ): string => {
    const code = currencyCode || userStore.currency || 'IDR'
    const num = Number(amount ?? 0);
    if (isNaN(num)) return `0`;

    const abs = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    const prefix = code === 'IDR' ? 'Rp ' : `${code} `;

    if (abs >= 1_000_000_000) {
      const val = (abs / 1_000_000_000).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      });
      return `${sign}${prefix}${val} M`;
    }

    if (abs >= 1_000_000) {
      const val = (abs / 1_000_000).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      });
      return `${sign}${prefix}${val} jt`;
    }

    if (abs >= 1_000 && code === 'IDR') {
      const val = (abs / 1_000).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      return `${sign}${prefix}${val} rb`;
    }

    return formatCurrency(num, code);
  };

  /**
   * Format a number as plain without symbol
   * e.g. 1500000 → "1.500.000"
   */
  const formatPlain = (amount: number | string | null | undefined): string => {
    const num = Number(amount ?? 0);
    if (isNaN(num)) return "0";

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  /**
   * Parse a formatted string back to number
   */
  const parseCurrency = (value: string): number => {
    const cleaned = value
      .replace(/[A-Za-z\s]/g, "") // Remove any currency symbol or space
      .replace(/\./g, "")
      .replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };
  
  // Legacy alias
  const parseIDR = parseCurrency;

  /**
   * Format with sign prefix for income/expense display
   */
  const formatSigned = (
    amount: number | string | null | undefined,
    type: "income" | "expense" | "transfer" = "expense",
    currencyCode: string = 'IDR'
  ): string => {
    const num = Math.abs(Number(amount ?? 0));
    const formatted = formatCurrency(num, currencyCode);
    if (type === "income") return `+${formatted}`;
    if (type === "expense") return `-${formatted}`;
    return formatted;
  };

  /**
   * Calculate percentage change between two values
   * e.g. (1500, 1000) → "+50%" | (800, 1000) → "-20%"
   */
  const formatPercentChange = (
    current: number,
    previous: number,
  ): { label: string; isPositive: boolean } => {
    if (previous === 0) return { label: "—", isPositive: true };
    const change = ((current - previous) / Math.abs(previous)) * 100;
    const isPositive = change >= 0;
    const label = `${isPositive ? "+" : ""}${change.toFixed(1)}%`;
    return { label, isPositive };
  };

  /**
   * Format a percentage number
   * e.g. 0.75 → "75%" | 1.2 → "120%"
   */
  const formatPercent = (value: number, decimals = 0): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  /**
   * Format budget progress
   * e.g. spent=750000, budget=1000000 → "75%"
   */
  const formatBudgetProgress = (spent: number, budget: number): string => {
    if (budget === 0) return "0%";
    const pct = Math.min((spent / budget) * 100, 100);
    return `${pct.toFixed(0)}%`;
  };

  /**
   * Get progress color class based on percentage
   * 0–60% → emerald | 60–85% → amber | 85–100% → rose
   */
  const getBudgetColor = (
    spent: number,
    budget: number,
  ): {
    bar: string;
    text: string;
    bg: string;
  } => {
    if (budget === 0)
      return { bar: "bg-gray-300", text: "text-gray-500", bg: "bg-gray-100" };
    const pct = (spent / budget) * 100;

    if (pct >= 100) {
      return {
        bar: "bg-rose-500",
        text: "text-rose-500",
        bg: "bg-rose-50 dark:bg-rose-950/30",
      };
    }
    if (pct >= 85) {
      return {
        bar: "bg-amber-500",
        text: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/30",
      };
    }
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    };
  };

  return {
    formatIDR,
    formatCompact,
    formatPlain,
    parseIDR,
    formatSigned,
    formatPercentChange,
    formatPercent,
    formatBudgetProgress,
    getBudgetColor,
  };
};
