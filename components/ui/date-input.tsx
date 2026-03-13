"use client"

import { useState, useEffect, useRef } from "react"
import { CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Props = {
  id?: string
  /** ISO YYYY-MM-DD */
  value: string
  onChange?: (iso: string) => void
  /** For form GET submissions: adds a hidden <input name={name} value={iso}> */
  name?: string
  required?: boolean
  className?: string
}

/** YYYY-MM-DD → dd/mm/yyyy */
function toDisplay(iso: string): string {
  if (!iso) return ""
  const parts = iso.slice(0, 10).split("-")
  if (parts.length !== 3) return ""
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

/** dd/mm/yyyy → YYYY-MM-DD, returns "" if invalid */
function toISO(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ""
  const [, d, m, y] = match
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  if (isNaN(date.getTime())) return ""
  if (date.getUTCMonth() !== Number(m) - 1) return ""
  return `${y}-${m}-${d}`
}

/** Auto-inserts slashes while typing: 13031990 → 13/03/1990 */
function autoFormat(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function DateInput({ id, value, onChange, name, required, className }: Props) {
  const [raw, setRaw] = useState(() => toDisplay(value))
  const pickerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRaw(toDisplay(value))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = autoFormat(e.target.value)
    setRaw(formatted)
    const iso = toISO(formatted)
    if (iso) onChange?.(iso)
  }

  function handleBlur() {
    const iso = toISO(raw)
    if (!iso) setRaw(toDisplay(value))
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const iso = e.target.value
    if (iso) {
      setRaw(toDisplay(iso))
      onChange?.(iso)
    }
  }

  function openPicker() {
    try {
      pickerRef.current?.showPicker()
    } catch {
      // showPicker() not supported — silently ignore
    }
  }

  return (
    <div className="relative flex items-center">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="gg/mm/aaaa"
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        required={required}
        maxLength={10}
        className={cn("pr-8", className)}
      />

      {/* Calendar icon — opens native picker */}
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        aria-label="Apri calendario"
        className="absolute right-2 text-zinc-400 hover:text-zinc-200"
      >
        <CalendarDays className="h-4 w-4" />
      </button>

      {/* Hidden native date picker — provides the calendar UI */}
      <input
        ref={pickerRef}
        type="date"
        value={value}
        onChange={handlePickerChange}
        tabIndex={-1}
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
      />

      {/* Hidden form field for GET form submissions */}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  )
}
