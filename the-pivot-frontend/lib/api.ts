/**
 * The Pivot — API client
 * MOCK_API=true: returns fixture data without network calls
 * All real fetch logic is preserved and runs when MOCK_API=false
 */

import {
  MOCK_SESSION,
  MOCK_SESSION_ID,
  MOCK_SESSIONS,
  MOCK_ATTEMPT,
  MOCK_CHEAT_SHEET,
} from './mock-data'

export { MOCK_SESSION_ID }

// ── Toggle ──────────────────────────────────────────────────────
export const MOCK_API = false
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

// ── Types ───────────────────────────────────────────────────────
export interface ApiError {
  code: string
  message: string
  status: number
}

export interface Session {
  id: string
  company_name: string
  job_title: string
  status: string
  created_at?: string
  gap_analysis?: {
    critical: Array<{ finding: string; evidence: string; likely_question: string }>
    weak: Array<{ finding: string; example_before: string; example_after: string }>
    strengths: Array<{ finding: string; likely_question: string }>
  }
  questions?: Array<{ text: string; category: 'critical' | 'weak' | 'strength'; tip: string }>
}

export interface Attempt {
  question_index: number
  transcript: string
  scores: { clarity: number; relevance: number; structure: number; confidence: number }
  improved_answer: string
  summary?: string
  created_at?: string
}

export interface CheatSheet {
  company_name: string
  job_title: string
  questions_theyll_ask: Array<{ question: string; how_to_answer: string }>
  star_stories: Array<{ title: string; summary: string }>
  perfect_introduction: string
  keywords: string[]
  questions_to_ask: string[]
}

// ── Paywall event ───────────────────────────────────────────────
export function emitPaywall(sessionId?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pivot:paywall', { detail: { session_id: sessionId } })
    )
  }
}

// ── Token getter ────────────────────────────────────────────────
async function getToken(): Promise<string | null> {
  if (MOCK_API) return 'mock-token'
  try {
    const { supabase } = await import('./supabase')
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

// ── Core fetcher ────────────────────────────────────────────────
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (res.status === 402) {
    const sessionMatch = path.match(/\/api\/sessions\/([^/]+)/)
    emitPaywall(sessionMatch?.[1])
    throw { code: 'payment_required', message: 'Upgrade to continue', status: 402 } as ApiError
  }

  if (res.status === 429) {
    throw {
      code: 'rate_limited',
      message: "Whoa, slow down a little — give it a moment and try again.",
      status: 429,
    } as ApiError
  }

  if (!res.ok) {
    let body: { error?: { code: string; message: string } } = {}
    try { body = await res.json() } catch {}
    throw {
      code: body.error?.code ?? 'unknown',
      message: body.error?.message ?? 'Something went wrong — try again in a moment.',
      status: res.status,
    } as ApiError
  }

  return res.json() as Promise<T>
}

// ── Delay helper for mock mode ──────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ── API methods ─────────────────────────────────────────────────
export const api = {
  async createSession(
    resume: File,
    jobDescriptionText: string,
    consentTraining: boolean
  ): Promise<{ session: Session }> {
    if (MOCK_API) {
      await delay(3200)
      return { session: MOCK_SESSION }
    }
    const fd = new FormData()
    fd.append('resume', resume)
    fd.append('job_description_text', jobDescriptionText)
    fd.append('consent_training', String(consentTraining))
    return apiFetch('/api/sessions', { method: 'POST', body: fd })
  },

  async getSession(id: string): Promise<{ session: Session; attempts: Attempt[] }> {
    if (MOCK_API) {
      await delay(400)
      return { session: MOCK_SESSION, attempts: [MOCK_ATTEMPT] }
    }
    return apiFetch(`/api/sessions/${id}`)
  },

  async listSessions(): Promise<{ sessions: Array<Pick<Session, 'id' | 'company_name' | 'job_title' | 'status' | 'created_at'>> }> {
    if (MOCK_API) {
      await delay(600)
      return { sessions: MOCK_SESSIONS }
    }
    return apiFetch('/api/sessions')
  },

  async createAttempt(
    sessionId: string,
    questionIndex: number,
    audio: Blob
  ): Promise<{ attempt: Attempt; summary: string }> {
    if (MOCK_API) {
      await delay(2800)
      return { attempt: MOCK_ATTEMPT, summary: MOCK_ATTEMPT.summary ?? '' }
    }
    const fd = new FormData()
    fd.append('audio', audio, 'recording.webm')
    fd.append('question_index', String(questionIndex))
    return apiFetch(`/api/sessions/${sessionId}/attempts`, { method: 'POST', body: fd })
  },

  async generateCheatSheet(sessionId: string): Promise<{ cheat_sheet: CheatSheet; download_url: string }> {
    if (MOCK_API) {
      await delay(2400)
      return { cheat_sheet: MOCK_CHEAT_SHEET, download_url: '#' }
    }
    return apiFetch(`/api/sessions/${sessionId}/cheat-sheet`, { method: 'POST' })
  },

  async sendEmail(sessionId: string, to?: string): Promise<{ sent: boolean; to: string }> {
    if (MOCK_API) {
      await delay(800)
      return { sent: true, to: to ?? 'alex@example.com' }
    }
    return apiFetch(`/api/sessions/${sessionId}/email`, {
      method: 'POST',
      body: JSON.stringify({ to }),
    })
  },

  async createCheckout(plan: 'one_time' | 'subscription', sessionId?: string): Promise<{ url: string }> {
    if (MOCK_API) {
      await delay(600)
      return { url: '/pricing?demo=1' }
    }
    return apiFetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan, session_id: sessionId }),
    })
  },

  async sendCheatSheetEmail(sessionId: string, to?: string): Promise<{ sent: boolean; to: string }> {
    return api.sendEmail(sessionId, to)
  },

  async checkout(options: { plan: 'one_time' | 'subscription'; session_id?: string }): Promise<{ url: string }> {
    return api.createCheckout(options.plan, options.session_id)
  },

  async submitAttempt(sessionId: string, formData: FormData): Promise<{ attempt: Attempt; summary: string }> {
    if (MOCK_API) {
      await delay(2000)
      return { attempt: MOCK_ATTEMPT, summary: 'Great effort! Keep building confidence.' }
    }
    return apiFetch(`/api/sessions/${sessionId}/attempts`, { method: 'POST', body: formData })
  },
}
