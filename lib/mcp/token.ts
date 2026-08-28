import { createHash } from "crypto"

/** Prefisso dei token API personali (utile ai secret scanner). */
export const MCP_TOKEN_PREFIX = "ob_"

/** Hash sha-256 (hex) usato per confrontare i token senza salvarli in chiaro. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}
