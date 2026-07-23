'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, Zap, TrendingUp, ChevronRight, ArrowRight, RotateCcw } from 'lucide-react'
import { Nav } from '@/components/nav'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

// ── Animation variants ─────────────────────────────────────────────
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
}

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn('h-3 rounded shimmer', i === 0 ? 'w-3/5' : i === lines - 1 ? 'w-2/5' : 'w-full')}
        />
      ))}
    </div>
  )
}

function CategoryLabel({ variant }: { variant: 'critical' | 'weak' | 'strength' }) {
  const map = {
    critical: 'bg-pivot-red/10 text-pivot-red border-pivot-red/20',
    weak: 'bg-pivot-amber/10 text-pivot-amber border-pivot-amber/20',
    strength: 'bg-pivot-teal/10 text-pivot-teal border-pivot-teal/20',
  }
  const labels = { critical: 'Critical gap', weak: 'Weak spot', strength: 'Strength' }
  return (
    <span className={cn('inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border', map[variant])}>
      {labels[variant]}
    </span>
  )
}

function GapCard({ variant, children }: { variant: 'critical' | 'weak' | 'strength'; children: React.ReactNode }) {
  const border = {
    critical: 'border-pivot-red/25 bg-pivot-red/[0.04]',
    weak: 'border-pivot-amber/25 bg-pivot-amber/[0.04]',
    strength: 'border-pivot-teal/25 bg-pivot-teal/[0.04]',
  }
  return (
    <motion.div variants={fadeUp} className={cn('rounded-xl border p-4 space-y-3', border[variant])}>
      {children}
    </motion.div>
  )
}

function PracticeLink({ onClick, variant }: { onClick: () => void; variant: 'critical' | 'weak' | 'strength' }) {
  const color = {
    critical: 'text-pivot-red hover:text-pivot-red/75',
    weak: 'text-pivot-amber hover:text-pivot-amber/75',
    strength: 'text-pivot-teal hover:text-pivot-teal/75',
  }
  return (
    <button onClick={onClick} className={cn('flex items-center gap-1 text-xs font-semibold transition-colors shrink-0', color[variant])}>
      Practice this <ChevronRight className="w-3 h-3" />
    </button>
  )
}

export default function GapRadarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id),
    staleTime: 5 * 60 * 1000,
  })

  const session = data?.session
  const gap = session?.gap_analysis

  // Map question text → index for deep-link "Practice this →"
  const qByText = new Map<string, number>()
  session?.questions?.forEach((q, i) => qByText.set(q.text, i))
  function toPractice(likelyQ: string) {
    router.push(`/session/${id}/practice?q=${qByText.get(likelyQ) ?? 0}`)
  }

  return (
    <>
      <Nav showProgress />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38 }}
          className="mb-7"
        >
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-3.5 w-24 shimmer rounded" />
              <div className="h-7 w-56 shimmer rounded" />
              <div className="h-3 w-full shimmer rounded mt-2" />
            </div>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
                Step 2 &mdash; Gap Radar
              </p>
              <h1 className="text-2xl font-bold text-foreground">
                {session?.company_name}
                <span className="text-muted-foreground font-normal mx-2">/</span>
                {session?.job_title}
              </h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">
                {"Here's the honest picture — where you'll be challenged, where you'll shine, and exactly what to say."}
              </p>
            </>
          )}
        </motion.div>

        {/* Error state */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-pivot-red/30 bg-pivot-red/5 p-6 text-center space-y-3 mb-6"
          >
            <AlertCircle className="w-7 h-7 text-pivot-red mx-auto" />
            <p className="text-sm font-semibold text-foreground">{"We couldn't load your session right now."}</p>
            <p className="text-xs text-muted-foreground">Your work is saved — this is just a connection hiccup.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-75 transition-opacity"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-8">
            {[3, 2, 3].map((lines, i) => (
              <div key={i} className="space-y-3">
                <div className="h-3 w-36 shimmer rounded" />
                <SkeletonBlock lines={lines} />
                <SkeletonBlock lines={lines - 1} />
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && gap && (
          <div className="space-y-10">

            {/* Critical */}
            {gap.critical.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-pivot-red shrink-0" />
                  <div>
                    <h2 className="text-sm font-bold text-foreground leading-none">Critical Gaps</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Expect direct probing here — close these first</p>
                  </div>
                </div>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
                  {gap.critical.map((item, i) => (
                    <GapCard key={i} variant="critical">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CategoryLabel variant="critical" />
                          <p className="text-sm font-semibold text-foreground leading-snug">{item.finding}</p>
                        </div>
                        <PracticeLink onClick={() => toPractice(item.likely_question)} variant="critical" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.evidence}</p>
                      <p className="text-xs italic text-pivot-red/80 border-l-2 border-pivot-red/30 pl-3 leading-relaxed">
                        &ldquo;{item.likely_question}&rdquo;
                      </p>
                    </GapCard>
                  ))}
                </motion.div>
              </section>
            )}

            {/* Weak spots */}
            {gap.weak.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-pivot-amber shrink-0" />
                  <div>
                    <h2 className="text-sm font-bold text-foreground leading-none">Weak Spots</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">You have the experience — you just need to tell it better</p>
                  </div>
                </div>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
                  {gap.weak.map((item, i) => (
                    <GapCard key={i} variant="weak">
                      <CategoryLabel variant="weak" />
                      <p className="text-sm font-semibold text-foreground">{item.finding}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-pivot-red/[0.08] border border-pivot-red/15 p-3 space-y-1">
                          <p className="text-[10px] font-bold text-pivot-red uppercase tracking-wide">Before</p>
                          <p className="text-xs text-muted-foreground leading-relaxed italic">&ldquo;{item.example_before}&rdquo;</p>
                        </div>
                        <div className="rounded-lg bg-pivot-teal/[0.08] border border-pivot-teal/15 p-3 space-y-1">
                          <p className="text-[10px] font-bold text-pivot-teal uppercase tracking-wide">After</p>
                          <p className="text-xs text-muted-foreground leading-relaxed italic">&ldquo;{item.example_after}&rdquo;</p>
                        </div>
                      </div>
                    </GapCard>
                  ))}
                </motion.div>
              </section>
            )}

            {/* Strengths */}
            {gap.strengths.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-pivot-teal shrink-0" />
                  <div>
                    <h2 className="text-sm font-bold text-foreground leading-none">Your Strengths</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Own these — they are your competitive edge in this interview</p>
                  </div>
                </div>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
                  {gap.strengths.map((item, i) => (
                    <GapCard key={i} variant="strength">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CategoryLabel variant="strength" />
                          <p className="text-sm font-semibold text-foreground leading-snug">{item.finding}</p>
                        </div>
                        <PracticeLink onClick={() => toPractice(item.likely_question)} variant="strength" />
                      </div>
                      <p className="text-xs italic text-pivot-teal/80 border-l-2 border-pivot-teal/30 pl-3 leading-relaxed">
                        &ldquo;{item.likely_question}&rdquo;
                      </p>
                    </GapCard>
                  ))}
                </motion.div>
              </section>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="pt-2 space-y-3"
            >
              <button
                onClick={() => router.push(`/session/${id}/practice?q=0`)}
                className="btn-gradient w-full py-4 rounded-full font-semibold text-base flex items-center justify-center gap-2"
              >
                Continue to Practice <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-xs text-muted-foreground">
                7 questions tailored to your exact gaps &middot; ~15 min
              </p>
            </motion.div>
          </div>
        )}
      </main>
    </>
  )
}
