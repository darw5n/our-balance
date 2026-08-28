"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { X } from "lucide-react"

type ToastVariant = "default" | "success" | "error"

type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastContextType = {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, variant: ToastVariant = "default") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[500] flex flex-col gap-2 sm:bottom-6 sm:right-6" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex min-w-[220px] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${
              t.variant === "error"
                ? "border-expense/30 bg-expense-subtle text-expense-fg"
                : t.variant === "success"
                ? "border-income/30 bg-income-subtle text-income-fg"
                : "border-border-subtle bg-surface-1 text-text-1"
            }`}
          >
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="mt-0.5 shrink-0 opacity-60 hover:opacity-100"
              aria-label="Chiudi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext).toast
}
