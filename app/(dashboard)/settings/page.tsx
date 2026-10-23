import { headers } from "next/headers"
import { getApiTokenInfo } from "@/app/actions/api-tokens"
import { ApiTokenManager } from "@/components/dashboard/api-token-manager"
import { PreferencesForm } from "@/components/dashboard/preferences-form"
import { getUserSettings } from "@/lib/supabase/queries/user-settings"
import { getServerUser } from "@/lib/supabase-server"

export default async function SettingsPage() {
  const headersList = await headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const mcpUrl = `${protocol}://${host}/api/mcp`

  const user = await getServerUser()

  let configError: string | null = null
  // Preferenze e token sono indipendenti: si leggono in parallelo.
  const [settings, tokenInfo] = await Promise.all([
    user
      ? getUserSettings(user.id)
      : { theme: "system" as const, defaultView: "personal" as const },
    getApiTokenInfo().catch((e: unknown) => {
      configError = e instanceof Error ? e.message : "Errore di configurazione"
      return null
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif italic text-[26px] font-semibold text-text-1 leading-tight">Impostazioni</h1>
        <p className="font-sans text-xs text-text-3 mt-1">Gestisci preferenze e integrazioni del tuo account.</p>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-1/50 p-5 backdrop-blur">
        <PreferencesForm settings={settings} />
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-1/50 p-5 backdrop-blur">
        {configError ? (
          <p className="text-sm text-expense-fg">
            Configurazione incompleta: <code className="text-xs">{configError}</code>
          </p>
        ) : (
          <ApiTokenManager tokenInfo={tokenInfo} mcpUrl={mcpUrl} />
        )}
      </div>
    </div>
  )
}
