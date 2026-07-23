'use client'

import { use, Suspense, useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Square, Lightbulb, RotateCcw, ChevronRight, Loader2, AlertCircle,
  Sparkles, CheckCircle2, ArrowRight, Volume2, Play,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { api, MOCK_SESSION_ID } from '@/lib/api'
import { useApi } from '@/hooks/use-api'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Attempt } from '@/lib/api'

// ── Waveform visualizer using AnalyserNode ──────────────────────────
function Waveform({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!analyser || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const data = new Uint8Array(analyser.frequencyBinCount)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(data)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barW = Math.ceil((canvas.width / data.length) * 2.5)
      let x = 0
      for (let i = 0; i < data.length; i++) {
        const h = Math.round((data[i] / 255) * canvas.height)
        // Purple → teal gradient per bar
        const pct = i / data.length
        const r = Math.round(108 + (0 - 108) * pct)
        const g = Math.round(99 + (201 - 99) * pct)
        const b = Math.round(255 + (167 - 255) * pct)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, canvas.height - h, barW - 1, h)
        x += barW + 1
      }
    }

    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [analyser])

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={64}
      className="w-full h-16 rounded-xl bg-muted border border-border"
      aria-hidden="true"
    />
  )
}

// ── Score bar (animated) ─────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground capitalize tracking-wide">{label}</p>
        <p className="font-mono text-xl font-bold text-foreground">{value}</p>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full score-bar-fill rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </motion.div>
  )
}

// ── Category tag ─────────────────────────────────────────────────────
function CategoryTag({ cat }: { cat: 'critical' | 'weak' | 'strength' }) {
  const map = {
    critical: 'bg-pivot-red/10 text-pivot-red border-pivot-red/25',
    weak:     'bg-pivot-amber/10 text-pivot-amber border-pivot-amber/25',
    strength: 'bg-pivot-teal/10 text-pivot-teal border-pivot-teal/25',
  }
  const labels = { critical: 'Critical gap', weak: 'Weak spot', strength: 'Strength' }
  return (
    <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border', map[cat])}>
      {labels[cat]}
    </span>
  )
}

// ── Practice Page ────────────────────────────────────────────
export default function PracticePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = (params.id as string) || MOCK_SESSION_ID
  const qIdx = parseInt(searchParams.get('q') || '0')

  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopping' | 'uploading' | 'success'>('idle')
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [scores, setScores] = useState<any>(null)
  const [improvedAnswer, setImprovedAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(120)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { data: sessionData, isLoading: sessionLoading } = useApi(
    sessionId ? `/api/sessions/${sessionId}` : null
  )

  const session = sessionData?.session
  const question = session?.questions?.[qIdx]
  const totalQuestions = session?.questions?.length || 7

  // ── Initialize recording ────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Audio context for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      const chunks: BlobPart[] = []
      recorder.addEventListener('dataavailable', (e) => {
        chunks.push(e.data)
      })

      recorder.addEventListener('stop', () => {
        const blob = new Blob(chunks, { type: mimeType })
        setRecordedBlob(blob)
      })

      recorder.start()
      setRecordingState('recording')
      setTimeLeft(120)

      // Timer
      let elapsed = 0
      timerRef.current = setInterval(() => {
        elapsed++
        setTimeLeft(120 - elapsed)
        if (elapsed >= 120) {
          recorder.stop()
          setRecordingState('stopping')
          if (timerRef.current) clearInterval(timerRef.current)
        }
      }, 1000)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast({
          type: 'error',
          title: 'Mic access denied',
          description: 'Please enable microphone access in your browser settings and try again.',
        })
      } else {
        toast({
          type: 'error',
          title: 'Recording failed',
          description: 'Please check your microphone and try again.',
        })
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
      setRecordingState('stopping')

      if (timerRef.current) clearInterval(timerRef.current)

      // Clean up stream
      streamRef.current?.getTracks().forEach((track) => track.stop())
      audioContextRef.current?.close()
    }
  }, [recordingState])

  const submitAttempt = useCallback(async () => {
    if (!recordedBlob) return

    setRecordingState('uploading')

    const formData = new FormData()
    formData.append('audio', recordedBlob, `answer-${qIdx}.webm`)
    formData.append('question_index', qIdx.toString())

    try {
      const result = await api.submitAttempt(sessionId, formData)

      setTranscript(result.attempt.transcript || '')
      setScores(result.attempt.scores)
      setImprovedAnswer(result.attempt.improved_answer || '')
      setRecordingState('success')
    } catch (err: any) {
      if (err.code === 'payment_required') {
        // Paywall intercepted by useApi
        toast({
          type: 'info',
          title: 'Unlock premium feedback',
          description: 'Upgrade to see detailed feedback on your responses.',
        })
      } else {
        toast({
          type: 'error',
          title: 'Upload failed',
          description: 'Please check your connection and try again.',
        })
      }
      setRecordingState('idle')
      setRecordedBlob(null)
    }
  }, [recordedBlob, sessionId, qIdx])

  const handleNextQuestion = useCallback(() => {
    if (qIdx < totalQuestions - 1) {
      router.push(`/session/${sessionId}/practice?q=${qIdx + 1}`)
      // Reset state
      setRecordingState('idle')
      setRecordedBlob(null)
      setTranscript('')
      setScores(null)
      setImprovedAnswer('')
    } else {
      // Go to cheat sheet
      router.push(`/session/${sessionId}/cheat-sheet`)
    }
  }, [qIdx, totalQuestions, sessionId, router])

  const handleTryAgain = useCallback(() => {
    setRecordingState('idle')
    setRecordedBlob(null)
    setTranscript('')
    setScores(null)
    setImprovedAnswer('')
  }, [])

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted">Loading question...</p>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">Question not found</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const categoryColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    weak: 'bg-amber-100 text-amber-800 border-amber-300',
    strength: 'bg-green-100 text-green-800 border-green-300',
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav sessionId={sessionId} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Question {qIdx + 1} of {totalQuestions}</h1>
            </div>
            <span className={cn('px-3 py-1 rounded-full text-xs font-semibold border', categoryColors[question.category as keyof typeof categoryColors])}>
              {question.category}
            </span>
          </div>

          {/* Question text */}
          <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
            <p className="text-lg font-semibold text-foreground leading-snug">{question.text}</p>
            {question.tip && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex gap-3">
                <Volume2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-primary/90">{question.tip}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recording state: idle �� recording → success → feedback */}
        <AnimatePresence mode="wait">
          {recordingState === 'idle' && !recordedBlob && (
            <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
              <div className="text-center space-y-2 py-4">
                <p className="text-muted text-sm">Ready to give it a shot?</p>
              </div>

              <button
                onClick={startRecording}
                className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
                >
                  <Mic className="w-4 h-4" />
                </motion.div>
                Start Recording
              </button>
            </motion.div>
          )}

          {recordingState === 'recording' && (
            <motion.div key="recording" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Recording...</p>
                  <p className={cn('text-sm font-mono', timeLeft <= 10 ? 'text-red-600' : 'text-muted')}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </p>
                </div>

                <Waveform analyser={analyserRef.current} />
              </div>

              <button
                onClick={stopRecording}
                className="w-full py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </button>
            </motion.div>
          )}

          {(recordingState === 'stopping' || recordingState === 'uploading') && recordedBlob && !transcript && (
            <motion.div key="stopping" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
              <div className="text-center space-y-2 py-4">
                <p className="text-muted text-sm">Processing your response...</p>
              </div>

              <button
                onClick={submitAttempt}
                disabled={recordingState === 'uploading'}
                className={cn(
                  'w-full py-3 rounded-full font-semibold text-white transition-all flex items-center justify-center gap-2',
                  recordingState === 'uploading'
                    ? 'bg-muted cursor-not-allowed'
                    : 'bg-primary hover:shadow-lg hover:-translate-y-0.5'
                )}
              >
                {recordingState === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Get Feedback
                  </>
                )}
              </button>

              <button
                onClick={handleTryAgain}
                disabled={recordingState === 'uploading'}
                className="w-full py-2 rounded-full border border-border text-foreground font-medium hover:bg-surface transition-colors disabled:opacity-50"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {recordingState === 'success' && transcript && (
            <motion.div key="success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
              {/* Transcript */}
              <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
                <p className="text-xs font-semibold uppercase text-muted">Your transcript</p>
                <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
              </div>

              {/* Scores */}
              {scores && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(scores).map(([key, value]: [string, any]) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-surface rounded-lg border border-border p-3 text-center space-y-1"
                    >
                      <p className="text-xs font-semibold uppercase text-muted capitalize">{key}</p>
                      <p className="text-2xl font-mono font-bold text-primary">{value}/10</p>
                      <div className="h-1 bg-border rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(value / 10) * 100}%` }}
                          transition={{ delay: 0.2, duration: 0.6 }}
                          className="h-full bg-gradient-to-r from-primary to-primary/60"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Improved answer */}
              {improvedAnswer && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase text-green-900">✨ Better approach</p>
                  <p className="text-sm text-green-900 leading-relaxed">{improvedAnswer}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  {qIdx === totalQuestions - 1 ? 'View Cheat Sheet' : 'Next Question'}
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleTryAgain}
                  className="w-full py-2 rounded-full border border-border text-foreground font-medium hover:bg-surface transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div className="h-8" />
      </main>
    </div>
  )
}
