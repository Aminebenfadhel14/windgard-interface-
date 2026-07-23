'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus, Clock, CheckCircle, AlertCircle, Loader2, ArrowRight,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { api, MOCK_SESSION_ID } from '@/lib/api'
import { useApi } from '@/hooks/use-api'
import { cn } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function SessionCard({
  session,
  onClick,
}: {
  session: any
  onClick: () => void
}) {
  const statusIcons = {
    analyzing: <Clock className="w-4 h-4 text-amber-600" />,
    completed: <CheckCircle className="w-4 h-4 text-green-600" />,
  }

  const statusLabels = {
    analyzing: 'In Progress',
    completed: 'Completed',
  }

  const statusColors = {
    analyzing: 'bg-amber-50 text-amber-900 border-amber-200',
    completed: 'bg-green-50 text-green-900 border-green-200',
  }

  const status = session.status as 'analyzing' | 'completed'

  return (
    <motion.button
      variants={item}
      onClick={onClick}
      className="bg-surface border border-border rounded-xl p-4 hover:border-primary/50 transition-all text-left group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {session.company_name}
          </h3>
          <p className="text-sm text-muted mt-1 truncate">{session.job_title}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className={cn('px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1', statusColors[status])}>
              {statusIcons[status]}
              {statusLabels[status]}
            </span>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors shrink-0 mt-1" />
      </div>
    </motion.button>
  )
}

export default function DashboardPage() {
  const router = useRouter()

  const { data: sessionListData, isLoading, error } = useApi('/api/sessions')

  const sessions = sessionListData?.sessions || []

  const handleNewSession = useCallback(() => {
    router.push('/')
  }, [router])

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      router.push(`/session/${sessionId}`)
    },
    [router]
  )

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">My Sessions</h1>
            <p className="text-muted">Track your interview prep progress.</p>
          </div>

          <button
            onClick={handleNewSession}
            className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Start New Session
          </button>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-2">
            <p className="text-red-900 font-medium">Failed to load sessions</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-red-700 hover:text-red-900 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Sessions list */}
        {!isLoading && sessions.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => handleSessionClick(session.id)}
              />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-xl border border-border p-8 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-primary/60" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">No sessions yet</p>
              <p className="text-sm text-muted">
                Start your first interview prep session to see your progress here.
              </p>
            </div>
            <button
              onClick={handleNewSession}
              className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Create session
            </button>
          </motion.div>
        )}

        {/* Spacer */}
        <div className="h-8" />
      </main>
    </div>
  )
}
