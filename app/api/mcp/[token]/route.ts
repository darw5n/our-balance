import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

// ─── Auth ──────────────────────────────────────────────────────────────────────

async function getUserIdFromToken(token: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("api_tokens")
    .select("user_id")
    .eq("token", token)
    .single()
  return data?.user_id ?? null
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

async function handleCreateTransaction(
  args: Record<string, unknown>,
  userId: string
) {
  const { amount, type, date, description, category_name, scope } = args

  if (!amount || !type || !date) {
    return {
      content: [{ type: "text", text: "Errore: i campi amount, type e date sono obbligatori." }],
      isError: true,
    }
  }

  let formattedDate: string
  try {
    const d = new Date(String(date))
    if (isNaN(d.getTime())) throw new Error()
    formattedDate = d.toISOString().split("T")[0]
  } catch {
    return {
      content: [{ type: "text", text: "Errore: formato data non valido. Usa YYYY-MM-DD." }],
      isError: true,
    }
  }

  const admin = createAdminClient()

  let category_id: string | null = null
  if (category_name) {
    const { data: cat } = await admin
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", `%${String(category_name)}%`)
      .limit(1)
      .single()
    category_id = cat?.id ?? null
  }

  const { data, error } = await admin
    .from("transactions")
    .insert({
      user_id: userId,
      amount: Number(amount),
      type: String(type),
      date: formattedDate,
      description: description ? String(description) : null,
      category_id,
      status: "confirmed",
      scope: scope ? String(scope) : "personal",
    })
    .select("id")
    .single()

  if (error) {
    return {
      content: [{ type: "text", text: `Errore durante il salvataggio: ${error.message}` }],
      isError: true,
    }
  }

  const typeLabel = type === "expense" ? "Spesa" : "Entrata"
  const amountStr = `€${Number(amount).toFixed(2)}`
  const desc = description ? ` — ${description}` : ""
  const catMsg = !category_id && category_name ? " (categoria non trovata, salvata senza)" : ""

  return {
    content: [
      {
        type: "text",
        text: `✅ ${typeLabel} creata: ${amountStr}${desc} del ${formattedDate}${catMsg}. Ora visibile in OurBalance.`,
      },
    ],
  }
}

async function handleGetCategories(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("categories")
    .select("name, type, group_name")
    .eq("user_id", userId)
    .order("group_name", { ascending: true })
    .order("name", { ascending: true })

  if (error || !data) {
    return {
      content: [{ type: "text", text: "Errore nel recupero delle categorie." }],
      isError: true,
    }
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const userId = await getUserIdFromToken(token)
  if (!userId) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Unauthorized: token non valido." },
      },
      { status: 401 }
    )
  }

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
    const toolName = (mcpParams as { name?: string })?.name
    const toolArgs = (mcpParams as { arguments?: Record<string, unknown> })?.arguments ?? {}

    let result
    if (toolName === "create_transaction") {
      result = await handleCreateTransaction(toolArgs, userId)
    } else if (toolName === "get_categories") {
      result = await handleGetCategories(userId)
    } else {
      result = {
        content: [{ type: "text", text: `Tool '${toolName}' non esistente.` }],
        isError: true,
      }
    }

    return NextResponse.json({ jsonrpc: "2.0", id, result })
  }

  return NextResponse.json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found" },
  })
}
