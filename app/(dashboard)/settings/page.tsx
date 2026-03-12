import { headers } from "next/headers"
import { getApiTokenInfo } from "@/app/actions/api-tokens"
import { ApiTokenManager } from "@/components/dashboard/api-token-manager"

export default async function SettingsPage() {
  const headersList = await headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const mcpUrl = `${protocol}://${host}/api/mcp`

  let tokenInfo = null
  let configError: string | null = null
  try {
    tokenInfo = await getApiTokenInfo()
  } catch (e) {
    configError = e instanceof Error ? e.message : "Errore di configurazione"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Impostazioni</h1>
        <p className="text-xs text-zinc-400">Gestisci le integrazioni del tuo account.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur">
        {configError ? (
          <p className="text-sm text-rose-400">
            Configurazione incompleta: <code className="text-xs">{configError}</code>
          </p>
        ) : (
          <ApiTokenManager tokenInfo={tokenInfo} mcpUrl={mcpUrl} />
        )}
      </div>
    </div>
  )
}
