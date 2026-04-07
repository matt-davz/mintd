import { useAuth } from '@clerk/clerk-react'
import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

/**
 * Returns a Supabase client that attaches the Clerk session JWT on every
 * request. Use this in admin components instead of the shared anon client.
 * Supabase verifies the token via the Clerk third-party auth integration,
 * enabling RLS policies that check auth.role() = 'authenticated'.
 */
export function useSupabaseClient() {
  const { getToken } = useAuth()

  return useMemo(() => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken({ template: 'supabase' })
        const headers = new Headers(options?.headers)
        if (token) headers.set('Authorization', `Bearer ${token}`)
        return fetch(url, { ...options, headers })
      },
    },
  }), [getToken])
}
