'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Sparkles, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface PaywallEvent extends CustomEvent {
  detail: { session_id?: string }
}

export function PaywallModal() {
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as PaywallEvent
      setSessionId(ev.detail?.session_id)
      setOpen(true)
    }
    window.addEventListener('pivot:paywall', handler)
    return () => window.removeEventListener('pivot:paywall', handler)
  }, [])

  async function handleCheckout(plan: 'one_time' | 'subscription') {
    setLoadingPlan(plan)
    try {
      const { url } = await api.createCheckout(plan, sessionId)
      window.location.href = url
    } catch {
      toast.error('Could not start checkout — try again in a moment.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-pivot-purple" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-pivot-purple">
                      Unlock The Pivot
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground leading-tight">
                    {"You've seen your gaps."}
                    <br />
                    {"Ready to close them?"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Practice all 7 questions, get a custom cheat sheet, and walk in confident.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close paywall"
                  className="text-muted-foreground hover:text-foreground transition-colors ml-4 mt-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Plans */}
              <div className="space-y-3">
                {/* One-time */}
                <button
                  onClick={() => handleCheckout('one_time')}
                  disabled={!!loadingPlan}
                  className="w-full text-left rounded-xl border-2 border-primary p-4 relative hover:bg-primary/5 transition-colors group disabled:opacity-60"
                >
                  <div className="absolute -top-3 left-4">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-0.5 rounded-full">
                      Most popular
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        This interview only
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Full prep for one role, forever
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground font-mono">$14.99</p>
                      <p className="text-xs text-muted-foreground">one-time</p>
                    </div>
                  </div>
                  {loadingPlan === 'one_time' && (
                    <div className="absolute inset-0 rounded-xl bg-card/80 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>

                {/* Subscription */}
                <button
                  onClick={() => handleCheckout('subscription')}
                  disabled={!!loadingPlan}
                  className="w-full text-left rounded-xl border border-border p-4 relative hover:border-primary/50 transition-colors group disabled:opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        Unlimited interviews
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        7-day free trial, cancel anytime
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground font-mono">$29</p>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>
                  </div>
                  {loadingPlan === 'subscription' && (
                    <div className="absolute inset-0 rounded-xl bg-card/80 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              </div>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                {['Stripe checkout', 'Cancel anytime', 'Money-back guarantee'].map((t) => (
                  <span key={t} className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-pivot-teal" /> {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
