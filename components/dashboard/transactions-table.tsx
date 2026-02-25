"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { deleteTransaction, bulkDeleteTransactions } from "@/app/actions/transactions"
import { EditTransactionDialog, type Transaction } from "@/components/dashboard/edit-transaction-dialog"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"
import { useToast } from "@/components/ui/toast-provider"
import { useConfirm } from "@/components/ui/confirm-dialog"

type TransactionsTableProps = {
  transactions: Transaction[]
  categories: CategoryOption[]
}

export function TransactionsTable({ transactions, categories }: TransactionsTableProps) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const allSelected = transactions.length > 0 && selected.size === transactions.length

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(transactions.map((tx) => tx.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleEdit(tx: Transaction) {
    setEditingTx(tx)
    setEditOpen(true)
  }

  async function handleDelete(tx: Transaction) {
    const ok = await confirm({ message: "Eliminare questa transazione?", destructive: true, confirmLabel: "Elimina" })
    if (!ok) return
    setDeleting(true)
    try {
      const result = await deleteTransaction(tx.id)
      if (!result.success) {
        toast(result.error ?? "Errore durante l'eliminazione.", "error")
        return
      }
      toast("Transazione eliminata.", "success")
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  async function handleBulkDelete() {
    const count = selected.size
    const ok = await confirm({
      message: `Eliminare ${count} ${count === 1 ? "transazione" : "transazioni"}?`,
      destructive: true,
      confirmLabel: "Elimina",
    })
    if (!ok) return
    setDeleting(true)
    try {
      const result = await bulkDeleteTransactions([...selected])
      if (!result.success) {
        toast(result.error ?? "Errore durante l'eliminazione.", "error")
        return
      }
      toast(`${count} ${count === 1 ? "transazione eliminata" : "transazioni eliminate"}.`, "success")
      setSelected(new Set())
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  function handleExportCSV() {
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
    const rows = [
      ["Data", "Descrizione", "Tipo", "Importo", "Stato", "Categoria"],
      ...transactions.map((tx) => [
        tx.date ? new Date(tx.date).toLocaleDateString("it-IT") : "",
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

  if (transactions.length === 0) {
    return <p className="text-xs text-zinc-400">Nessuna transazione trovata.</p>
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 border-white/15 bg-transparent text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          onClick={handleExportCSV}
        >
          <Download className="h-3.5 w-3.5" />
          Esporta CSV
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-2">
          <span className="text-xs text-rose-300">
            {selected.size} {selected.size === 1 ? "selezionata" : "selezionate"}
          </span>
          <Button
            size="sm"
            className="ml-auto h-7 bg-rose-500 text-xs text-white hover:bg-rose-400"
            onClick={handleBulkDelete}
            disabled={deleting}
          >
            Elimina selezionate
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="cursor-pointer accent-emerald-500"
                aria-label="Seleziona tutto"
              />
            </TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Descrizione</TableHead>
            <TableHead className="text-right">Importo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const dateValue = tx.date ?? tx.created_at
            const dateLabel = dateValue
              ? new Date(dateValue).toLocaleDateString("it-IT")
              : "-"
            const amount = tx.amount ?? 0
            const formattedAmount = formatCurrency(amount)

            return (
              <TableRow key={tx.id} data-selected={selected.has(tx.id) ? "true" : undefined}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(tx.id)}
                    onChange={() => toggleOne(tx.id)}
                    className="cursor-pointer accent-emerald-500"
                    aria-label="Seleziona riga"
                  />
                </TableCell>
                <TableCell>{dateLabel}</TableCell>
                <TableCell className="max-w-[220px] truncate text-xs text-zinc-200">
                  {tx.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <span className={tx.type === "expense" ? "text-rose-400" : "text-emerald-400"}>
                    {formattedAmount}
                  </span>
                </TableCell>
                <TableCell className="text-xs capitalize text-zinc-300">
                  {tx.type || "-"}
                </TableCell>
                <TableCell className="text-xs capitalize text-zinc-300">
                  {tx.status || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-zinc-50"
                      onClick={() => handleEdit(tx)}
                      aria-label="Modifica"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-rose-400"
                      onClick={() => handleDelete(tx)}
                      disabled={deleting}
                      aria-label="Elimina"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <EditTransactionDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditingTx(null)
        }}
        transaction={editingTx}
        categories={categories}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
