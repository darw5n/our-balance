"use client"

import { useState, useRef, useEffect } from "react"
import * as Popover from "@radix-ui/react-popover"
import { ChevronDown, Search } from "lucide-react"
import { buildGroupedOptions } from "@/components/dashboard/add-transaction-dialog"
import type { CategoryOption } from "@/components/dashboard/add-transaction-dialog"

type CategoryComboboxProps = {
  categories: CategoryOption[]
  txType: string
  value: string
  onChange: (value: string) => void
}

export function CategoryCombobox({ categories, txType, value, onChange }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = categories.find((c) => c.id === value)
  const groups = buildGroupedOptions(categories, txType)

  const filteredFlat = search.trim()
    ? categories.filter(
        (c) =>
          (!c.type || c.type === txType) &&
          c.name.toLowerCase().includes(search.toLowerCase())
      )
    : null

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setSearch("")
    }
  }, [open])

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
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
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          className="z-[200] w-[var(--radix-popover-trigger-width)] rounded-md border border-white/15 bg-zinc-900 shadow-xl outline-none"
        >
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
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
          <div className="max-h-64 overflow-y-auto py-1">
            {/* None */}
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`flex w-full items-center px-3 py-1.5 text-sm hover:bg-white/5 ${
                !value ? "text-zinc-50" : "text-zinc-400"
              }`}
            >
              Nessuna categoria
            </button>

            {filteredFlat ? (
              filteredFlat.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-500">Nessun risultato.</p>
              ) : (
                filteredFlat.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelect(cat.id)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/5 ${
                      value === cat.id ? "text-zinc-50" : "text-zinc-300"
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="flex-1 text-left truncate">{cat.name}</span>
                    {cat.group_name && (
                      <span className="shrink-0 text-xs text-zinc-500">{cat.group_name}</span>
                    )}
                  </button>
                ))
              )
            ) : (
              groups.map((group) => (
                <div key={group.key}>
                  <p className="px-3 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {group.label}
                  </p>
                  {group.items.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelect(cat.id)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/5 ${
                        value === cat.id ? "text-zinc-50" : "text-zinc-300"
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
