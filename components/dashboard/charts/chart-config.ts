/**
 * Costanti condivise per i grafici Recharts della dashboard.
 * Prima erano ridefinite identiche in ogni file chart.
 */

export const AXIS_TICK = { fill: "var(--text-3)", fontSize: 12 }
export const AXIS_LINE = { stroke: "var(--border-subtle)" }
export const TOOLTIP_STYLE = {
  background: "var(--surface-1)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 8,
  color: "var(--text-1)",
  fontSize: 12,
}

/** Mesi abbreviati minuscoli — combaciano con le chiavi di `Intl` month:"short" it-IT. */
export const MONTHS_SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]

/** Mesi abbreviati con iniziale maiuscola — per intestazioni di tabella. */
export const MONTH_LABELS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]

/** Nome esteso del mese, per chiave abbreviata minuscola. */
export const MONTH_FULL: Record<string, string> = {
  gen: "Gennaio", feb: "Febbraio", mar: "Marzo", apr: "Aprile",
  mag: "Maggio", giu: "Giugno", lug: "Luglio", ago: "Agosto",
  set: "Settembre", ott: "Ottobre", nov: "Novembre", dic: "Dicembre",
}
