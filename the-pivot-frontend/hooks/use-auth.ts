'use client'

import { useState, useEffect } from 'react'
import { MOCK_API } from '@/lib/api'
import { MOCK_USER } from '@/lib/mock-data'

export interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(MOCK_API ? MOCK_USER : null)
  const [loading, setLoading] = useState(!MOCK_API)

  useEffect(() => {
    if (MOCK_API) return

    let mounted = true
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted) {
          setUser((session?.user as AuthUser) ?? null)
          setLoading(false)
        }
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_, session) => {
          if (mounted) setUser((session?.user as AuthUser) ?? null)
        }
      )

      return () => { mounted = false; subscription.unsubscribe() }
    })
  }, [])

  async function signInWithMagicLink(email: string): Promise<void> {
    if (MOCK_API) {
      setUser(MOCK_USER)
      return
    }
    const { supabase } = await import('@/lib/supabase')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    if (error) throw new Error(error.message)
  }

  async function signInWithGoogle(): Promise<void> {
    if (MOCK_API) {
      setUser(MOCK_USER)
      return
    }
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
  }

  async function signOut(): Promise<void> {
    if (MOCK_API) {
      setUser(null)
      return
    }
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, loading, signInWithMagicLink, signInWithGoogle, signOut }
}
