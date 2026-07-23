'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Download, Mail, Share2, Loader2, Check, FileText, Star, Lightbulb, HelpCircle,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { Nav } from '@/components/nav'
import { api, MOCK_SESSION_ID } from '@/lib/api'
import { useApi } from '@/hooks/use-api'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function CheatSheetPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = (params.id as string) || MOCK_SESSION_ID

  const [confettiShown, setConfettiShown] = useState(false)
  const [generatingCheatSheet, setGeneratingCheatSheet] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailPrompt, setEmailPrompt] = useState(false)

  const { data: sessionData, isLoading: sessionLoading } = useApi(
    sessionId ? `/api/sessions/${sessionId}` : null
  )

  const { data: cheatSheetData, refetch: refetchCheatSheet } = useApi(null)

  const session = sessionData?.session
  const cheatSheet = cheatSheetData?.cheat_sheet

  useEffect(() => {
    if (!confettiShown && session) {
      setConfettiShown(true)
      // Burst from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
  }, [session, confettiShown])

  const handleGenerateCheatSheet = async () => {
    setGeneratingCheatSheet(true)
    try {
      const result = await api.generateCheatSheet(sessionId)
      toast({
        type: 'success',
        title: 'Cheat sheet ready!',
        description: 'Your personalized guide is prepared.',
      })
      // Trigger refetch to update UI
      await refetchCheatSheet()
    } catch (err: any) {
      if (err.code === 'payment_required') {
        toast({
          type: 'info',
          title: 'Premium feature',
          description: 'Upgrade to unlock your personalized cheat sheet.',
        })
      } else {
        toast({
          type: 'error',
          title: 'Failed to generate',
          description: 'Please try again.',
        })
      }
    } finally {
      setGeneratingCheatSheet(false)
    }
  }

  const handleSendEmail = async () => {
    if (!emailPrompt) {
      setEmailPrompt(true)
      return
    }

    setGeneratingCheatSheet(true)
    try {
      await api.sendCheatSheetEmail(sessionId, undefined)
      setEmailSent(true)
      toast({
        type: 'success',
        title: 'Sent!',
        description: 'Check your email for your cheat sheet.',
      })
      setTimeout(() => setEmailPrompt(false), 2000)
    } catch (err) {
      toast({
        type: 'error',
        title: 'Failed to send',
        description: 'Please try again.',
      })
    } finally {
      setGeneratingCheatSheet(false)
    }
  }

  const handleDownload = async () => {
    if (cheatSheet?.download_url) {
      window.open(cheatSheet.download_url, '_blank')
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav sessionId={sessionId} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Celebration header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-2"
        >
          <p className="text-4xl">🎉</p>
          <h1 className="text-3xl font-bold text-foreground">You did it!</h1>
          <p className="text-muted">
            You've practiced all 7 questions. Here's your personalized game plan.
          </p>
        </motion.div>

        {/* Cheat sheet sections */}
        {cheatSheet && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 bg-surface rounded-xl border border-border p-6"
          >
            {/* Company & Role */}
            <div className="space-y-2 pb-4 border-b border-border">
              <p className="text-sm uppercase font-semibold text-muted">Interview target</p>
              <h2 className="text-2xl font-bold text-foreground">{cheatSheet.company_name}</h2>
              <p className="text-primary font-medium">{cheatSheet.job_title}</p>
            </div>

            {/* Questions they'll ask */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Questions They'll Ask</h3>
              </div>
              <div className="space-y-2">
                {cheatSheet.questions_theyll_ask?.map((q, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 space-y-1">
                    <p className="font-semibold text-sm text-foreground">{q.question}</p>
                    <p className="text-xs text-muted leading-snug">{q.how_to_answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Star stories */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-foreground">Your Star Stories</h3>
              </div>
              <div className="space-y-2">
                {cheatSheet.star_stories?.map((story, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 space-y-1">
                    <p className="font-semibold text-sm text-foreground">{story.title}</p>
                    <p className="text-xs text-muted leading-snug">{story.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Perfect introduction */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Your Opening Line</h3>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-sm text-foreground leading-relaxed">{cheatSheet.perfect_introduction}</p>
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-3 border-t border-border pt-4">
              <p className="font-bold text-foreground">Keywords to Weave In</p>
              <div className="flex flex-wrap gap-2">
                {cheatSheet.keywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Questions to ask */}
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="font-bold text-foreground">Smart Questions to Ask Them</h3>
              <div className="space-y-2">
                {cheatSheet.questions_to_ask?.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                    <p className="text-sm text-foreground leading-snug">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* No cheat sheet yet - generate CTA */}
        {!cheatSheet && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6 text-center space-y-4"
          >
            <FileText className="w-12 h-12 mx-auto text-primary/60" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Generate Your Cheat Sheet</p>
              <p className="text-sm text-muted">Get a personalized PDF guide with all the key info for your interview.</p>
            </div>
            <button
              onClick={handleGenerateCheatSheet}
              disabled={generatingCheatSheet}
              className={cn(
                'px-6 py-2 rounded-full font-medium transition-all',
                generatingCheatSheet
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-white hover:shadow-lg hover:-translate-y-0.5'
              )}
            >
              {generatingCheatSheet ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate Now'
              )}
            </button>
          </motion.div>
        )}

        {/* Action buttons */}
        {cheatSheet && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <button
              onClick={handleDownload}
              className="w-full py-3 rounded-full bg-primary text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={handleSendEmail}
              disabled={generatingCheatSheet || emailSent}
              className={cn(
                'w-full py-2 rounded-full font-medium transition-all flex items-center justify-center gap-2',
                emailSent
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-surface border border-border text-foreground hover:bg-background'
              )}
            >
              {emailSent ? (
                <>
                  <Check className="w-4 h-4" />
                  Sent to your email
                </>
              ) : generatingCheatSheet ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send to Email
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Dashboard link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center pt-4"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-primary hover:underline font-medium"
          >
            View all sessions →
          </button>
        </motion.div>

        {/* Spacer */}
        <div className="h-8" />
      </main>
    </div>
  )
}
