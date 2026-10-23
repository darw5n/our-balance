import { describe, expect, it } from "vitest"
import { unmetPasswordRules } from "@/lib/password-rules"

const unmet = (password: string) => unmetPasswordRules(password).map((rule) => rule.id)

describe("unmetPasswordRules", () => {
  it("una password che rispetta tutte le regole passa", () => {
    expect(unmet("Password123!")).toEqual([])
  })

  it("dice cosa manca", () => {
    expect(unmet("ciao123")).toEqual(["length", "upper", "symbol"])
    expect(unmet("")).toEqual(["length", "lower", "upper", "digit", "symbol"])
  })

  it("conta come simboli solo quelli accettati da Supabase", () => {
    expect(unmet("Password123€")).toEqual(["symbol"])
    expect(unmet("Password123~")).toEqual([])
    expect(unmet("Password123\\")).toEqual(["symbol"])
  })
})
