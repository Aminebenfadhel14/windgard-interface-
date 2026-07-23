'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Check, X, Sparkles, Star, Users, TrendingUp, Mail, Globe
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { api, MOCK_SESSION_ID } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// ── Analyzing overlay ────────────────────────────────────────────
const STAGES = [
  'Reading your resume...',
  'Analyzing the job requirements...',
  'Mapping your experience gaps...',
  'Crafting your practice questions...',
  "Building your game plan...",
]

function AnalyzingOverlay({ visible }: { visible: boolean }) {
  const [stageIdx, setStageIdx] = useState(0)

  useState(() => {
    if (!visible) return
    let i = 0
    const iv = setInterval(() => {
      i++
      if (i >= STAGES.length - 1) clearInterval(iv)
      else setStageIdx(i)
    }, 700)
    return () => clearInterval(iv)
  })

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 px-4"
        >
          {/* Pulsing logo */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pivot-purple to-pivot-purple-soft flex items-center justify-center shadow-xl shadow-pivot-purple/30"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">Analyzing your background</h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={stageIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-muted-foreground text-sm"
              >
                {STAGES[stageIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full score-bar-fill"
              animate={{ width: `${((stageIdx + 1) / STAGES.length) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Auth gate ────────────────────────────────────────────────────
function AuthGate({
  onAuth,
  mockMode,
}: {
  onAuth: () => void
  mockMode: boolean
}) {
  const { signInWithMagicLink, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithMagicLink(email)
      if (mockMode) {
        onAuth()
      } else {
        setSent(true)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not send magic link.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    try {
      await signInWithGoogle()
      if (mockMode) onAuth()
    } catch {
      toast.error('Could not start Google sign-in.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-pivot-teal/30 bg-pivot-teal/5 p-4 text-center space-y-1"
      >
        <Mail className="w-6 h-6 text-pivot-teal mx-auto" />
        <p className="font-semibold text-foreground text-sm">Check your inbox!</p>
        <p className="text-xs text-muted-foreground">
          {"We've sent a magic link to"} <strong>{email}</strong>.{' '}
          Click it to jump right back here.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 mt-4">
        <p className="text-sm font-medium text-foreground">
          {"Almost there — just sign in first"}
        </p>
        {mockMode && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <span className="font-semibold text-pivot-amber">Demo mode:</span> Click any option
            below to continue as a demo user.
          </p>
        )}
        <form onSubmit={handleMagicLink} className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 text-sm px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="btn-gradient px-4 py-2 rounded-full text-sm font-semibold"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Send link'
            )}
          </button>
        </form>
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <hr className="flex-1 border-border" />
        </div>
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-border hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
        >
            <Globe className="w-4 h-4" />
          Continue with Google
        </button>
      </div>
    </motion.div>
  )
}

// ── Trust badges ─────────────────────────────────────────────────
const TRUST = [
  { icon: Users, label: '3,200+ job seekers coached' },
  { icon: Star, label: '4.9/5 average rating' },
  { icon: TrendingUp, label: '82% get the offer' },
]

// ── Main page ────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [resume, setResume] = useState<File | null>(null)
  const [jd, setJd] = useState('')
  const [consent, setConsent] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const isValid = resume !== null && jd.trim().length >= 50

  // Drop zone
  const onDrop = useCallback((accepted: File[], rejected: File[]) => {
    if (rejected.length > 0) {
      toast.error('Please upload a PDF or DOCX file under 5 MB.')
      return
    }
    setResume(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
  })

  async function handleSubmit() {
    if (!isValid) return

    if (!user) {
      setShowAuth(true)
      return
    }

    await startAnalysis()
  }

  async function startAnalysis() {
    setShowAuth(false)
    setAnalyzing(true)
    try {
      const { session } = await api.createSession(resume!, jd, consent)
      router.push(`/session/${session.id}`)
    } catch (err: unknown) {
      setAnalyzing(false)
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Something went wrong — try again in a moment.'
      toast.error(msg)
    }
  }

  return (
    <>
      <AnalyzingOverlay visible={analyzing} />
      <Nav />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 pt-12 pb-6 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary mb-2">
              <Sparkles className="w-3 h-3" />
              AI-powered interview prep
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
              Your interview is in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pivot-purple to-pivot-purple-soft">
                3 days.
              </span>
              <br />
              {"Let's make sure you're ready."}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Upload your resume + paste the job description. In minutes, get a
              gap analysis, 7 practice questions with AI feedback, and a
              personalized cheat sheet for the day of.
            </p>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            {TRUST.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="w-4 h-4 text-pivot-teal" />
                {label}
              </div>
            ))}
          </motion.div>

          {/* Upload form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-4"
          >
            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={cn(
                'relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200',
                isDragActive && !isDragReject && 'border-primary bg-primary/5 pulse-border',
                isDragReject && 'border-pivot-red bg-pivot-red/5',
                !isDragActive && !resume && 'border-border hover:border-primary/50 hover:bg-muted/30',
                resume && 'border-pivot-teal bg-pivot-teal/5'
              )}
            >
              <input {...getInputProps()} aria-label="Upload resume" />

              <AnimatePresence mode="wait">
                {resume ? (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-pivot-teal/15 flex items-center justify-center">
                      <Check className="w-5 h-5 text-pivot-teal" />
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-pivot-teal" />
                      <p className="text-sm font-medium text-foreground">{resume.name}</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setResume(null) }}
                        aria-label="Remove file"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(resume.size / 1024).toFixed(0)} KB — click to replace
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      isDragActive ? 'bg-primary/15' : 'bg-muted'
                    )}>
                      <Upload className={cn('w-5 h-5', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {isDragActive ? 'Drop it — ready to go!' : 'Drag your resume here'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or <span className="text-primary underline underline-offset-2">browse files</span>
                      {' '}— PDF or DOCX, up to 5 MB
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* JD textarea */}
            <div className="space-y-1.5">
              <label htmlFor="jd" className="text-sm font-medium text-foreground">
                Job description{' '}
                <span className="text-muted-foreground font-normal">(paste it here)</span>
              </label>
              <textarea
                id="jd"
                rows={6}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description — the more detail, the sharper your prep. Include responsibilities, requirements, and company values if they're listed..."
                className={cn(
                  'w-full px-3 py-3 rounded-xl border bg-background text-sm leading-relaxed resize-none transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                  jd.length > 0 && jd.length < 50
                    ? 'border-pivot-amber focus:border-pivot-amber'
                    : jd.length >= 50
                    ? 'border-pivot-teal focus:border-pivot-teal'
                    : 'border-border focus:border-primary'
                )}
                aria-label="Job description"
              />
              <div className="flex items-center justify-between px-0.5">
                {jd.length > 0 && jd.length < 50 && (
                  <p className="text-xs text-pivot-amber">
                    Add a bit more — at least 50 characters for a sharp analysis
                  </p>
                )}
                {jd.length >= 50 && (
                  <p className="text-xs text-pivot-teal flex items-center gap-1">
                    <Check className="w-3 h-3" /> Looks good
                  </p>
                )}
                {jd.length === 0 && <span />}
                <span className="text-xs text-muted-foreground font-mono ml-auto">
                  {jd.length}
                </span>
              </div>
            </div>

            {/* Consent */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 transition-all flex items-center justify-center',
                    consent ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'
                  )}
                >
                  {consent && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">
                Help improve the coach with my anonymized data{' '}
                <span className="text-foreground/60">(optional — your resume is never shared)</span>
              </span>
            </label>

            {/* Auth gate */}
            <AnimatePresence>
              {showAuth && (
                <AuthGate onAuth={startAnalysis} mockMode={!!(process.env.NEXT_PUBLIC_SUPABASE_URL === undefined || true)} />
              )}
            </AnimatePresence>

            {/* CTA */}
            {!showAuth && (
              <button
                onClick={handleSubmit}
                disabled={!isValid || analyzing}
                className="btn-gradient w-full py-3.5 rounded-full font-semibold text-base flex items-center justify-center gap-2 mt-2"
                aria-label="Analyze my resume and start interview prep"
              >
                {analyzing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze My Resume
                  </>
                )}
              </button>
            )}

            {!isValid && (
              <p className="text-xs text-center text-muted-foreground">
                {!resume && !jd ? 'Upload your resume and paste the job description to get started'
                 : !resume ? 'Upload your resume to continue'
                 : 'Paste the job description (50+ characters) to continue'}
              </p>
            )}
          </motion.div>
        </section>

        {/* Social proof section */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              {
                quote: '"I was terrified going into my Stripe interview. The Pivot showed me exactly where my gaps were — and I closed all of them."',
                name: 'Maria T.',
                role: 'Now a PM at Stripe',
                stars: 5,
              },
              {
                quote: '"I practiced all 7 questions at 11pm the night before. Woke up confident. Got the offer."',
                name: 'James K.',
                role: 'Now an Engineer at Linear',
                stars: 5,
              },
              {
                quote: '"The improved answers were scary-good. It showed me how to say what I already knew, but better."',
                name: 'Sarah M.',
                role: 'Now a Designer at Vercel',
                stars: 5,
              },
            ].map((review) => (
              <div
                key={review.name}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-pivot-amber text-pivot-amber" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {review.quote}
                </p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.name}</p>
                  <p className="text-xs text-pivot-teal">{review.role}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </section>
      </main>
    </>
  )
}
