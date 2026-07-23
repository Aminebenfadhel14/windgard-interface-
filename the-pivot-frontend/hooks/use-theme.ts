'use client'

import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  root.classList.toggle('dark', isDark)
  root.classList.toggle('light', !isDark)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('pivot-theme') as Theme | null
    const initial: Theme = stored ?? 'system'
    setThemeState(initial)
    applyTheme(initial)

    // Sync with system changes when in system mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      if ((localStorage.getItem('pivot-theme') ?? 'system') === 'system') {
        applyTheme('system')
      }
    }
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('pivot-theme', t)
    applyTheme(t)
  }, [])

  const toggle = useCallback(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }, [setTheme])

  return { theme, setTheme, toggle }
}
