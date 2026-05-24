"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, CheckCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
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

function getDateLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return "Senza data"
  const date = new Date(dateStr + "T00:00:00")
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "OGGI"
  if (date.toDateString() === yesterday.toDateString()) return "IERI"

  return date
    .toLocaleDateString("it-IT", { day: "numeric", month: "short" })
    .replace(".", "")
    .toUpperCase()
}

function groupByDate(transactions: Transaction[]): { label: string; transactions: Transaction[] }[] {
  const groups: { label: string; transactions: Transaction[] }[] = []
  const seen = new Map<string, number>()

  for (const tx of transactions) {
    const label = getDateLabel(tx.date)
    if (!seen.has(label)) {
      seen.set(label, groups.length)
      groups.push({ label, transactions: [] })
    }
    groups[seen.get(label)!].transactions.push(tx)
  }
  return groups
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
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
    setSelected(allSelected ? new Set() : new Set(transactions.map((tx) => tx.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleEdit(tx: Transaction) {
    setEditingTx(tx)
    setEditOpen(true)
  }

  function handleConfirmTx(tx: Transaction) {
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
    return <p className="font-sans text-xs text-text-2">Nessuna transazione trovata.</p>
  }

  const groups = groupByDate(transactions)
  const catMap = new Map(categories.map((c) => [c.id, c]))

  return (
    <>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-[14px] border border-expense/30 bg-expense-subtle px-4 py-2">
          <span className="font-sans text-xs text-expense-fg">
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
                className="cursor-pointer accent-income"
                aria-label="Seleziona tutto"
              />
            </TableHead>
            <TableHead>Descrizione</TableHead>
            <TableHead className="text-right">Importo</TableHead>
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead className="hidden md:table-cell">Stato</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <React.Fragment key={group.label}>
              {/* Date group header */}
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-3 pb-1 pt-5 first:pt-2"
                >
                  <span className="font-sans text-[10px] font-semibold tracking-[0.1em] text-text-3">
                    {group.label}
                  </span>
                </TableCell>
              </TableRow>

              {group.transactions.map((tx) => {
                const amount = Math.abs(tx.amount ?? 0)
                const cat = tx.category_id ? catMap.get(tx.category_id) : undefined
                const emoji = cat?.emoji ?? "💳"
                const categoryName = cat?.name ?? "—"
                const time = formatTime(tx.created_at)

                return (
                  <TableRow key={tx.id} data-selected={selected.has(tx.id) ? "true" : undefined}>
                    <TableCell className="hidden md:table-cell">
                      <input
                        type="checkbox"
                        checked={selected.has(tx.id)}
                        onChange={() => toggleOne(tx.id)}
                        className="cursor-pointer accent-income"
                        aria-label="Seleziona riga"
                      />
                    </TableCell>

                    {/* Emoji avatar + description + meta */}
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-[19px]">
                          {emoji}
                        </div>
                        <div className="min-w-0">
                          <p className="font-sans text-sm font-medium text-text-1 truncate max-w-[130px] md:max-w-[220px]">
                            {tx.description || categoryName}
                          </p>
                          <p className="font-sans text-[11px] text-text-3 mt-0.5">
                            {categoryName}{time ? ` · ${time}` : ""}
                            {tx.scope === "family" && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-shared">
                                <Users className="h-2.5 w-2.5" />
                                comune
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right">
                      <span
                        className={`font-sans text-sm font-semibold ${
                          tx.type === "income" ? "text-income-fg" : "text-text-1"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "−"}{formatCurrency(amount)}
                      </span>
                    </TableCell>

                    {/* Type badge (desktop) */}
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-medium ${
                          tx.type === "income"
                            ? "bg-income-subtle text-income-fg"
                            : tx.type === "expense"
                            ? "bg-expense-subtle text-expense-fg"
                            : "bg-surface-3 text-text-2"
                        }`}
                      >
                        {tx.type === "income" ? "Entrata" : tx.type === "expense" ? "Uscita" : tx.type || "—"}
                      </span>
                    </TableCell>

                    {/* Status badge (desktop) */}
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-medium ${
                          tx.status === "pending"
                            ? "bg-pending-subtle text-pending-fg"
                            : "bg-surface-3 text-text-2"
                        }`}
                      >
                        {tx.status === "confirmed" ? "Confermato" : tx.status === "pending" ? "In attesa" : tx.status || "—"}
                      </span>
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-text-2 hover:text-text-1"
                              aria-label="Azioni"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[140px]">
                            <DropdownMenuItem onClick={() => handleEdit(tx)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Modifica
                            </DropdownMenuItem>
                            {tx.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() => handleConfirmTx(tx)}
                                className="text-income-fg focus:text-income-fg"
                              >
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
            </React.Fragment>
          ))}
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
