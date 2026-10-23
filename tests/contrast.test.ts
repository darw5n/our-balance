import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

// Contrasto WCAG AA dei token di app/globals.css: il testo piccolo vuole almeno 4,5:1
// su ogni sfondo su cui compare. Un nuovo colore da testo va aggiunto a TEXT_TOKENS.

const TEXT_TOKENS = [
  "text-1",
  "text-2",
  "text-3",
  "muted-foreground",
  "income-fg",
  "expense-fg",
  "pending-fg",
  "accent-brand-fg",
]
const BACKGROUNDS = ["surface-0", "surface-1", "surface-2"]
const AA_TEXT = 4.5

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")

function tokensOf(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`)
  if (start === -1) throw new Error(`Blocco ${selector} non trovato in globals.css`)
  const block = css.slice(start, css.indexOf("\n}", start))
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]))
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const light = tokensOf(":root")
const themes = { chiaro: light, scuro: { ...light, ...tokensOf(".dark") } }

describe.each(Object.entries(themes))("tema %s", (_, tokens) => {
  it.each(TEXT_TOKENS.flatMap((text) => BACKGROUNDS.map((bg) => [text, bg])))(
    "%s su %s ≥ 4,5:1",
    (text, bg) => {
      expect(tokens[text], `token --${text} mancante`).toBeDefined()
      expect(contrast(tokens[text], tokens[bg])).toBeGreaterThanOrEqual(AA_TEXT)
    }
  )
})
