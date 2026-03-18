"use client"

import { useState, useCallback } from "react"

/**
 * Hook condiviso per i form dialog.
 * Centralizza: stato di caricamento, messaggio di errore,
 * e il wrapper per l'esecuzione asincrona del submit.
 *
 * Uso:
 *   const { submitting, error, setError, wrap } = useFormState()
 *
 *   async function handleSubmit(e) {
 *     e.preventDefault()
 *     setError(null)
 *     // validazione sincrona...
 *     await wrap(async () => {
 *       const result = await myAction(...)
 *       if (!result.success) { setError(result.error); return }
 *       onOpenChange(false)
 *       onSuccess?.()
 *     })
 *   }
 */
export function useFormState() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wrap = useCallback(async (fn: () => Promise<void>): Promise<void> => {
    setSubmitting(true)
    try {
      await fn()
    } finally {
      setSubmitting(false)
    }
  }, [])

  return { submitting, error, setError, wrap }
}
