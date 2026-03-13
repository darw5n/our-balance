"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Transaction } from "@/components/dashboard/edit-transaction-dialog"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"

type Props = {
  transactions: Transaction[]
  categories: CategoryOption[]
}

export function ExportCsvButton({ transactions, categories }: Props) {
  if (transactions.length === 0) return null

  function handleExportCSV() {
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
    const rows = [
      ["Data", "Descrizione", "Tipo", "Importo", "Stato", "Categoria"],
      ...transactions.map((tx) => [
        formatDate(tx.date),
        tx.description ?? "",
        tx.type ?? "",
        (tx.amount ?? 0).toString().replace(".", ","),
        tx.status ?? "",
        tx.category_id ? (categoryMap.get(tx.category_id) ?? "") : "",
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transazioni_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 shrink-0 gap-1.5 border-white/15 bg-transparent text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      onClick={handleExportCSV}
    >
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Esporta CSV</span>
    </Button>
  )
}
