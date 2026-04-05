"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, CheckCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { deleteTransaction, bulkDeleteTransactions } from "@/app/actions/transactions"
import { EditTransactionDialog, type Transaction } from "@/components/dashboard/edit-transaction-dialog"
import { ConfirmTransactionDialog } from "@/components/dashboard/confirm-transaction-dialog"
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
  const [confirmingTx, setConfirmingTx] = useState<Transaction | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
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

  function handleConfirm(tx: Transaction) {
    setConfirmingTx(tx)
    setConfirmOpen(true)
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

  if (transactions.length === 0) {
    return <p className="text-xs text-text-2">Nessuna transazione trovata.</p>
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-md border border-expense/30 bg-expense-subtle px-4 py-2">
          <span className="text-xs text-expense-fg">
            {selected.size} {selected.size === 1 ? "selezionata" : "selezionate"}
          </span>
          <Button
            size="sm"
            className="ml-auto h-7 bg-expense text-xs text-white hover:bg-expense-fg"
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
            <TableHead className="hidden w-10 md:table-cell">
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
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead className="hidden md:table-cell">Stato</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const dateValue = tx.date ?? tx.created_at
            const dateLabel = formatDate(dateValue)
            const amount = tx.amount ?? 0
            const formattedAmount = formatCurrency(amount)

            return (
              <TableRow key={tx.id} data-selected={selected.has(tx.id) ? "true" : undefined}>
                <TableCell className="hidden md:table-cell">
                  <input
                    type="checkbox"
                    checked={selected.has(tx.id)}
                    onChange={() => toggleOne(tx.id)}
                    className="cursor-pointer accent-emerald-500"
                    aria-label="Seleziona riga"
                  />
                </TableCell>
                <TableCell>{dateLabel}</TableCell>
                <TableCell className="max-w-[160px] truncate text-xs text-text-1 md:max-w-[220px]">
                  {tx.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <span className={tx.type === "expense" ? "text-expense-fg" : "text-income-fg"}>
                    {formattedAmount}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      tx.type === "income"
                        ? "bg-income-subtle text-income-fg"
                        : tx.type === "expense"
                        ? "bg-expense-subtle text-expense-fg"
                        : "bg-surface-3 text-text-2"
                    }`}>
                      {tx.type === "income" ? "Entrata" : tx.type === "expense" ? "Uscita" : tx.type || "-"}
                    </span>
                    {tx.scope === "family" && (
                      <span className="flex items-center gap-0.5 rounded-full bg-shared-subtle px-1.5 py-0.5 text-[10px] font-medium text-shared">
                        <Users className="h-2.5 w-2.5" />
                        comune
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    tx.status === "confirmed"
                      ? "bg-surface-3 text-text-2"
                      : tx.status === "pending"
                      ? "bg-pending-subtle text-pending-fg"
                      : "bg-surface-3 text-text-2"
                  }`}>
                    {tx.status === "confirmed" ? "Confermato" : tx.status === "pending" ? "In attesa" : tx.status || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-text-2 hover:text-text-1" aria-label="Azioni">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[140px]">
                        <DropdownMenuItem onClick={() => handleEdit(tx)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Modifica
                        </DropdownMenuItem>
                        {tx.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleConfirm(tx)} className="text-emerald-400 focus:text-emerald-400">
                            <CheckCircle className="mr-2 h-3.5 w-3.5" />
                            Conferma
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(tx)}
                          disabled={deleting}
                          className="text-expense-fg focus:text-expense-fg"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      <ConfirmTransactionDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setConfirmingTx(null)
        }}
        transaction={confirmingTx}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
