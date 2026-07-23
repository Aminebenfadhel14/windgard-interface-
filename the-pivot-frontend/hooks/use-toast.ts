'use client'

import { useState, useCallback, useEffect } from 'react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface ToastOptions {
  type?: ToastVariant
  variant?: ToastVariant
  title?: string
  description?: string
  duration?: number
}

let listeners: Array<(toast: Toast) => void> = []

export function toastEmit(toast: Omit<Toast, 'id'>) {
  const t: Toast = { ...toast, id: Math.random().toString(36).slice(2) }
  listeners.forEach((l) => l(t))
}

function toastFn(opts: ToastOptions | string) {
  if (typeof opts === 'string') {
    toastEmit({ message: opts, variant: 'info' })
    return
  }
  const variant = opts.variant ?? opts.type ?? 'info'
  const message = [opts.title, opts.description].filter(Boolean).join(' — ')
  toastEmit({ message, variant, duration: opts.duration })
}

toastFn.success = (message: string, duration = 4000) =>
  toastEmit({ message, variant: 'success', duration })
toastFn.error = (message: string, duration = 5000) =>
  toastEmit({ message, variant: 'error', duration })
toastFn.info = (message: string, duration = 4000) =>
  toastEmit({ message, variant: 'info', duration })
toastFn.warning = (message: string, duration = 4000) =>
  toastEmit({ message, variant: 'warning', duration })

export const toast = toastFn

export function useToastStore() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, t.duration ?? 4000)
    }
    listeners.push(handler)
    return () => {
      listeners = listeners.filter((l) => l !== handler)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, dismiss }
}
