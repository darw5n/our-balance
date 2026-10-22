"use client"

import { useTransition } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast-provider"
import { exportTransactionsCsv } from "@/app/actions/transactions"
import type { TransactionListFilters } from "@/lib/supabase/queries/transaction-list"

type Props = {
  filters: TransactionListFilters
}

/** Esporta tutte le transazioni filtrate: il CSV si prepara sul server, non dalle righe caricate. */
export function ExportCsvButton({ filters }: Props) {
  const toast = useToast()
  const [exporting, startExport] = useTransition()

  function handleExportCSV() {
    startExport(async () => {
      const result = await exportTransactionsCsv(filters)
      if (!result.success) {
        toast(result.error, "error")
        return
      }
      const blob = new Blob(["﻿" + result.csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transazioni_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-[42px] shrink-0 gap-1.5 rounded-full border-border-subtle bg-surface-1 px-4 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1"
      onClick={handleExportCSV}
      disabled={exporting}
      aria-label={exporting ? "Preparo il CSV" : "Esporta CSV"}
    >
      {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <Download className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{exporting ? "Preparo…" : "Esporta CSV"}</span>
    </Button>
  )
}
