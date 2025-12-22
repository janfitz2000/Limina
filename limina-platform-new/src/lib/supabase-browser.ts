import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.io'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Use window-based singleton to avoid multiple GoTrueClient instances
// This is necessary because Next.js code splitting can load this module multiple times
const SUPABASE_CLIENT_KEY = '__SUPABASE_CLIENT__'

declare global {
  interface Window {
    [SUPABASE_CLIENT_KEY]?: ReturnType<typeof createBrowserClient<Database>>
  }
}

export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side: create new client each time (will be garbage collected)
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  // Client-side: use window-based singleton
  if (!window[SUPABASE_CLIENT_KEY]) {
    window[SUPABASE_CLIENT_KEY] = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return window[SUPABASE_CLIENT_KEY]
}
