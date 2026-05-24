"use client"
import { Plus, Sparkles } from "lucide-react"

export function NlQuickAddBar() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("open-add-transaction"))
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 rounded-[22px] border border-dashed bg-surface-1 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
      style={{ borderColor: "color-mix(in srgb, var(--accent-brand) 30%, transparent)" }}
      aria-label="Aggiungi transazione"
    >
      <Sparkles size={17} className="flex-shrink-0 text-accent-brand" />
      <span className="font-sans text-sm italic text-text-3 flex-1">Aggiungi transazione…</span>
      <div className="flex items-center gap-1 rounded-full bg-accent-brand px-3 py-1.5 text-xs font-semibold text-white">
        <Plus size={11} />
        Aggiungi
      </div>
    </button>
  )
}
