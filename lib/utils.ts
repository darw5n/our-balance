import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

/** Italian number format without currency symbol — e.g. 1.000,50 */
export function formatAmount(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/** Format a raw number for editing inside an input (no thousands sep, comma decimal) */
export function formatAmountInput(amount: number): string {
  return amount.toFixed(2).replace(".", ",")
}
