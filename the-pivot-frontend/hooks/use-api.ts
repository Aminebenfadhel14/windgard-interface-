'use client'

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { ApiError } from '@/lib/api'

interface UseApiOptions {
  enabled?: boolean
  [key: string]: any
}

export function useApi<T = any>(
  url: string | null,
  options: UseApiOptions = {}
): UseQueryResult<T, ApiError> {
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      if (!url) throw new Error('No URL provided')

      const { MOCK_API, API_BASE } = await import('@/lib/api')

      // Get token dynamically
      let token = 'mock-token'
      if (!MOCK_API) {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data: { session } } = await supabase.auth.getSession()
          token = session?.access_token ?? 'mock-token'
        } catch (err) {
          // Fall back to mock
        }
      }

      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      // Handle errors
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { code: 'unknown', message: 'Unknown error' } }))
        throw {
          code: error.error?.code || 'network_error',
          message: error.error?.message || response.statusText,
          status: response.status,
        }
      }

      return response.json()
    },
    enabled: !!url && (options.enabled !== false),
    ...options,
  })
}
