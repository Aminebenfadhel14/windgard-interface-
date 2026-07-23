'use client'

import { createClient } from '@supabase/supabase-js'

// Gracefully handles missing env vars — mock mode works without them
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type SupabaseUser = Awaited<
  ReturnType<typeof supabase.auth.getUser>
>['data']['user']
