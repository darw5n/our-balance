"use client"

import { useState, useTransition } from "react"
import { Copy, Check, RefreshCw, Trash2, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateApiToken, revokeApiToken } from "@/app/actions/api-tokens"
import type { ApiTokenInfo } from "@/app/actions/api-tokens"

type Props = {
  tokenInfo: ApiTokenInfo | null
  mcpUrl: string
}

export function ApiTokenManager({ tokenInfo, mcpUrl }: Props) {
  const [info, setInfo] = useState<ApiTokenInfo | null>(tokenInfo)
  const [revealedToken, setRevealedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState<"token" | "url" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCopy(text: string, key: "token" | "url") {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleGenerate() {
    setError(null)
    setRevealedToken(null)
    startTransition(async () => {
      const result = await generateApiToken()
      if (result.success) {
        setRevealedToken(result.token)
        setInfo({ id: "new", created_at: new Date().toISOString(), last_used_at: null })
      } else {
        setError(result.error)
      }
    })
  }

  function handleRevoke() {
    setError(null)
    setRevealedToken(null)
    startTransition(async () => {
      const result = await revokeApiToken()
      if (result.success) {
        setInfo(null)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Intestazione sezione */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-2">
          <Bot className="h-4 w-4 text-shared" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-text-1">Claude MCP</h2>
          <p className="mt-0.5 text-xs text-text-2">
            Collega il tuo account OurBalance a Claude.ai per aggiungere transazioni
            direttamente dalla chat, caricando la foto di uno scontrino.
          </p>
        </div>
      </div>

      {/* URL personale con token incorporato */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-text-2">Il tuo URL MCP personale</p>
          {info && (
            <span className="text-[10px] text-text-3">
              Creato il{" "}
              {new Date(info.created_at).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
              {" · "}
              {info.last_used_at
                ? `usato il ${new Date(info.last_used_at).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "short",
                  })}`
                : "mai usato"}
            </span>
          )}
        </div>

        {revealedToken ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-income/30 bg-income-subtle px-3 py-2">
              <code className="flex-1 truncate text-xs text-income-fg">
                {mcpUrl}/{revealedToken}
              </code>
              <button
                onClick={() => handleCopy(`${mcpUrl}/${revealedToken}`, "url")}
                className="shrink-0 text-income-fg transition-colors hover:opacity-80"
                aria-label="Copia URL"
              >
                {copied === "url" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-pending-fg">
              Copia questo URL ora e incollalo in Claude.ai — non sarà più visibile dopo aver lasciato la pagina.
            </p>
          </div>
        ) : info ? (
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2">
            <code className="flex-1 text-xs text-text-3">{mcpUrl}/ob_••••••••••••••••••••••••</code>
          </div>
        ) : (
          <p className="text-xs text-text-3">Genera un token per ottenere il tuo URL personale.</p>
        )}
      </div>

      {/* Azioni */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={isPending}
          className="bg-shared text-white hover:opacity-90"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          {info ? "Rigenera token" : "Genera token"}
        </Button>

        {info && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRevoke}
            disabled={isPending}
            className="border-border-subtle bg-transparent text-text-2 hover:border-expense/50 hover:text-expense-fg"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Revoca
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {/* Istruzioni */}
      <div className="rounded-xl border border-border-subtle bg-surface-2/30 p-4 space-y-3">
        <p className="text-xs font-medium text-text-1">Come configurare Claude.ai</p>
        <ol className="space-y-1.5 text-xs text-text-2">
          <li>1. Genera il token e copia il tuo URL personale</li>
          <li>
            2. Apri{" "}
            <span className="text-text-1">Claude.ai → Impostazioni → Integrazioni</span>
          </li>
          <li>
            3. Clicca <span className="text-text-1">Aggiungi connettore personalizzato</span>
          </li>
          <li>4. Incolla l&apos;URL nel campo apposito (lascia OAuth vuoto)</li>
          <li>
            5. Carica la foto di uno scontrino in chat e scrivi:{" "}
            <span className="italic text-text-1">&quot;Aggiungi questa spesa a OurBalance&quot;</span>
          </li>
        </ol>
        <p className="text-[11px] text-text-3">
          L&apos;URL contiene il tuo token: trattalo come una password. Chiunque abbia
          l&apos;URL può aggiungere transazioni. Se pensi sia stato esposto, rigeneralo.
        </p>
      </div>
    </div>
  )
}
