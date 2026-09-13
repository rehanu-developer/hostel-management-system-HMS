import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatMonth(monthKey: string) {
  // monthKey like "2026-09"
  const [y, m] = monthKey.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  })
}

export function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}
