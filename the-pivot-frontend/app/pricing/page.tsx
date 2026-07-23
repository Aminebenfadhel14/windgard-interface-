'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { Nav } from '@/components/nav'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'One-Time Access',
    price: '$14.99',
    period: 'once',
    description: 'Perfect for your next interview',
    features: [
      'Unlimited practice questions',
      'Detailed feedback on responses',
      'Personalized cheat sheet',
      'Download PDF guide',
      '7-day access',
    ],
    highlighted: false,
  },
  {
    name: 'Monthly Prep',
    price: '$29',
    period: '/month',
    description: 'For serious interview prep',
    features: [
      'Unlimited practice sessions',
      'Multiple interview preps',
      'Priority feedback',
      'Monthly strategy session insights',
      'Cancel anytime',
      '7-day free trial',
    ],
    highlighted: true,
  },
]

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<'one_time' | 'subscription' | null>(null)

  const handleCheckout = async (plan: 'one_time' | 'subscription') => {
    setLoadingPlan(plan)
    try {
      const result = await api.checkout({ plan })
      // Redirect to Stripe
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Checkout failed',
        description: 'Please try again.',
      })
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h1 className="text-4xl font-bold text-foreground">Ready to ace it?</h1>
          <p className="text-lg text-muted max-w-lg mx-auto">
            Unlock detailed feedback and your personalized interview cheat sheet.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto"
        >
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={cn(
                'rounded-2xl border p-6 space-y-6 transition-all',
                plan.highlighted
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-secondary/5 ring-1 ring-primary/20 transform md:scale-105'
                  : 'border-border bg-surface hover:border-border'
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-6 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Most popular
                </div>
              )}

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">{plan.name}</h2>
                <p className="text-sm text-muted">{plan.description}</p>
              </div>

              <div className="space-y-1">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <p className="text-sm text-muted">{plan.period}</p>
              </div>

              <button
                onClick={() =>
                  handleCheckout(plan.price.includes('29') ? 'subscription' : 'one_time')
                }
                disabled={loadingPlan !== null}
                className={cn(
                  'w-full py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2',
                  plan.highlighted
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-lg hover:-translate-y-0.5'
                    : 'bg-surface border border-border text-foreground hover:bg-background',
                  loadingPlan !== null && 'opacity-50 cursor-not-allowed'
                )}
              >
                {loadingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get started'
                )}
              </button>

              <div className="space-y-3 border-t border-border pt-6">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto space-y-4 pt-8"
        >
          <h3 className="text-lg font-bold text-foreground">Common questions</h3>
          <div className="space-y-3">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Monthly plans can be cancelled at any time with no penalties.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards through Stripe.',
              },
              {
                q: 'Do I get a refund if I need to cancel?',
                a: 'Monthly plans include a 7-day free trial. After that, refunds are handled per Stripe terms.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="bg-surface border border-border rounded-lg p-4 cursor-pointer group"
              >
                <summary className="font-semibold text-foreground flex items-center justify-between">
                  {faq.q}
                  <span className="text-primary group-open:rotate-180 transition-transform">
                    ›
                  </span>
                </summary>
                <p className="text-sm text-muted mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="h-8" />
      </main>
    </div>
  )
}
