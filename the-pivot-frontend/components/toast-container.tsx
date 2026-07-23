'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useToastStore, type Toast } from '@/hooks/use-toast'

const icons = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0 text-pivot-teal" />,
  error: <AlertCircle className="w-4 h-4 shrink-0 text-pivot-red" />,
  info: <Info className="w-4 h-4 shrink-0 text-primary" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0 text-pivot-amber" />,
}

const borderColors = {
  success: 'border-l-4 border-l-pivot-teal',
  error: 'border-l-4 border-l-pivot-red',
  info: 'border-l-4 border-l-primary',
  warning: 'border-l-4 border-l-pivot-amber',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl bg-card shadow-xl shadow-black/20 border border-border max-w-sm w-full ${borderColors[toast.variant]}`}
    >
      {icons[toast.variant]}
      <p className="text-sm leading-relaxed text-foreground flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
