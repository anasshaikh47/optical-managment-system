import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "₹"): string {
  return `${currency}${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface ExpiryStatus {
  status: "EXPIRED" | "EXPIRING_SOON" | "VALID";
  label: string;
  daysRemaining: number;
  badgeClass: string;
  color: "rose" | "amber" | "emerald";
}

export function getExpiryStatus(expiryStr?: string | null): ExpiryStatus {
  if (!expiryStr) {
    return {
      status: "VALID",
      label: "Valid Batch",
      daysRemaining: 999,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
      color: "emerald",
    };
  }

  let expiryDate: Date;
  const trimmed = expiryStr.trim();

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (!isNaN(month) && !isNaN(year)) {
      const fullYear = year < 100 ? 2000 + year : year;
      // End of expiry month
      expiryDate = new Date(fullYear, month, 0, 23, 59, 59);
    } else {
      expiryDate = new Date();
    }
  } else if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      expiryDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      expiryDate = new Date(trimmed);
    }
  } else {
    expiryDate = new Date(trimmed);
  }

  if (isNaN(expiryDate.getTime())) {
    return {
      status: "VALID",
      label: expiryStr,
      daysRemaining: 999,
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-300",
      color: "emerald",
    };
  }

  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: "EXPIRED",
      label: "Expired",
      daysRemaining,
      badgeClass: "bg-rose-100 text-rose-700 border-rose-300",
      color: "rose",
    };
  }

  if (daysRemaining <= 60) {
    return {
      status: "EXPIRING_SOON",
      label: `Near Expiry (${daysRemaining}d)`,
      daysRemaining,
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      color: "amber",
    };
  }

  return {
    status: "VALID",
    label: "Valid",
    daysRemaining,
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-300",
    color: "emerald",
  };
}

// Retained for compatibility
export function formatDiopter(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0.00";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}`;
}
