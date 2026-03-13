"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

type Props = {
  id?: string
  value: string        // YYYY-MM-DD
  onChange: (iso: string) => void
  required?: boolean
  className?: string
}

/** Converts YYYY-MM-DD → dd/mm/yyyy */
function toDisplay(iso: string): string {
  if (!iso) return ""
  const parts = iso.slice(0, 10).split("-")
  if (parts.length !== 3) return ""
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

/** Converts dd/mm/yyyy → YYYY-MM-DD, returns "" if invalid */
function toISO(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ""
  const [, d, m, y] = match
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  if (isNaN(date.getTime())) return ""
  if (date.getUTCMonth() !== Number(m) - 1) return "" // invalid day for month
  return `${y}-${m}-${d}`
}

/** Auto-inserts slashes while the user types: 13031990 → 13/03/1990 */
function autoFormat(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function DateInput({ id, value, onChange, required, className }: Props) {
  const [raw, setRaw] = useState(() => toDisplay(value))

  // Sync display when external value changes (e.g. dialog reopen)
  useEffect(() => {
    setRaw(toDisplay(value))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = autoFormat(e.target.value)
    setRaw(formatted)
    const iso = toISO(formatted)
    if (iso) onChange(iso)
  }

  function handleBlur() {
    // Reset to last valid value if incomplete
    const iso = toISO(raw)
    if (!iso) setRaw(toDisplay(value))
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="gg/mm/aaaa"
      value={raw}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      className={className}
      maxLength={10}
    />
  )
}
