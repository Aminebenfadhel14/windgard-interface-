'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { ToastContainer } from './toast-container'
import { PaywallModal } from './paywall-modal'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
          mutations: { retry: 0 },
        },
      })
  )

  // Apply stored theme immediately to avoid flash
  useEffect(() => {
    const stored = localStorage.getItem('pivot-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || ((!stored || stored === 'system') && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastContainer />
      <PaywallModal />
    </QueryClientProvider>
  )
}
