"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  destructive?: boolean
}

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: async () => false })

type PendingConfirm = {
  open: boolean
  options: ConfirmOptions
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setPending({ open: true, options, resolve })
    })
  }, [])

  function handleClose(value: boolean) {
    pending?.resolve(value)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <Dialog open={pending.open} onOpenChange={(open) => { if (!open) handleClose(false) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pending.options.title ?? "Conferma"}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-text-2">{pending.options.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border-subtle bg-transparent text-text-2 hover:bg-surface-hover"
                onClick={() => handleClose(false)}
              >
                Annulla
              </Button>
              <Button
                size="sm"
                className={
                  pending.options.destructive
                    ? "bg-expense text-white hover:opacity-90"
                    : "bg-accent-brand text-white hover:opacity-90"
                }
                onClick={() => handleClose(true)}
              >
                {pending.options.confirmLabel ?? "Conferma"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext).confirm
}
