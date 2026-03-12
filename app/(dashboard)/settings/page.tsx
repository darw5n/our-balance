import { headers } from "next/headers"
import { getApiTokenInfo } from "@/app/actions/api-tokens"
import { ApiTokenManager } from "@/components/dashboard/api-token-manager"

export default async function SettingsPage() {
  const [tokenInfo, headersList] = await Promise.all([
    getApiTokenInfo(),
    headers(),
  ])

  const host = headersList.get("host") ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const mcpUrl = `${protocol}://${host}/api/mcp`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Impostazioni</h1>
        <p className="text-xs text-zinc-400">Gestisci le integrazioni del tuo account.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur">
        <ApiTokenManager tokenInfo={tokenInfo} mcpUrl={mcpUrl} />
      </div>
    </div>
  )
}
