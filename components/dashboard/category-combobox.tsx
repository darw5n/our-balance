"use client"

import { useState, useRef, useEffect } from "react"
import * as Popover from "@radix-ui/react-popover"
import { ChevronDown, Search, ArrowLeft } from "lucide-react"
import { buildGroupedOptions } from "@/components/dashboard/add-transaction-dialog"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"

type CategoryComboboxProps = {
  categories: CategoryOption[]
  txType: string
  value: string
  onChange: (value: string) => void
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

function CategoryList({
  categories,
  txType,
  value,
  search,
  onSelect,
}: {
  categories: CategoryOption[]
  txType: string
  value: string
  search: string
  onSelect: (id: string) => void
}) {
  const groups = buildGroupedOptions(categories, txType)

  const filteredFlat = search.trim()
    ? categories.filter(
        (c) =>
          (!c.type || c.type === txType) &&
          c.name.toLowerCase().includes(search.toLowerCase())
      )
    : null

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect("")}
        className={`flex w-full items-center px-4 py-3 text-sm hover:bg-white/5 ${
          !value ? "text-zinc-50" : "text-zinc-400"
        }`}
      >
        Nessuna categoria
      </button>

      {filteredFlat ? (
        filteredFlat.length === 0 ? (
          <p className="px-4 py-3 text-xs text-zinc-500">Nessun risultato.</p>
        ) : (
          filteredFlat.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 ${
                value === cat.id ? "text-zinc-50" : "text-zinc-300"
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-left">{cat.name}</span>
              {cat.group_name && (
                <span className="shrink-0 text-xs text-zinc-500">{cat.group_name}</span>
              )}
            </button>
          ))
        )
      ) : (
        groups.map((group) => (
          <div key={group.key}>
            <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {group.label}
            </p>
            {group.items.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 ${
                  value === cat.id ? "text-zinc-50" : "text-zinc-300"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-left">{cat.name}</span>
              </button>
            ))}
          </div>
        ))
      )}
    </>
  )
}

export function CategoryCombobox({ categories, txType, value, onChange }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  const selected = categories.find((c) => c.id === value)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearch("")
    }
  }, [open])

  // Lock body scroll on mobile when picker is open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [isMobile, open])

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
  }

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-10 w-full items-center justify-between rounded-md border border-white/15 bg-zinc-950 px-3 text-sm text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
    >
      {selected ? (
        <span className="flex items-center gap-2 min-w-0">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: selected.color }}
          />
          <span className="truncate">{selected.name}</span>
        </span>
      ) : (
        <span className="text-zinc-500">Nessuna categoria</span>
      )}
      <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-zinc-400" />
    </button>
  )

  // ── Mobile: full-screen overlay ───────────────────────────────────────────────
  if (isMobile) {
    return (
      <div>
        {trigger}
        {open && (
          <div className="fixed inset-0 z-[300] flex flex-col bg-zinc-950">
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-50"
                aria-label="Chiudi"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-zinc-100">Categoria</span>
            </div>

            {/* Search */}
            <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca categoria..."
                className="flex-1 bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <CategoryList
                categories={categories}
                txType={txType}
                value={value}
                search={search}
                onSelect={handleSelect}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Desktop: popover ──────────────────────────────────────────────────────────
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {trigger}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          side="bottom"
          avoidCollisions={false}
          className="z-[200] flex w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden rounded-md border border-white/15 bg-zinc-900 shadow-xl outline-none"
          style={{ maxHeight: "min(var(--radix-popover-content-available-height), 18rem)" }}
        >
          {/* Search */}
          <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca categoria..."
              className="flex-1 bg-transparent text-sm text-zinc-50 outline-none placeholder:text-zinc-500"
            />
          </div>

          {/* Options */}
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
            onWheel={(e) => e.stopPropagation()}
          >
            <CategoryList
              categories={categories}
              txType={txType}
              value={value}
              search={search}
              onSelect={handleSelect}
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
