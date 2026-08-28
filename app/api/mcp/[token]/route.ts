import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { createAdminClient } from "@/lib/supabase-admin"
import { MCP_TOKEN_PREFIX, hashToken } from "@/lib/mcp/token"

// ─── Limiti ────────────────────────────────────────────────────────────────────

const MAX_AMOUNT = 100_000
const RATE_LIMIT = { windowMs: 60_000, max: 20 } // 20 tools/call al minuto per utente
const IDEMPOTENCY_WINDOW_MS = 600_000 // 10 minuti
const MIN_DATE = "2000-01-01"

function maxDate(): string {
  const d = new Date()
  d.setUTCFullYear(d.getUTCFullYear() + 1)
  return d.toISOString().split("T")[0]
}

// JSON con chiavi ordinate ricorsivamente — per una chiave di idempotenza stabile.
function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`
  const keys = Object.keys(value as Record<string, unknown>).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJSON((value as Record<string, unknown>)[k])}`).join(",")}}`
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

type AuthResult = { tokenId: string; userId: string }

async function authenticate(token: string): Promise<AuthResult | null> {
  if (!token.startsWith(MCP_TOKEN_PREFIX)) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from("api_tokens")
    .select("id, user_id")
    .eq("token_hash", hashToken(token))
    .single()

  if (!data) return null

  // Traccia l'ultimo utilizzo (update singolo su indice, veloce).
  await admin
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)

  return { tokenId: data.id, userId: data.user_id }
}

// ─── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "create_transaction",
    description:
      "Crea una nuova transazione (spesa o entrata) in OurBalance. Usa questo tool dopo aver estratto i dati da uno scontrino, ricevuta o documento.",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Importo in euro, numero positivo. Es: 43.20",
        },
        type: {
          type: "string",
          enum: ["expense", "income"],
          description: "'expense' per una spesa, 'income' per un'entrata",
        },
        date: {
          type: "string",
          description: "Data della transazione nel formato YYYY-MM-DD",
        },
        description: {
          type: "string",
          description: "Nome del negozio, servizio o descrizione libera (opzionale)",
        },
        category_name: {
          type: "string",
          description:
            "Nome della categoria (opzionale). Chiama get_categories per vedere quelle disponibili.",
        },
        scope: {
          type: "string",
          enum: ["personal", "family"],
          description:
            "Ambito della spesa. Usa 'family' se l'utente dice 'in comune', 'condivisa', 'nostra', 'famiglia' o simili. Usa 'personal' (default) per spese personali.",
        },
      },
      required: ["amount", "type", "date"],
    },
  },
  {
    name: "get_categories",
    description:
      "Restituisce la lista delle categorie disponibili in OurBalance. Utile per scegliere la categoria giusta prima di creare una transazione.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
]

// ─── Tool handlers ─────────────────────────────────────────────────────────────

type ToolResult = {
  content: { type: string; text: string }[]
  isError?: boolean
  _transactionId?: string
}

function toolError(text: string): ToolResult {
  return { content: [{ type: "text", text }], isError: true }
}

async function handleCreateTransaction(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const { amount, type, date, description, category_name, scope } = args

  // ── Validazione ──
  if (type !== "expense" && type !== "income") {
    return toolError("Errore: 'type' deve essere 'expense' o 'income'.")
  }

  const scopeValue = scope === undefined || scope === null ? "personal" : scope
  if (scopeValue !== "personal" && scopeValue !== "family") {
    return toolError("Errore: 'scope' deve essere 'personal' o 'family'.")
  }

  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > MAX_AMOUNT) {
    return toolError(`Errore: 'amount' deve essere un numero positivo fino a ${MAX_AMOUNT}.`)
  }

  let formattedDate: string
  try {
    const d = new Date(String(date))
    if (isNaN(d.getTime())) throw new Error()
    formattedDate = d.toISOString().split("T")[0]
  } catch {
    return toolError("Errore: formato data non valido. Usa YYYY-MM-DD.")
  }
  if (formattedDate < MIN_DATE || formattedDate > maxDate()) {
    return toolError("Errore: la data è fuori dall'intervallo consentito.")
  }

  const descValue =
    description == null ? null : String(description).trim().slice(0, 200) || null
  const categoryName =
    category_name == null ? null : String(category_name).trim().slice(0, 100) || null

  // ── Insert ──
  const admin = createAdminClient()

  let category_id: string | null = null
  if (categoryName) {
    const { data: cat } = await admin
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", `%${categoryName}%`)
      .limit(1)
      .single()
    category_id = cat?.id ?? null
  }

  const { data, error } = await admin
    .from("transactions")
    .insert({
      user_id: userId,
      amount: amountNum,
      type,
      date: formattedDate,
      description: descValue,
      category_id,
      status: "confirmed",
      scope: scopeValue,
    })
    .select("id")
    .single()

  if (error) {
    return toolError(`Errore durante il salvataggio: ${error.message}`)
  }

  const typeLabel = type === "expense" ? "Spesa" : "Entrata"
  const amountStr = `€${amountNum.toFixed(2)}`
  const desc = descValue ? ` — ${descValue}` : ""
  const catMsg = !category_id && categoryName ? " (categoria non trovata, salvata senza)" : ""

  return {
    content: [
      {
        type: "text",
        text: `✅ ${typeLabel} creata: ${amountStr}${desc} del ${formattedDate}${catMsg}. Ora visibile in OurBalance.`,
      },
    ],
    _transactionId: data.id,
  }
}

async function handleGetCategories(userId: string): Promise<ToolResult> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("categories")
    .select("name, type, group_name")
    .eq("user_id", userId)
    .order("group_name", { ascending: true })
    .order("name", { ascending: true })

  if (error || !data) {
    return toolError("Errore nel recupero delle categorie.")
  }

  const lines = data.map(
    (c) =>
      `- ${c.name} (${c.type === "expense" ? "spesa" : "entrata"}${c.group_name ? ` · ${c.group_name}` : ""})`
  )

  return {
    content: [
      {
        type: "text",
        text: `Categorie disponibili (${data.length}):\n${lines.join("\n")}`,
      },
    ],
  }
}

// ─── MCP Route ─────────────────────────────────────────────────────────────────

type McpRequest = {
  jsonrpc: string
  id: unknown
  method: string
  params?: Record<string, unknown>
}

const MUTATING_TOOLS = new Set(["create_transaction"])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const auth = await authenticate(token)
  if (!auth) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Unauthorized: token non valido." },
      },
      { status: 401 }
    )
  }
  const { userId, tokenId } = auth

  let body: McpRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    })
  }

  const { id, method, params: mcpParams } = body

  if (method === "initialize") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "ourbalance", version: "1.0.0" },
      },
    })
  }

  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 204 })
  }

  if (method === "tools/list") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result: { tools: TOOLS },
    })
  }

  if (method === "tools/call") {
    const admin = createAdminClient()
    const toolName = (mcpParams as { name?: string })?.name
    const toolArgs = (mcpParams as { arguments?: Record<string, unknown> })?.arguments ?? {}

    // ── Rate limit ──
    const windowStart = new Date(Date.now() - RATE_LIMIT.windowMs).toISOString()
    const { count } = await admin
      .from("mcp_request_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStart)
    if ((count ?? 0) >= RATE_LIMIT.max) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          error: { code: -32029, message: "Troppe richieste. Riprova tra un minuto." },
        },
        { status: 429 }
      )
    }

    // ── Idempotenza (solo tool che scrivono) ──
    let idempotencyKey: string | null = null
    if (toolName && MUTATING_TOOLS.has(toolName)) {
      idempotencyKey = createHash("sha256")
        .update(`${userId}|${toolName}|${canonicalJSON(toolArgs)}`)
        .digest("hex")
      const idemWindow = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS).toISOString()
      const { data: prior } = await admin
        .from("mcp_request_log")
        .select("response_text, is_error")
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .gte("created_at", idemWindow)
        .limit(1)
      if (prior?.length) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: prior[0].response_text ?? "" }],
            ...(prior[0].is_error ? { isError: true } : {}),
          },
        })
      }
    }

    // ── Dispatch ──
    let result: ToolResult
    if (toolName === "create_transaction") {
      result = await handleCreateTransaction(toolArgs, userId)
    } else if (toolName === "get_categories") {
      result = await handleGetCategories(userId)
    } else {
      result = toolError(`Tool '${toolName}' non esistente.`)
    }

    // ── Log (serve a idempotenza, rate limit e audit) ──
    const responseText = result.content?.[0]?.text ?? ""
    const { error: logError } = await admin.from("mcp_request_log").insert({
      user_id: userId,
      token_id: tokenId,
      method,
      tool_name: toolName ?? null,
      request_id: id != null ? String(id) : null,
      idempotency_key: idempotencyKey,
      response_text: responseText,
      created_transaction_id: result._transactionId ?? null,
      is_error: !!result.isError,
    })
    // 23505 = chiamata identica concorrente: restituiamo comunque il risultato.
    if (logError && logError.code !== "23505") {
      console.error("[mcp] log insert error:", logError)
    }

    const { _transactionId, ...clientResult } = result
    void _transactionId
    return NextResponse.json({ jsonrpc: "2.0", id, result: clientResult })
  }

  return NextResponse.json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" },
  })
}
