"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, CheckCircle, Users } from "lucide-react"
import { getCategoryIcon } from "@/lib/category-icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  const isCurrentYear = date.getFullYear() === today.getFullYear()
  return date
    .toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      ...(isCurrentYear ? {} : { year: "numeric" }),
    })
    .replace(".", "")
    .toUpperCase()
}

function groupByDate(transactions: Transaction[]): { label: string; transactions: Transaction[] }[] {
  const groups: { label: string; transactions: Transaction[] }[] = []
  const seen = new Map<string, number>()

  for (const tx of transactions) {
    const key = tx.date ?? "no-date"
    const label = getDateLabel(tx.date)
    if (!seen.has(key)) {
      seen.set(key, groups.length)
      groups.push({ label, transactions: [] })
    }
    groups[seen.get(key)!].transactions.push(tx)
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
    return <p className="font-sans text-xs text-text-2 py-6 text-center">Nessuna transazione trovata.</p>
  }

  const groups = groupByDate(transactions)
  const catMap = new Map(categories.map((c) => [c.id, c]))

  return (
    <>
      {/* Bulk selection bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-[14px] border border-expense/30 bg-expense-subtle px-4 py-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 cursor-pointer rounded border-border-strong bg-surface-1 accent-income"
            aria-label="Seleziona tutto"
          />
          <span className="font-sans text-xs text-expense-fg">
            {selected.size} {selected.size === 1 ? "selezionata" : "selezionate"}
          </span>
          <Button
            size="sm"
            className="ml-auto h-7 rounded-full bg-expense text-xs text-white hover:opacity-90"
            onClick={handleBulkDelete}
            disabled={deleting}
          >
            Elimina selezionate
          </Button>
        </div>
      )}

      {/* Card-list grouped by date */}
      <div className="space-y-1">
        {groups.map((group) => (
          <React.Fragment key={group.label}>
            {/* Date group label */}
            <p className="mt-4 mb-1.5 px-1 font-sans text-[10px] font-semibold tracking-[0.12em] text-text-3 first:mt-0">
              {group.label}
            </p>

            {/* Card containing all transactions for this date */}
            <div className="overflow-hidden rounded-[22px] border border-border-subtle bg-surface-1">
              {group.transactions.map((tx, index) => {
                const amount = Math.abs(tx.amount ?? 0)
                const cat = tx.category_id ? catMap.get(tx.category_id) : undefined
                const categoryName = cat?.name ?? "—"
                const hasEmoji = !!cat?.emoji
                const CatIcon = getCategoryIcon(categoryName)
                const time = formatTime(tx.created_at)
                const isLast = index === group.transactions.length - 1

                return (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      !isLast ? "border-b border-border-subtle" : ""
                    } ${selected.has(tx.id) ? "bg-accent-brand-bg/30" : "hover:bg-surface-2/50"}`}
                  >
                    {/* Checkbox — visible on md+ */}
                    <input
                      type="checkbox"
                      checked={selected.has(tx.id)}
                      onChange={() => toggleOne(tx.id)}
                      className="hidden h-4 w-4 cursor-pointer rounded border-border-strong bg-surface-1 accent-income md:block flex-shrink-0"
                      aria-label="Seleziona riga"
                    />

                    {/* Category avatar */}
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-[19px]">
                      {hasEmoji
                        ? cat!.emoji
                        : <CatIcon className="h-5 w-5 text-text-3" />
                      }
                    </div>

                    {/* Description + meta */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-sm font-medium text-text-1">
                        {tx.description || categoryName}
                      </p>
                      <p className="mt-0.5 font-sans text-[11px] text-text-3">
                        {categoryName}
                        {time ? ` · ${time}` : ""}
                        {tx.status === "pending" && (
                          <span className="ml-1.5 font-medium text-pending-fg">· In attesa</span>
                        )}
                        {tx.scope === "family" && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-shared">
                            <Users className="h-2.5 w-2.5" />
                            comune
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Amount */}
                    <span
                      className={`flex-shrink-0 font-sans text-sm font-semibold ${
                        tx.type === "income" ? "text-income-fg" : "text-text-1"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "−"}{formatCurrency(amount)}
                    </span>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0 text-text-3 hover:text-text-1"
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
                )
              })}
            </div>
          </React.Fragment>
        ))}
      </div>

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
