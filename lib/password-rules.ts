// Le stesse regole impostate su Supabase (Auth → Email → Password requirements):
// il modulo le mostra prima dell'invio, così l'errore del server non arriva mai a sorpresa.

export const PASSWORD_MIN_LENGTH = 8

// Supabase accetta come simboli solo questi caratteri: una lettera accentata o "€" non contano.
const SUPABASE_SYMBOLS = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~"

export type PasswordRule = { id: string; label: string; test: (password: string) => boolean }

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: `Almeno ${PASSWORD_MIN_LENGTH} caratteri`, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { id: "lower", label: "Una lettera minuscola", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "Una lettera maiuscola", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", label: "Un numero", test: (p) => /[0-9]/.test(p) },
  { id: "symbol", label: "Un simbolo (! ? @ # …)", test: (p) => [...p].some((c) => SUPABASE_SYMBOLS.includes(c)) },
]

/** Regole che la password non rispetta ancora (vuoto se va bene). */
export function unmetPasswordRules(password: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password))
}
