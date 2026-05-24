import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''

// Browser-side Supabase client (singleton).
// IMPORTANT: there must be exactly ONE GoTrueClient per storage key in the browser.
// Creating a second client on the same key makes them contend on the same
// navigator.locks auth lock, which can DEADLOCK getSession() during logout/login
// transitions (symptom: the app hangs forever on the "connecting" loader).
let browserClient: SupabaseClient<Database> | null = null

function getOrCreateBrowserClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabaseKey) return null
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return browserClient
}

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient should only be called on the client side')
  }
  return getOrCreateBrowserClient()
}

// Shared client export. On the browser this is the SAME singleton as
// getSupabaseBrowserClient() (one GoTrueClient — avoids the multi-instance auth
// deadlock). On the server it's a stateless anon client (no session persistence,
// no auto-refresh, so it never spins up a competing token-refresh lock).
export const supabase: SupabaseClient<Database> | null =
  typeof window !== 'undefined'
    ? getOrCreateBrowserClient()
    : supabaseUrl && supabaseKey
      ? createClient<Database>(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null
