import { Check, Circle } from "lucide-react"
import { PASSWORD_RULES } from "@/lib/password-rules"

/** Regole della password, spuntate mentre si scrive. Collegata al campo con aria-describedby. */
export function PasswordChecklist({ id, password }: { id: string; password: string }) {
  return (
    <ul id={id} className="space-y-0.5 pt-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password)
        return (
          // Il testo resta nel colore pieno (contrasto AA in entrambi i temi): lo stato lo dicono
          // forma e colore dell'icona, più il testo nascosto per i lettori di schermo.
          <li key={rule.id} className="flex items-center gap-1.5 text-xs text-text-1">
            {met ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-income-fg" aria-hidden="true" />
            ) : (
              <Circle className="h-3 w-3 shrink-0 text-text-2" aria-hidden="true" />
            )}
            {rule.label}
            <span className="sr-only">{met ? ": fatto" : ": manca"}</span>
          </li>
        )
      })}
    </ul>
  )
}
