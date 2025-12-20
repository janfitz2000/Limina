import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Default demo keys for development
const defaultUrl = 'https://demo.supabase.io'
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const defaultServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

let _supabase: SupabaseClient<Database> | null = null
let _supabaseAdmin: SupabaseClient<Database> | null = null

function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || defaultServiceKey
  }
}

// Client-side Supabase client with auth enabled (lazy-loaded)
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    if (!_supabase) {
      const { url, anonKey } = getConfig()
      _supabase = createClient<Database>(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    }
    return (_supabase as any)[prop]
  }
})

// Server-side Supabase client with service role (for admin operations) (lazy-loaded)
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      const { url, serviceKey } = getConfig()
      _supabaseAdmin = createClient<Database>(url, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    }
    return (_supabaseAdmin as any)[prop]
  }
})
