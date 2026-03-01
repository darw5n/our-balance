import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Add Italian thousands separator (dot) to an integer string */
function groupThousands(intStr: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

/** Italian currency format — e.g. 1.000,50 € */
export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? "-" : ""
  const [intPart, decPart] = Math.abs(amount).toFixed(2).split(".")
  return `${sign}${groupThousands(intPart)},${decPart} €`
}

/** Italian number format without currency symbol — e.g. 1.000,50 */
export function formatAmount(amount: number, decimals = 2): string {
  const sign = amount < 0 ? "-" : ""
  const [intPart, decPart = ""] = Math.abs(amount).toFixed(decimals).split(".")
  const dec = decPart ? `,${decPart}` : ""
  return `${sign}${groupThousands(intPart)}${dec}`
}

/** Format a raw number for editing inside an input (no thousands sep, comma decimal) */
export function formatAmountInput(amount: number): string {
  return amount.toFixed(2).replace(".", ",")
}

/** Compact currency for chart Y-axis: K suffix above 1000 (e.g. "1,5K €"), plain below */
export function formatCurrencyAxis(amount: number): string {
  const sign = amount < 0 ? "-" : ""
  const abs = Math.abs(amount)
  if (abs >= 1000) {
    const k = abs / 1000
    const formatted = k % 1 === 0 ? `${k}K` : `${k.toFixed(1).replace(".", ",")}K`
    return `${sign}${formatted} €`
  }
  return `${sign}${Math.round(abs)} €`
}
