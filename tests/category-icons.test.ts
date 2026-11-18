import { describe, expect, it } from "vitest"
import { Tag } from "lucide-react"
import { GROUP_ICONS, getCategoryIcon } from "@/lib/category-icons"

describe("getCategoryIcon", () => {
  it("usa l'icona del gruppo quando il nome non è in elenco", () => {
    expect(getCategoryIcon("nome qualsiasi", "Trasporti")).toBe(GROUP_ICONS.Trasporti)
  })

  it("ricade su Tag senza nome né gruppo noto", () => {
    expect(getCategoryIcon("nome qualsiasi")).toBe(Tag)
    expect(getCategoryIcon("nome qualsiasi", null)).toBe(Tag)
  })

  it("ignora le proprietà ereditate da Object.prototype", () => {
    expect(getCategoryIcon("constructor")).toBe(Tag)
    expect(getCategoryIcon("toString", null)).toBe(Tag)
    expect(getCategoryIcon("nome qualsiasi", "constructor")).toBe(Tag)
    expect(getCategoryIcon("__proto__")).toBe(Tag)
  })
})
